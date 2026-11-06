(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.AutarkiBoard = api;
  if (typeof document !== "undefined") {
    var board = document.getElementById("board");
    if (board) api.mount(board);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var RELAY = "wss://165.245.235.36:51911";
  var CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

  function npubFromHex(hex) {
    if (!/^[0-9a-fA-F]{64}$/.test(hex)) return "";
    var bytes = [];
    for (var i = 0; i < 64; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));
    var data = convertBits(bytes, 8, 5, true);
    if (!data) return "";
    var values = hrpExpand("npub").concat(data, [0, 0, 0, 0, 0, 0]);
    var mod = polymod(values) ^ 1;
    var checksum = [];
    for (var p = 0; p < 6; p += 1) checksum.push((mod >>> (5 * (5 - p))) & 31);
    return "npub1" + data.concat(checksum).map(function (v) { return CHARSET.charAt(v); }).join("");
  }

  function polymod(values) {
    var gen = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    var chk = 1;
    values.forEach(function (value) {
      var b = chk >>> 25;
      chk = ((chk & 0x1ffffff) << 5) ^ value;
      for (var i = 0; i < 5; i += 1) {
        if ((b >>> i) & 1) chk ^= gen[i];
      }
    });
    return chk >>> 0;
  }

  function hrpExpand(hrp) {
    var out = [];
    for (var i = 0; i < hrp.length; i += 1) out.push(hrp.charCodeAt(i) >> 5);
    out.push(0);
    for (var j = 0; j < hrp.length; j += 1) out.push(hrp.charCodeAt(j) & 31);
    return out;
  }

  function convertBits(data, from, to, pad) {
    var acc = 0;
    var bits = 0;
    var maxv = (1 << to) - 1;
    var out = [];
    for (var i = 0; i < data.length; i += 1) {
      acc = (acc << from) | data[i];
      bits += from;
      while (bits >= to) {
        bits -= to;
        out.push((acc >> bits) & maxv);
      }
    }
    if (pad && bits) out.push((acc << (to - bits)) & maxv);
    return out;
  }

  function readRelay() {
    return new Promise(function (resolve, reject) {
      var settled = false;
      var events = [];
      var ws;
      var timer = setTimeout(function () {
        finish(reject, new Error("timeout"));
      }, 12000);

      function finish(fn, value) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          if (ws) ws.close();
        } catch (e) {}
        fn(value);
      }

      try {
        ws = new WebSocket(RELAY);
      } catch (error) {
        finish(reject, error);
        return;
      }
      ws.onopen = function () {
        ws.send(JSON.stringify(["REQ", "board", { kinds: [30017, 30018, 30402, 5], limit: 400 }]));
      };
      ws.onmessage = function (message) {
        var frame;
        try {
          frame = JSON.parse(message.data);
        } catch (e) {
          return;
        }
        if (!Array.isArray(frame)) return;
        if (frame[0] === "EVENT" && frame[2] && typeof frame[2] === "object") events.push(frame[2]);
        if (frame[0] === "EOSE") finish(resolve, events);
      };
      ws.onerror = function () {
        finish(reject, new Error("unreachable"));
      };
      ws.onclose = function () {
        if (!settled) finish(reject, new Error("closed"));
      };
    });
  }

  function parseBoard(events) {
    var list = Array.isArray(events) ? events : [];
    var dels = deletions(list);
    var stalls = [];
    var products = [];
    var ads = [];
    var groups = new Map();
    list.forEach(function (event) {
      if (!event || event.kind === 5) return;
      var d = first(event, "d");
      if (!d || removed(event, d, dels)) return;
      var key = hex(event.pubkey) + ":" + event.kind + ":" + d;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(event);
    });
    groups.forEach(function (versions) {
      versions.sort(function (a, b) { return created(a) - created(b); });
      var event = versions[versions.length - 1];
      if (event.kind === 30017 && first(event, "d") === "shop") {
        var stall = stallFrom(event);
        if (stall) stalls.push(stall);
      } else if (event.kind === 30018) {
        var product = productFrom(event);
        if (product) products.push(product);
      } else if (event.kind === 30402) {
        var ad = adFrom(versions);
        if (ad) ads.push(ad);
      }
    });
    stalls.forEach(function (stall) {
      stall.products = products
        .filter(function (product) { return product.pubkey === stall.pubkey; })
        .sort(function (a, b) { return a.name.localeCompare(b.name); });
    });
    stalls.sort(function (a, b) { return a.name.localeCompare(b.name); });
    ads.sort(function (a, b) { return b.publishedAt - a.publishedAt || a.title.localeCompare(b.title); });
    return { stalls: stalls, classifieds: ads };
  }

  function deletions(events) {
    var byA = new Map();
    var byE = new Map();
    events.forEach(function (event) {
      if (!event || event.kind !== 5) return;
      var at = created(event);
      (event.tags || []).forEach(function (tag) {
        if (!tag || !tag[1]) return;
        if (tag[0] === "e") {
          if (at >= (byE.get(tag[1]) || 0)) byE.set(tag[1], at);
        }
        if (tag[0] === "a") {
          var parts = String(tag[1]).split(":");
          if (parts.length < 3) return;
          var key = parts[0] + ":" + parts[1].toLowerCase() + ":" + parts.slice(2).join(":");
          if (at >= (byA.get(key) || 0)) byA.set(key, at);
        }
      });
    });
    return { byA: byA, byE: byE };
  }

  function removed(event, d, dels) {
    var at = created(event);
    if (event.id && dels.byE.has(event.id) && dels.byE.get(event.id) >= at) return true;
    var key = event.kind + ":" + hex(event.pubkey) + ":" + d;
    return dels.byA.has(key) && dels.byA.get(key) >= at;
  }

  function stallFrom(event) {
    var body = jsonBody(event);
    if (!body || body.currency !== "sats") return null;
    var name = cleanName(body.name);
    var pubkey = hex(event.pubkey);
    if (!name || !pubkey) return null;
    var online = body.sale === "online";
    return {
      pubkey: pubkey,
      npub: npubFromHex(pubkey),
      name: name,
      logo: httpsUrl(body.image),
      map: mapUrl(body.map),
      country: line(body.country, 40),
      province: line(body.province, 40),
      city: line(body.place, 40),
      neighbourhood: line(body.neighbourhood, 40),
      categories: words(body.categories),
      online: online,
      taxes: taxes(body),
      tips: body.tips === true ? tipPercents(body.tip_percents) : [],
      tipsOn: body.tips === true,
      deliveries: count(body.deliveries),
      firstDelivery: count(body.first_delivery),
      unfinished: count(body.unfinished),
      shipPostal: online ? line(body.ship_postal, 16) : "",
      shipCc: online ? countryCode(body.ship_cc) : "",
      shipKg: online ? line(body.ship_kg, 12) : "",
      products: []
    };
  }

  function productFrom(event) {
    var body = jsonBody(event);
    var d = first(event, "d");
    var pubkey = hex(event.pubkey);
    if (!body || !pubkey || body.currency !== "sats" || body.stall_id !== "shop") return null;
    if (!productId(d) || body.id !== d) return null;
    var name = cleanName(body.name);
    var price = whole(body.price);
    if (!name || !price) return null;
    var images = Array.isArray(body.images) ? body.images : [];
    return {
      pubkey: pubkey,
      name: name,
      price: price,
      about: about(body.description),
      picture: httpsUrl(images[0])
    };
  }

  function adFrom(versions) {
    var event = versions[versions.length - 1];
    var d = first(event, "d");
    var pubkey = hex(event.pubkey);
    if (!pubkey || !dOk(d)) return null;
    var status = adStatus(first(event, "status"));
    if (!status || status === "canceled") return null;
    var source = event;
    if (status !== "active" && status !== "held" && !first(event, "title")) {
      for (var i = versions.length - 2; i >= 0; i -= 1) {
        if (first(versions[i], "title")) {
          source = versions[i];
          break;
        }
      }
    }
    if ((status === "active" || status === "held") && source === event) {
      var content = String(event.content || "");
      if ([...content].length > 4000) return null;
      var title = line(first(event, "title"), 80);
      if (!title) return null;
    }
    var titleNow = line(first(source, "title"), 80);
    if ((status === "active" || status === "held") && !titleNow) return null;
    var body = status === "sold" && source !== event ? String(source.content || "") : String(event.content || "");
    if (source !== event && status === "sold") body = String(source.content || "");
    if ([...body].length > 4000) body = "";
    var price = priceOf(source.tags || []);
    var ship = shipOf(source.tags || []);
    return {
      pubkey: pubkey,
      npub: npubFromHex(pubkey),
      d: d,
      status: status,
      title: titleNow,
      summary: line(first(source, "summary"), 280),
      body: plain(body),
      pictures: pictures(source),
      country: line(first(source, "country"), 40),
      province: line(first(source, "province"), 40),
      city: line(first(source, "location"), 40),
      neighbourhood: line(first(source, "neighbourhood"), 40),
      categories: categoriesOf(source),
      price: price.sats,
      coin: price.coin,
      priceText: price.text,
      map: mapUrl(first(source, "map")),
      shipDays: ship.days,
      hold: ship.hold,
      postal: ship.days ? line(first(source, "postal"), 16) : "",
      cc: ship.days ? countryCode(first(source, "cc")) : "",
      kg: ship.days ? line(first(source, "kg"), 12) : "",
      publishedAt: count(first(source, "published_at"))
    };
  }

  function adStatus(value) {
    if (!value) return "active";
    if (value === "active" || value === "held" || value === "sold" || value === "canceled") return value;
    return "";
  }

  function priceOf(tags) {
    var tag = tags.find(function (item) { return item && item[0] === "price"; });
    if (!tag) return { sats: 0, coin: "", text: "" };
    var sats = whole(tag[1]);
    var coin = tag[2] === "xbt" || tag[2] === "btc" ? tag[2] : "";
    if (sats && coin) return { sats: sats, coin: coin, text: "" };
    return { sats: 0, coin: "", text: tag.slice(1).join(" ").trim() };
  }

  function shipOf(tags) {
    var days = whole(firstTags(tags, "ship_days"));
    var hold = firstTags(tags, "hold");
    if (days < 1 || days > 4) return { days: 0, hold: "" };
    if (hold !== "domestic" && hold !== "overseas") return { days: 0, hold: "" };
    return { days: days, hold: hold };
  }

  function pictures(event) {
    var out = [];
    (event.tags || []).forEach(function (tag) {
      if (!tag || tag[0] !== "image" || out.length === 4) return;
      var url = httpsUrl(tag[1]);
      if (url) out.push(url);
    });
    return out;
  }

  function categoriesOf(event) {
    var out = [];
    (event.tags || []).forEach(function (tag) {
      if (!tag || tag[0] !== "t" || out.length === 4) return;
      var word = line(tag[1], 24);
      if (!word || word.indexOf(",") !== -1) return;
      if (out.some(function (have) { return have.toLowerCase() === word.toLowerCase(); })) return;
      out.push(word);
    });
    return out;
  }

  function taxes(body) {
    var rows = [];
    pushTax(rows, body.federal_name, body.federal_rate);
    pushTax(rows, body.state_name, body.state_rate);
    return rows;
  }

  function pushTax(rows, name, rate) {
    var label = line(name, 40);
    var figure = rateText(rate);
    if (!label && !figure) return;
    rows.push({ name: label, rate: figure });
  }

  function rateText(value) {
    var text = String(value == null ? "" : value).trim();
    if (!/^\d{1,3}(\.\d{1,3})?$/.test(text)) return "";
    if (text === "0") return "";
    return text;
  }

  function tipPercents(list) {
    var out = [];
    if (!Array.isArray(list)) return out;
    list.forEach(function (item) {
      var n = whole(item);
      if (!n || n > 100 || out.indexOf(n) !== -1) return;
      out.push(n);
      if (out.length > 4) out.length = 4;
    });
    return out;
  }

  function words(list) {
    var out = [];
    if (!Array.isArray(list)) return out;
    list.forEach(function (item) {
      var word = line(item, 24);
      if (!word || word.indexOf(",") !== -1) return;
      if (out.some(function (have) { return have.toLowerCase() === word.toLowerCase(); })) return;
      out.push(word);
      if (out.length > 4) out.length = 4;
    });
    return out;
  }

  function mount(board) {
    var status = board.querySelector("[data-board-status]");
    var tools = board.querySelector("[data-board-tools]");
    var state = { stalls: [], classifieds: [] };
    var filters = { query: "", stall: "", ad: "" };
    status.textContent = "Reading the relay.";
    readRelay().then(function (events) {
      state = parseBoard(events);
      tools.hidden = false;
      paint();
      var total = state.stalls.length + state.classifieds.length;
      status.textContent = total
        ? "Read from the relay, then the connection was closed. Nothing was stored on this site."
        : "The relay answered. No stall or classified is published. Nothing was stored on this site.";
    }).catch(function () {
      tools.hidden = true;
      status.textContent = "The relay did not answer. This page asked " + RELAY + " and then stopped. Ordinary browsers reject that certificate: it is issued to localhost by the StartOS local authority. The board can be read in a browser that already trusts that authority. A public hostname on port 443, with a certificate browsers already trust, has to forward to the relay before everyone else can read it. This site did not keep a copy.";
    });

    var form = board.querySelector("form");
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
      });
    }
    board.querySelector("[data-board-query]").addEventListener("input", function (event) {
      filters.query = event.target.value.trim().toLowerCase();
      paint();
    });

    function paint() {
      var stallCats = unique(state.stalls.flatMap(function (stall) { return stall.categories; }));
      var adCats = unique(state.classifieds.flatMap(function (ad) { return ad.categories; }));
      chips(board.querySelector("[data-stall-chips]"), stallCats, filters.stall, function (value) {
        filters.stall = value;
        paint();
      });
      chips(board.querySelector("[data-ad-chips]"), adCats, filters.ad, function (value) {
        filters.ad = value;
        paint();
      });
      var stalls = state.stalls.filter(function (stall) {
        return categoryOk(stall.categories, filters.stall) && stallMatches(stall, filters.query);
      }).map(function (stall) {
        return { stall: stall, products: visibleProducts(stall, filters.query) };
      });
      var ads = state.classifieds.filter(function (ad) {
        return categoryOk(ad.categories, filters.ad) && adMatches(ad, filters.query);
      });
      fillStalls(board.querySelector("[data-stall-list]"), stalls, filters.query);
      fillAds(board.querySelector("[data-ad-list]"), ads, state.stalls, filters.query);
      setCount(board.querySelector("[data-stall-count]"), stalls.length);
      setCount(board.querySelector("[data-ad-count]"), ads.length);
    }
  }

  function setCount(node, n) {
    if (node) node.textContent = String(n);
  }

  function chips(row, names, selected, onPick) {
    row.replaceChildren();
    if (!names.length) {
      row.hidden = true;
      return;
    }
    row.hidden = false;
    ["All"].concat(names).forEach(function (name) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = name;
      var on = name === "All" ? selected === "" : selected.toLowerCase() === name.toLowerCase();
      button.setAttribute("aria-pressed", on ? "true" : "false");
      button.addEventListener("click", function () {
        onPick(name === "All" ? "" : name);
      });
      row.appendChild(button);
    });
  }

  function fillStalls(list, rows, query) {
    list.replaceChildren();
    if (!rows.length) {
      list.appendChild(empty(query ? "No stall matches." : "No stall is published."));
      return;
    }
    rows.forEach(function (row) {
      list.appendChild(stallCard(row.stall, row.products));
    });
  }

  function fillAds(list, ads, stalls, query) {
    list.replaceChildren();
    if (!ads.length) {
      list.appendChild(empty(query ? "No classified matches." : "No classified is published."));
      return;
    }
    ads.forEach(function (ad) {
      var shop = stalls.find(function (stall) { return stall.pubkey === ad.pubkey; });
      list.appendChild(adCard(ad, shop));
    });
  }

  function stallCard(stall, products) {
    var card = document.createElement("details");
    card.className = "board-card";
    var summary = document.createElement("summary");
    var top = document.createElement("div");
    top.className = "card-top";
    addImage(top, stall.logo, "logo");
    var heading = document.createElement("div");
    var title = document.createElement("h3");
    title.textContent = stall.name;
    heading.appendChild(title);
    var place = placeLine(stall);
    if (place) {
      var where = document.createElement("p");
      where.className = "place-line";
      where.textContent = place;
      heading.appendChild(where);
    }
    var meta = document.createElement("p");
    meta.className = "card-meta";
    meta.textContent = (stall.online ? "Online" : "Counter") + " · " + products.length + (products.length === 1 ? " product" : " products");
    heading.appendChild(meta);
    if (stall.categories.length) {
      var cats = document.createElement("p");
      cats.className = "card-meta";
      cats.textContent = stall.categories.join(", ");
      heading.appendChild(cats);
    }
    top.appendChild(heading);
    summary.appendChild(top);
    card.appendChild(summary);
    card.appendChild(facts(stallFacts(stall)));
    var grid = document.createElement("div");
    grid.className = "products";
    products.forEach(function (product) { grid.appendChild(productCard(product)); });
    card.appendChild(grid);
    card.appendChild(orderBlock(stall.name, stall.npub));
    return card;
  }

  function productCard(product) {
    var card = document.createElement("article");
    card.className = "product";
    addImage(card, product.picture, "");
    var body = document.createElement("div");
    var title = document.createElement("h3");
    title.textContent = product.name;
    body.appendChild(title);
    var price = document.createElement("p");
    price.className = "price";
    price.textContent = sats(product.price);
    body.appendChild(price);
    if (product.about) {
      var about = document.createElement("p");
      about.className = "summary";
      about.textContent = product.about;
      body.appendChild(about);
    }
    var action = document.createElement("p");
    action.className = "more";
    var link = document.createElement("a");
    link.href = "install.html";
    link.textContent = "Install Autarki to order";
    action.appendChild(link);
    body.appendChild(action);
    card.appendChild(body);
    return card;
  }

  function adCard(ad, shop) {
    var card = document.createElement("details");
    card.className = "board-card";
    var summary = document.createElement("summary");
    var top = document.createElement("div");
    top.className = "card-top";
    addImage(top, ad.pictures[0], "ad-thumb");
    var heading = document.createElement("div");
    var title = document.createElement("h3");
    title.textContent = ad.title || "Classified";
    heading.appendChild(title);
    if (ad.status === "sold" || ad.status === "held") {
      var mark = document.createElement("p");
      mark.className = "sold";
      mark.textContent = ad.status === "sold" ? "Sold." : "Held.";
      heading.appendChild(mark);
    } else if (ad.price) {
      var price = document.createElement("p");
      price.className = "price";
      price.textContent = sats(ad.price) + " · " + ad.coin.toUpperCase();
      heading.appendChild(price);
    } else if (ad.priceText) {
      var raw = document.createElement("p");
      raw.className = "price";
      raw.textContent = ad.priceText;
      heading.appendChild(raw);
    }
    var place = placeLine(ad);
    if (place) {
      var where = document.createElement("p");
      where.className = "place-line";
      where.textContent = place;
      heading.appendChild(where);
    }
    if (ad.summary) {
      var summaryText = document.createElement("p");
      summaryText.className = "summary";
      summaryText.textContent = ad.summary;
      heading.appendChild(summaryText);
    }
    top.appendChild(heading);
    summary.appendChild(top);
    card.appendChild(summary);
    if (ad.body) {
      var text = document.createElement("p");
      text.className = "ad-body";
      text.textContent = ad.body;
      card.appendChild(text);
    }
    if (ad.pictures.length) {
      var pics = document.createElement("div");
      pics.className = "ad-pictures";
      ad.pictures.forEach(function (url) { addImage(pics, url, ""); });
      card.appendChild(pics);
    }
    card.appendChild(facts(adFacts(ad)));
    if (ad.status === "active") card.appendChild(orderBlock(shop ? shop.name : "", ad.npub));
    return card;
  }

  function orderBlock(shopName, npub) {
    var block = document.createElement("div");
    block.className = "order-path";
    var action = document.createElement("a");
    action.className = "button";
    action.href = "install.html";
    action.textContent = "Install Autarki to order";
    block.appendChild(action);
    if (shopName) {
      var name = document.createElement("p");
      name.textContent = shopName;
      block.appendChild(name);
    }
    if (npub) {
      var row = document.createElement("p");
      row.className = "public-name";
      var code = document.createElement("code");
      code.textContent = npub.slice(0, 12) + "..." + npub.slice(-6);
      code.title = npub;
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "Copy the public name");
      button.addEventListener("click", function () {
        copyText(npub).then(function () {
          button.textContent = "Copied";
          setTimeout(function () { button.textContent = "Copy"; }, 1600);
        });
      });
      row.appendChild(code);
      row.appendChild(button);
      block.appendChild(row);
    }
    var hint = document.createElement("p");
    hint.className = "quiet";
    hint.textContent = "Open Shop in Autarki and search this name.";
    block.appendChild(hint);
    return block;
  }

  function facts(rows) {
    var list = document.createElement("dl");
    list.className = "facts";
    rows.forEach(function (row) {
      if (!row.value) return;
      var term = document.createElement("dt");
      term.textContent = row.label;
      var value = document.createElement("dd");
      if (row.href) {
        var link = document.createElement("a");
        link.href = row.href;
        link.rel = "noopener noreferrer";
        link.textContent = "Map";
        value.appendChild(link);
      } else {
        value.textContent = row.value;
      }
      list.appendChild(term);
      list.appendChild(value);
    });
    return list;
  }

  function stallFacts(stall) {
    var rows = [
      { label: "Country", value: stall.country },
      { label: "Province", value: stall.province },
      { label: "City", value: stall.city },
      { label: "Neighbourhood", value: stall.neighbourhood },
      { label: "Sale", value: stall.online ? "Online" : "Counter" },
      { label: "Map", value: stall.map ? "Map" : "", href: stall.map }
    ];
    stall.taxes.forEach(function (tax) {
      rows.push({ label: "Tax", value: taxLine(tax) });
    });
    if (stall.tipsOn) {
      rows.push({ label: "Tips", value: stall.tips.length ? stall.tips.map(function (n) { return n + "%"; }).join(", ") : "On" });
    }
    if (stall.deliveries) {
      var text = stall.deliveries + (stall.deliveries === 1 ? " shipment received" : " shipments received");
      if (stall.firstDelivery) text += ". First on " + day(stall.firstDelivery);
      if (stall.unfinished) text += ". " + stall.unfinished + " not received";
      rows.push({ label: "Deliveries", value: text });
    }
    if (stall.online && (stall.shipPostal || stall.shipCc || stall.shipKg)) {
      rows.push({ label: "Ships from", value: [stall.shipPostal, stall.shipCc, stall.shipKg ? stall.shipKg + " kg" : ""].filter(Boolean).join(", ") });
    }
    if (stall.categories.length) rows.push({ label: "Categories", value: stall.categories.join(", ") });
    return rows;
  }

  function adFacts(ad) {
    var rows = [
      { label: "Country", value: ad.country },
      { label: "Province", value: ad.province },
      { label: "City", value: ad.city },
      { label: "Neighbourhood", value: ad.neighbourhood },
      { label: "Categories", value: ad.categories.join(", ") },
      { label: "Map", value: ad.map ? "Map" : "", href: ad.map }
    ];
    if (ad.shipDays) {
      rows.push({ label: "Ship by", value: ad.shipDays + (ad.shipDays === 1 ? " day" : " days") });
      rows.push({ label: "Hold", value: ad.hold === "overseas" ? "28 days overseas" : "14 days at home" });
    }
    if (ad.postal || ad.cc || ad.kg) {
      rows.push({ label: "Origin", value: [ad.postal, ad.cc, ad.kg ? ad.kg + " kg" : ""].filter(Boolean).join(", ") });
    }
    if (ad.publishedAt) rows.push({ label: "Published", value: day(ad.publishedAt) });
    return rows;
  }

  function addImage(parent, url, className) {
    if (!url) return;
    var img = document.createElement("img");
    if (className) img.className = className;
    img.alt = "";
    img.hidden = true;
    img.referrerPolicy = "no-referrer";
    img.decoding = "async";
    img.onload = function () { img.hidden = false; };
    img.onerror = function () { img.remove(); };
    img.src = url;
    parent.appendChild(img);
  }

  function empty(text) {
    var p = document.createElement("p");
    p.className = "empty-list";
    p.textContent = text;
    return p;
  }

  function placeLine(item) {
    return [item.city, item.province, item.country, item.neighbourhood].filter(Boolean).join(", ");
  }

  function taxLine(tax) {
    if (tax.name && tax.rate) return tax.name + " " + tax.rate + "%";
    if (tax.rate) return tax.rate + "%";
    return tax.name;
  }

  function sats(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " sats";
  }

  function day(unix) {
    var date = new Date(unix * 1000);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  }

  function stallMatches(stall, query) {
    if (!query) return true;
    var shop = [stall.name, stall.country, stall.province, stall.city, stall.neighbourhood].join("\n").toLowerCase();
    if (shop.indexOf(query) !== -1) return true;
    return stall.products.some(function (product) { return product.name.toLowerCase().indexOf(query) !== -1; });
  }

  function visibleProducts(stall, query) {
    if (!query) return stall.products;
    var shop = [stall.name, stall.country, stall.province, stall.city, stall.neighbourhood].join("\n").toLowerCase();
    if (shop.indexOf(query) !== -1) return stall.products;
    return stall.products.filter(function (product) { return product.name.toLowerCase().indexOf(query) !== -1; });
  }

  function adMatches(ad, query) {
    if (!query) return true;
    var text = [ad.title, ad.summary, ad.body, ad.country, ad.province, ad.city, ad.neighbourhood].join("\n").toLowerCase();
    return text.indexOf(query) !== -1;
  }

  function categoryOk(categories, selected) {
    if (!selected) return true;
    return categories.some(function (word) { return word.toLowerCase() === selected.toLowerCase(); });
  }

  function unique(words) {
    var out = [];
    words.forEach(function (word) {
      if (!out.some(function (have) { return have.toLowerCase() === word.toLowerCase(); })) out.push(word);
    });
    return out.sort(function (a, b) { return a.localeCompare(b); });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return copyFallback(text); });
    }
    return copyFallback(text);
  }

  function copyFallback(text) {
    return new Promise(function (resolve) {
      var area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      resolve();
    });
  }

  function jsonBody(event) {
    try {
      var value = JSON.parse(event.content || "");
      return value && typeof value === "object" ? value : null;
    } catch (e) {
      return null;
    }
  }

  function first(event, name) {
    return firstTags(event.tags || [], name);
  }

  function firstTags(tags, name) {
    for (var i = 0; i < tags.length; i += 1) {
      if (tags[i] && tags[i][0] === name && tags[i][1]) return String(tags[i][1]);
    }
    return "";
  }

  function created(event) {
    var n = Number(event.created_at);
    return Number.isFinite(n) ? n : 0;
  }

  function hex(value) {
    var text = String(value || "").toLowerCase();
    return /^[0-9a-f]{64}$/.test(text) ? text : "";
  }

  function cleanName(value) {
    var text = line(value, 80);
    return text;
  }

  function line(value, max) {
    var text = String(value == null ? "" : value).trim();
    if (!text || [...text].length > max) return "";
    if ([...text].some(function (ch) { return ch.charCodeAt(0) < 32 || ch === "\u2028" || ch === "\u2029"; })) return "";
    return text;
  }

  function about(value) {
    var text = line(value, 400);
    return text.indexOf("\n") === -1 ? text : "";
  }

  function plain(value) {
    var text = String(value || "");
    if ([...text].some(function (ch) {
      return ch === "\u0000" || ch === "\u2028" || ch === "\u2029";
    })) return "";
    return text;
  }

  function whole(value) {
    if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
    var text = String(value == null ? "" : value).trim();
    if (!/^[1-9]\d*$/.test(text)) return 0;
    var n = Number(text);
    return Number.isSafeInteger(n) ? n : 0;
  }

  function count(value) {
    if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
    var text = String(value == null ? "" : value).trim();
    if (!/^\d+$/.test(text)) return 0;
    var n = Number(text);
    return Number.isSafeInteger(n) ? n : 0;
  }

  function productId(value) {
    return /^[0-9a-f]{16}$/.test(value);
  }

  function dOk(value) {
    return !!value && value.length <= 256 && !/[\s\u0000-\u001f]/.test(value);
  }

  function countryCode(value) {
    var text = line(value, 2);
    return /^[A-Za-z]{2}$/.test(text) ? text.toUpperCase() : "";
  }

  function httpsUrl(value) {
    var text = String(value || "").trim();
    if (!text.startsWith("https://") || text.length > 2000) return "";
    if (/[\s<>]/.test(text)) return "";
    try {
      var url = new URL(text);
      return url.protocol === "https:" ? text : "";
    } catch (e) {
      return "";
    }
  }

  function mapUrl(value) {
    var text = httpsUrl(value);
    if (!text || text.length > 800) return "";
    var url;
    try { url = new URL(text); } catch (e) { return ""; }
    var host = url.hostname.toLowerCase();
    var path = url.pathname + url.search + url.hash;
    if (host === "maps.app.goo.gl") {
      return /^\/[A-Za-z0-9_-]+$/.test(url.pathname) && !url.search ? text : "";
    }
    if (host === "goo.gl") return url.pathname.indexOf("/maps/") === 0 ? text : "";
    if (host === "google.com" || host === "www.google.com" || host === "maps.google.com") {
      return url.pathname === "/maps" || url.pathname.indexOf("/maps/") === 0 ? text : "";
    }
    if (host === "maps.apple.com" || host === "openstreetmap.org" || host === "www.openstreetmap.org") return text;
    return path ? "" : "";
  }

  return { parseBoard: parseBoard, npubFromHex: npubFromHex, readRelay: readRelay, mount: mount };
});
