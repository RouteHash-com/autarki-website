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
  var RELAY = "wss://165.245.235.36:8444";
  var quotes = null;
  var PROFILE_RELAYS = [
    "wss://nos.lol",
    "wss://relay.damus.io",
    "wss://relay.primal.net",
    "wss://purplepag.es"
  ];
  var CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  var REFUSED = [
    "childporn",
    "underagesex",
    "csam",
    "sexualminor",
    "firearm",
    "handgun",
    "ammunition",
    "cocaine",
    "heroin",
    "fentanyl",
    "methamphetamine",
    "escortservice",
    "guaranteedreturn",
    "guaranteedprofit"
  ];

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

  function readSocket(url, id, filters, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      var events = [];
      var ws;
      var timer = setTimeout(function () {
        finish(reject, new Error("timeout"));
      }, timeoutMs);

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
        ws = new WebSocket(url);
      } catch (error) {
        finish(reject, error);
        return;
      }
      ws.onopen = function () {
        ws.send(JSON.stringify(["REQ", id].concat(filters)));
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

  function readRelay() {
    return readSocket(RELAY, "board", [
      { kinds: [30017, 30018, 30402, 5], limit: 400 },
      { kinds: [0, 10011], limit: 200 }
    ], 12000);
  }

  function readProfiles(authors) {
    if (!authors.length) return Promise.resolve([]);
    var filter = [{ kinds: [0], authors: authors, limit: Math.min(80, Math.max(authors.length * 4, 4)) }];
    return Promise.all(PROFILE_RELAYS.map(function (url) {
      return readSocket(url, "names", filter, 8000).catch(function () { return []; });
    })).then(function (lists) {
      var out = [];
      lists.forEach(function (list) {
        list.forEach(function (event) {
          if (event && event.kind === 0 && authors.indexOf(hex(event.pubkey)) !== -1) out.push(event);
        });
      });
      return out;
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
      if (!event || event.kind === 5 || event.kind === 1984) return;
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
    var profiles = profilesByPubkey(list, dels);
    var discords = discordByPubkey(list, dels);
    stalls.forEach(function (stall) {
      stall.products = products
        .filter(function (product) { return product.pubkey === stall.pubkey; })
        .sort(function (a, b) { return a.name.localeCompare(b.name); });
      attachPerson(stall, profiles, discords);
    });
    ads.forEach(function (ad) { attachPerson(ad, profiles, discords); });
    stalls.sort(function (a, b) { return a.name.localeCompare(b.name); });
    ads.sort(function (a, b) { return b.publishedAt - a.publishedAt || a.title.localeCompare(b.title); });
    return { stalls: stalls, classifieds: ads };
  }

  function flatNote(text) {
    var lower = String(text || "").toLowerCase();
    var out = "";
    for (var i = 0; i < lower.length; i++) {
      var code = lower.charCodeAt(i);
      if ((code >= 48 && code <= 57) || (code >= 97 && code <= 122)) out += lower.charAt(i);
    }
    return out;
  }

  function postingRefused(text) {
    var flat = flatNote(text);
    for (var i = 0; i < REFUSED.length; i++) {
      if (flat.indexOf(REFUSED[i]) !== -1) return true;
    }
    return false;
  }

  function noteRefused(parts) {
    var full = (1 << parts.length) - 1;
    function walk(used, built) {
      if (used === full) return postingRefused(built);
      for (var i = 0; i < parts.length; i++) {
        if (used & (1 << i)) continue;
        if (walk(used | (1 << i), built + (parts[i] || ""))) return true;
      }
      return false;
    }
    return walk(0, "");
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
      roomXbt: whole(body.room_xbt),
      roomBtc: whole(body.room_btc),
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
    if (String(event.content || "").indexOf("Available only on Autarki;") === 0) return null;
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
    var body = status === "sold" && source !== event ? String(source.content || "") : String(event.content || "");
    if (source !== event && status === "sold") body = String(source.content || "");
    if ((status === "active" || status === "held") && [...body].length > 4000) return null;
    var titleNow = strictLine(rawTag(source, "title"), 80);
    if (titleNow === null) return null;
    if ((status === "active" || status === "held") && !titleNow) return null;
    var summary = optionalTag(source, "summary", 280);
    var country = optionalTag(source, "country", 40);
    var province = optionalTag(source, "province", 40);
    var city = optionalTag(source, "location", 40);
    var neighbourhood = optionalTag(source, "neighbourhood", 40);
    if (summary === null || country === null || province === null || city === null || neighbourhood === null) return null;
    if (noteRefused([titleNow, summary, body, city, neighbourhood])) return null;
    if ([...body].length > 4000) body = "";
    else body = plain(body);
    var price = priceOf(source.tags || []);
    var ship = shipOf(source.tags || []);
    var categories = categoriesOf(source);
    var side = jobSide(source.tags || [], categories);
    var pays = payOf(source.tags || [], price.coin);
    return {
      pubkey: pubkey,
      npub: npubFromHex(pubkey),
      d: d,
      status: status,
      title: titleNow,
      summary: summary,
      body: body,
      pictures: pictures(source),
      country: country,
      province: province,
      city: city,
      neighbourhood: neighbourhood,
      categories: categories,
      price: price.sats,
      coin: price.coin,
      priceText: price.text,
      unpaid: !!(price.sats && side !== "hire" && !pays.xbt && !pays.btc),
      map: mapUrl(first(source, "map")),
      shipDays: ship.days,
      hold: ship.hold,
      postal: ship.days ? line(first(source, "postal"), 16) : "",
      cc: ship.days ? countryCode(first(source, "cc")) : "",
      kg: ship.days ? line(first(source, "kg"), 12) : "",
      publishedAt: count(first(source, "published_at")),
      createdAt: created(event)
    };
  }

  function rawTag(event, name) {
    var tags = event && event.tags ? event.tags : [];
    for (var i = 0; i < tags.length; i += 1) {
      if (tags[i] && tags[i][0] === name && tags[i].length >= 2) return String(tags[i][1]);
    }
    return null;
  }

  function strictLine(value, max) {
    if (value == null) return "";
    var raw = String(value);
    var chars = Array.from(raw);
    for (var i = 0; i < chars.length; i += 1) {
      var code = chars[i].codePointAt(0);
      if (code <= 31 || (code >= 127 && code <= 159) || chars[i] === "\u2028" || chars[i] === "\u2029") return null;
    }
    var text = raw.trim();
    if (Array.from(text).length > max) return null;
    return text;
  }

  function optionalTag(event, name, max) {
    var raw = rawTag(event, name);
    if (raw === null) return "";
    return strictLine(raw, max);
  }

  function silentPay(text) {
    var raw = String(text || "");
    if (raw.length !== 116 || raw.indexOf("sp1q") !== 0) return false;
    for (var i = 3; i < raw.length; i += 1) {
      if (CHARSET.indexOf(raw.charAt(i)) === -1) return false;
    }
    return true;
  }

  function payOf(tags, chain) {
    var xbt = "";
    var btc = "";
    var bare = "";
    for (var i = 0; i < tags.length; i += 1) {
      var tag = tags[i];
      if (!tag || tag[0] !== "pay" || tag.length < 2 || !silentPay(tag[1])) continue;
      if (tag[2] === "xbt" && !xbt) xbt = tag[1];
      else if (tag[2] === "btc" && !btc) btc = tag[1];
      else if ((tag[2] == null || tag[2] === "") && !bare) bare = tag[1];
    }
    if (bare) {
      if (chain === "btc" && !btc) btc = bare;
      else if (!xbt) xbt = bare;
    }
    return { xbt: xbt, btc: btc };
  }

  function jobSide(tags, categories) {
    var job = false;
    for (var i = 0; i < categories.length; i += 1) {
      if (categories[i] === "job") job = true;
    }
    if (!job) return "offer";
    return firstTags(tags, "side") === "hire" ? "hire" : "offer";
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
    pushTax(rows, body.federal_name, body.federal_rate, "");
    pushTax(rows, body.state_name, body.state_rate, "PST");
    return rows;
  }

  function pushTax(rows, name, rate, fallback) {
    var figure = rateText(rate);
    var label = line(name, 40);
    if (!label && figure) label = fallback;
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
    if (typeof fetch === "function") {
      fetch("/api/spot", { headers: { accept: "application/json" } })
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (body) {
          if (!body || body.ok !== true) return;
          quotes = body;
          if (!tools.hidden) paint();
        })
        .catch(function () {});
    }
    readRelay().then(function (events) {
      var shown = events;
      // The sections stay hidden until the relay answers, and show runs again when names arrive.
      var jumped = false;
      function show(next) {
        state = parseBoard(next);
        tools.hidden = false;
        paint();
        if (!jumped) {
          jumped = true;
          var id = location.hash.replace(/^#/, "");
          var target = id && document.getElementById(id);
          if (target && tools.contains(target)) target.scrollIntoView();
        }
      }
      show(shown);
      var total = state.stalls.length + state.classifieds.length;
      status.textContent = total
        ? "Read from the relay, then the connection was closed. Nothing was stored on this site."
        : "The relay answered. No store or classified is published. Nothing was stored on this site.";
      var authors = authorHexes(state);
      if (!authors.length) return;
      readProfiles(authors).then(function (extra) {
        if (!extra.length) return;
        show(shown.concat(extra));
      });
    }).catch(function () {
      tools.hidden = true;
      status.textContent = "The relay did not answer. This page asked " + RELAY + " and then stopped. Nothing was stored on this site.";
    });

    var form = board.querySelector("form");
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
      });
    }
    board.querySelector("[data-board-query]").addEventListener("input", function (event) {
      filters.query = foldQuery(event.target.value);
      paint();
    });
    wireScan(board);

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
      list.appendChild(empty(query ? "No store matches." : "No store is published."));
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
    addPersonLine(heading, stall);
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
    addLightning(heading, stall);
    if (stall.categories.length) {
      var cats = document.createElement("p");
      cats.className = "card-meta";
      cats.textContent = stall.categories.join(", ");
      heading.appendChild(cats);
    }
    top.appendChild(heading);
    summary.appendChild(top);
    card.appendChild(summary);
    var body = document.createElement("div");
    body.className = "card-body";
    body.appendChild(facts(stallFacts(stall)));
    var grid = document.createElement("div");
    grid.className = "products";
    products.forEach(function (product) { grid.appendChild(productCard(product, stall.country)); });
    body.appendChild(grid);
    body.appendChild(orderBlock(stall.name, stall));
    card.appendChild(body);
    return card;
  }

  function productCard(product, country) {
    var card = document.createElement("article");
    card.className = "product";
    addImage(card, product.picture, "");
    var body = document.createElement("div");
    var title = document.createElement("h3");
    title.textContent = product.name;
    body.appendChild(title);
    priceLine(body, sats(product.price), product.price, "xbt", country);
    if (product.about) {
      var about = document.createElement("p");
      about.className = "summary";
      about.textContent = product.about;
      body.appendChild(about);
    }
    var action = document.createElement("p");
    action.className = "more";
    var link = document.createElement("a");
    link.href = "/install";
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
    addPersonLine(heading, ad);
    if (ad.status === "sold" || ad.status === "held") {
      var mark = document.createElement("p");
      mark.className = "sold";
      mark.textContent = ad.status === "sold" ? "Sold." : "Held.";
      heading.appendChild(mark);
    } else if (ad.price) {
      priceLine(heading, sats(ad.price) + " · " + ad.coin.toUpperCase(), ad.price, ad.coin, ad.country);
      if (ad.unpaid) {
        var unpaid = document.createElement("p");
        unpaid.className = "price";
        unpaid.textContent = "That listing cannot be paid yet. It has no payment code.";
        heading.appendChild(unpaid);
      }
    } else if (ad.priceText) {
      var raw = document.createElement("p");
      raw.className = "price";
      raw.textContent = ad.priceText;
      heading.appendChild(raw);
    }
    addLightning(heading, shop);
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
    var body = document.createElement("div");
    body.className = "card-body";
    if (ad.body) {
      var text = document.createElement("p");
      text.className = "ad-body";
      text.textContent = ad.body;
      body.appendChild(text);
    }
    if (ad.pictures.length) {
      var pics = document.createElement("div");
      pics.className = "ad-pictures";
      ad.pictures.forEach(function (url) { addImage(pics, url, ""); });
      body.appendChild(pics);
    }
    body.appendChild(facts(adFacts(ad)));
    if (ad.status === "active") body.appendChild(orderBlock(shop ? shop.name : "", ad));
    else {
      var who = personRow(ad);
      if (who) body.appendChild(who);
    }
    card.appendChild(body);
    return card;
  }

  function orderBlock(shopName, person) {
    var block = document.createElement("div");
    block.className = "order-path";
    var action = document.createElement("a");
    action.className = "button";
    action.href = "/install";
    action.textContent = "Install Autarki to order";
    block.appendChild(action);
    if (shopName) {
      var name = document.createElement("p");
      name.textContent = shopName;
      block.appendChild(name);
    }
    var who = personRow(person);
    if (who) block.appendChild(who);
    var hint = document.createElement("p");
    hint.className = "quiet";
    hint.textContent = "Open Shop in Autarki and search this name.";
    block.appendChild(hint);
    return block;
  }

  function lightningLine(roomXbt, roomBtc) {
    var xbt = roomXbt > 0;
    var btc = roomBtc > 0;
    if (xbt && btc) return "Lightning on XBT and BTC";
    if (xbt) return "Lightning on XBT";
    if (btc) return "Lightning on BTC";
    return "";
  }

  function addLightning(heading, stall) {
    if (!stall) return;
    var text = lightningLine(stall.roomXbt, stall.roomBtc);
    if (!text) return;
    var mark = document.createElement("p");
    mark.className = "lightning-mark";
    mark.textContent = text;
    heading.appendChild(mark);
  }

  function addPersonLine(heading, person) {
    var text = personText(person);
    if (!text) return;
    var line = document.createElement("p");
    line.className = "card-meta";
    line.textContent = text;
    heading.appendChild(line);
  }

  function personText(person) {
    if (!person) return "";
    var parts = [];
    if (person.nickname) parts.push(person.nickname);
    if (person.discordName) parts.push("Discord " + person.discordName);
    return parts.join(" · ");
  }

  function personRow(person) {
    if (!person || !person.npub) return null;
    var row = document.createElement("p");
    row.className = "public-name";
    if (person.nickname) {
      var nick = document.createElement("span");
      nick.className = "nostr-name";
      nick.textContent = person.nickname;
      row.appendChild(nick);
    }
    var code = document.createElement("code");
    code.textContent = person.npub.slice(0, 12) + "..." + person.npub.slice(-6);
    code.title = person.npub;
    var button = document.createElement("button");
    button.type = "button";
    button.textContent = "Copy";
    button.setAttribute("aria-label", "Copy the public name");
    button.addEventListener("click", function () {
      copyText(person.npub).then(function () {
        button.textContent = "Copied";
        setTimeout(function () { button.textContent = "Copy"; }, 1600);
      });
    });
    row.appendChild(code);
    row.appendChild(button);
    if (person.discordName && person.discordUrl) {
      var link = document.createElement("a");
      link.className = "discord-name";
      link.href = person.discordUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Discord " + person.discordName;
      row.appendChild(link);
    }
    return row;
  }

  function facts(rows) {
    var list = document.createElement("div");
    list.className = "facts";
    rows.forEach(function (row) {
      if (!row.value) return;
      var lineEl = document.createElement("p");
      lineEl.className = "fact";
      if (row.href && !row.label) {
        lineEl.appendChild(mapLink(row.href));
        list.appendChild(lineEl);
        return;
      }
      if (row.stack) lineEl.classList.add("fact-stack");
      if (row.label) {
        var term = document.createElement("span");
        term.className = "fact-label";
        term.textContent = row.stack ? row.label : row.label + ": ";
        lineEl.appendChild(term);
      }
      var value = document.createElement("span");
      value.className = "fact-value";
      if (row.href) value.appendChild(mapLink(row.href));
      else value.appendChild(document.createTextNode(row.value));
      if (row.linkHref) {
        value.appendChild(document.createTextNode(" "));
        var extra = document.createElement("a");
        extra.href = row.linkHref;
        extra.textContent = row.linkText;
        value.appendChild(extra);
      }
      lineEl.appendChild(value);
      list.appendChild(lineEl);
    });
    return list;
  }

  function mapLink(href) {
    var link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Map";
    return link;
  }

  function stallFacts(stall) {
    var rows = [
      { label: "Country", value: stall.country },
      { label: "Province", value: stall.province },
      { label: "City", value: stall.city },
      { label: "Neighbourhood", value: stall.neighbourhood },
      { label: "Sale", value: stall.online ? "Online" : "Counter" },
      { value: stall.map ? "Map" : "", href: stall.map }
    ];
    stall.taxes.forEach(function (tax) {
      rows.push({ label: "Tax", value: taxLine(tax) });
    });
    if (stall.tipsOn) {
      rows.push({ label: "Tips", stack: true, value: stall.tips.length ? stall.tips.map(function (n) { return n + "%"; }).join(", ") : "On" });
    }
    if (stall.online && stall.deliveries) {
      var text = stall.deliveries + (stall.deliveries === 1 ? " shipment received" : " shipments received");
      if (stall.firstDelivery) text += ". First on " + day(stall.firstDelivery);
      if (stall.unfinished) text += ". " + stall.unfinished + " not received";
      text += ". The seller's own book. Hold, referee, vouch, and the Discord link are in the wallet.";
      rows.push({
        label: "Deliveries",
        value: text,
        linkHref: "/classifieds#protection",
        linkText: "How a shipment is protected"
      });
    }
    if (stall.online && (stall.shipPostal || stall.shipCc || stall.shipKg)) {
      rows.push({ label: "Ships from", value: [stall.shipPostal, stall.shipCc, stall.shipKg ? stall.shipKg + " kg" : ""].filter(Boolean).join(", ") });
    }
    if (stall.categories.length) rows.push({ label: "Categories", stack: true, value: stall.categories.join(", ") });
    return rows;
  }

  function adFacts(ad) {
    var rows = [
      { label: "Country", value: ad.country },
      { label: "Province", value: ad.province },
      { label: "City", value: ad.city },
      { label: "Neighbourhood", value: ad.neighbourhood },
      { label: "Categories", stack: true, value: ad.categories.join(", ") },
      { value: ad.map ? "Map" : "", href: ad.map }
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

  function priceLine(parent, text, amount, coin, country) {
    var price = document.createElement("p");
    price.className = "price";
    price.appendChild(document.createTextNode(text));
    var hint = fiatHint(amount, coin, country);
    if (hint) {
      price.appendChild(document.createTextNode(" · "));
      var span = document.createElement("span");
      span.className = "price-hint";
      span.textContent = hint;
      price.appendChild(span);
    }
    parent.appendChild(price);
  }

  function fiatHint(amount, coin, country) {
    if (!quotes || typeof AutarkiHint === "undefined") return "";
    return AutarkiHint.hint(amount, coin, country, quotes);
  }

  function day(unix) {
    var date = new Date(unix * 1000);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  }

  function foldQuery(value) {
    var text = String(value || "").trim().toLowerCase();
    if (text.indexOf("nostr:") === 0) text = text.slice("nostr:".length).trim();
    var found = text.match(/npub1[023456789acdefghjklmnpqrstuvwxyz]{6,}/);
    return found ? found[0] : text;
  }

  function keyHit(item, query) {
    if (!item || query.length < 6) return false;
    var npub = String(item.npub || "").toLowerCase();
    var pub = String(item.pubkey || "").toLowerCase();
    if (npub && (npub.indexOf(query) !== -1 || query.indexOf(npub) !== -1)) return true;
    if (pub && query.length >= 8 && (pub.indexOf(query) !== -1 || query.indexOf(pub) !== -1)) return true;
    return false;
  }

  function stallMatches(stall, query) {
    if (!query) return true;
    if (keyHit(stall, query)) return true;
    var shop = [stall.name, stall.country, stall.province, stall.city, stall.neighbourhood, stall.nickname, stall.discordName].join("\n").toLowerCase();
    if (shop.indexOf(query) !== -1) return true;
    return stall.products.some(function (product) { return product.name.toLowerCase().indexOf(query) !== -1; });
  }

  function visibleProducts(stall, query) {
    if (!query) return stall.products;
    if (keyHit(stall, query)) return stall.products;
    var shop = [stall.name, stall.country, stall.province, stall.city, stall.neighbourhood, stall.nickname, stall.discordName].join("\n").toLowerCase();
    if (shop.indexOf(query) !== -1) return stall.products;
    return stall.products.filter(function (product) { return product.name.toLowerCase().indexOf(query) !== -1; });
  }

  function adMatches(ad, query) {
    if (!query) return true;
    if (keyHit(ad, query)) return true;
    var text = [ad.title, ad.summary, ad.body, ad.country, ad.province, ad.city, ad.neighbourhood, ad.nickname, ad.discordName].join("\n").toLowerCase();
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

  function authorHexes(board) {
    var seen = {};
    var out = [];
    board.stalls.concat(board.classifieds).forEach(function (item) {
      if (!item || !item.pubkey || seen[item.pubkey] || out.length >= 40) return;
      seen[item.pubkey] = true;
      out.push(item.pubkey);
    });
    return out;
  }

  function attachPerson(item, profiles, discords) {
    var profile = profiles.get(item.pubkey);
    item.nickname = profile && profile.label ? profile.label : "";
    var discord = discords.get(item.pubkey);
    item.discordName = discord && discord.link ? discord.link.name : "";
    item.discordUrl = discord && discord.link ? discord.link.url : "";
  }

  function profilesByPubkey(events, dels) {
    var best = new Map();
    events.forEach(function (event) {
      if (!event || event.kind !== 0) return;
      var pubkey = hex(event.pubkey);
      if (!pubkey) return;
      var content = typeof event.content === "string" ? event.content : "";
      if (content.length > 100000) return;
      if (removed(event, first(event, "d"), dels)) return;
      var at = created(event);
      var have = best.get(pubkey);
      if (have && have.at >= at) return;
      best.set(pubkey, { at: at, label: profileLabel(content) });
    });
    return best;
  }

  function discordByPubkey(events, dels) {
    var best = new Map();
    events.forEach(function (event) {
      if (!event || event.kind !== 10011) return;
      var pubkey = hex(event.pubkey);
      if (!pubkey) return;
      var content = typeof event.content === "string" ? event.content : "";
      if (content.length > 4096) return;
      if (removed(event, first(event, "d"), dels)) return;
      var at = created(event);
      var have = best.get(pubkey);
      if (have && have.at >= at) return;
      best.set(pubkey, { at: at, link: discordClaim(event.tags || []) });
    });
    return best;
  }

  function profileLabel(content) {
    var value;
    try {
      value = JSON.parse(content || "");
    } catch (e) {
      return "";
    }
    if (!value || typeof value !== "object") return "";
    var display = typeof value.display_name === "string" ? value.display_name : "";
    var name = typeof value.name === "string" ? value.name : "";
    return cleanProfileLabel(display) || cleanProfileLabel(name);
  }

  function cleanProfileLabel(raw) {
    var trimmed = String(raw || "").trim();
    if (!trimmed || hasControl(trimmed)) return "";
    var body = trimmed.replace(/^@+/, "").trim();
    if (!body || hasControl(body) || [...body].length > 80) return "";
    var lower = body.toLowerCase();
    if (lower.indexOf("npub1") === 0 || lower.indexOf("nsec1") === 0) return "";
    return "@" + body;
  }

  function hasControl(text) {
    var chars = [...text];
    for (var i = 0; i < chars.length; i += 1) {
      var code = chars[i].codePointAt(0);
      if (code < 32 || code === 127 || (code >= 128 && code <= 159) || code === 0x2028 || code === 0x2029) return true;
    }
    return false;
  }

  function discordClaim(tags) {
    var found = null;
    for (var i = 0; i < tags.length; i += 1) {
      var tag = tags[i];
      if (!tag || tag[0] !== "i" || tag.length < 3) continue;
      var raw = String(tag[1]);
      if (raw.indexOf("discord:") !== 0) continue;
      var name = discordName(raw.slice("discord:".length));
      if (!name) continue;
      var proof = discordProof(tag[2]);
      if (!proof) continue;
      if (found) return null;
      found = { name: name, url: "https://discord.com/users/" + name };
    }
    return found;
  }

  function discordName(raw) {
    var name = String(raw || "").trim().toLowerCase();
    if (name.charAt(0) === "@") name = name.slice(1);
    if (!/^[a-z0-9._]{2,32}$/.test(name)) return "";
    if (name.charAt(0) === "." || name.charAt(name.length - 1) === "." || name.indexOf("..") !== -1) return "";
    if (/^[1-9][0-9]{14,19}$/.test(name)) return "";
    return name;
  }

  function discordProof(raw) {
    var text = String(raw || "").trim();
    if (!text || text.length > 160 || /\s/.test(text) || text.indexOf("<") !== -1 || text.indexOf(">") !== -1) return "";
    var prefix = "https://discord.com/channels/";
    var path = text;
    if (text.indexOf(prefix) === 0) path = text.slice(prefix.length);
    else if (text.indexOf(":") !== -1 || text.indexOf("@") !== -1) return "";
    if (path.charAt(path.length - 1) === "/") path = path.slice(0, -1);
    if (path.indexOf("?") !== -1 || path.indexOf("#") !== -1 || path.indexOf("\\") !== -1) return "";
    var parts = path.split("/");
    if (parts.length !== 3) return "";
    for (var i = 0; i < 3; i += 1) {
      if (!/^[1-9][0-9]{14,19}$/.test(parts[i])) return "";
    }
    return parts.join("/");
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

  function wireScan(board) {
    var input = board.querySelector("[data-board-query]");
    var open = board.querySelector("[data-board-scan]");
    var panel = board.querySelector("[data-scan-panel]");
    var video = board.querySelector("[data-scan-video]");
    var note = board.querySelector("[data-scan-note]");
    var stop = board.querySelector("[data-scan-stop]");
    var photo = board.querySelector("[data-scan-photo]");
    if (!input || !open || !panel || !video) return;
    var stream = null;
    var timer = 0;
    var session = 0;
    var pass = 0;
    var cameraGen = 0;
    var detector = null;
    var detectorOff = false;
    var loading = null;
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d", { willReadFrequently: true });

    function setNote(text) {
      if (note) note.textContent = text;
    }

    function kick() {
      var play = video.play();
      if (play && play.catch) play.catch(function () {});
    }

    function stopTracks() {
      if (timer) clearTimeout(timer);
      timer = 0;
      if (stream) {
        stream.getTracks().forEach(function (track) { track.stop(); });
        stream = null;
      }
      video.removeEventListener("loadedmetadata", kick);
      try { video.pause(); } catch (e) {}
      video.srcObject = null;
    }

    function halt() {
      session += 1;
      stopTracks();
      panel.hidden = true;
    }

    function apply(raw) {
      var text = String(raw || "").trim();
      if (!text) return;
      halt();
      input.value = text;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
    }

    function prepareVideo() {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.setAttribute("muted", "");
      video.setAttribute("autoplay", "");
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
    }

    function loadJsQR() {
      if (window.jsQR) return Promise.resolve();
      if (loading) return loading;
      loading = new Promise(function (resolve, reject) {
        var script = document.createElement("script");
        script.src = "js/jsQR.js";
        script.onload = function () {
          if (window.jsQR) resolve();
          else {
            loading = null;
            reject(new Error("qr"));
          }
        };
        script.onerror = function () {
          loading = null;
          reject(new Error("qr"));
        };
        document.head.appendChild(script);
      });
      return loading;
    }

    function makeDetector() {
      if (typeof BarcodeDetector !== "function") return null;
      try { return new BarcodeDetector({ formats: ["qr_code"] }); } catch (e) { return null; }
    }

    function camera() {
      var tries = [
        { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { facingMode: "environment" }, audio: false },
        { video: true, audio: false }
      ];
      function attempt(index) {
        return navigator.mediaDevices.getUserMedia(tries[index]).catch(function () {
          if (index + 1 < tries.length) return attempt(index + 1);
          throw new Error("camera");
        });
      }
      return attempt(0);
    }

    function sourceSize(source) {
      if (source.videoWidth && source.videoHeight) return { width: source.videoWidth, height: source.videoHeight };
      if (source.naturalWidth && source.naturalHeight) return { width: source.naturalWidth, height: source.naturalHeight };
      if (source.width && source.height) return { width: source.width, height: source.height };
      return { width: 0, height: 0 };
    }

    function drawSource(source, crop, maxEdge) {
      var size = sourceSize(source);
      if (!context || !size.width || !size.height) return false;
      var sx = 0;
      var sy = 0;
      var sw = size.width;
      var sh = size.height;
      if (crop) {
        var nextW = Math.round(sw * crop);
        var nextH = Math.round(sh * crop);
        sx = Math.round((size.width - nextW) / 2);
        sy = Math.round((size.height - nextH) / 2);
        sw = nextW;
        sh = nextH;
      }
      var scale = Math.min(1, maxEdge / Math.max(sw, sh));
      var width = Math.max(1, Math.round(sw * scale));
      var height = Math.max(1, Math.round(sh * scale));
      canvas.width = width;
      canvas.height = height;
      context.drawImage(source, sx, sy, sw, sh, 0, 0, width, height);
      return width > 0 && height > 0;
    }

    function readJsQR(invert) {
      if (!window.jsQR || !context || !canvas.width || !canvas.height) return "";
      try {
        var image = context.getImageData(0, 0, canvas.width, canvas.height);
        var code = window.jsQR(image.data, image.width, image.height, {
          inversionAttempts: invert ? "attemptBoth" : "dontInvert"
        });
        return code && code.data ? code.data : "";
      } catch (e) {
        return "";
      }
    }

    function codeText(codes) {
      return codes && codes[0] && codes[0].rawValue ? codes[0].rawValue : "";
    }

    function detectBitmap(active) {
      if (!active || detectorOff || typeof active.detect !== "function") return Promise.resolve("");
      var made;
      try {
        made = typeof createImageBitmap === "function" ? createImageBitmap(canvas) : Promise.resolve(null);
      } catch (e) {
        made = Promise.resolve(null);
      }
      var job = made.then(function (bitmap) {
        var source = bitmap || canvas;
        try {
          return active.detect(source).then(function (codes) {
            if (bitmap && bitmap.close) bitmap.close();
            return codeText(codes);
          }, function () {
            if (bitmap && bitmap.close) bitmap.close();
            return "";
          });
        } catch (e) {
          if (bitmap && bitmap.close) bitmap.close();
          return "";
        }
      }, function () {
        try { return active.detect(canvas).then(codeText, function () { return ""; }); } catch (e) { return ""; }
      });
      return new Promise(function (resolve) {
        var settled = false;
        var watch = setTimeout(function () {
          if (settled) return;
          settled = true;
          detectorOff = true;
          resolve("");
        }, 450);
        Promise.resolve(job).then(function (value) {
          if (settled) return;
          settled = true;
          clearTimeout(watch);
          resolve(value || "");
        }, function () {
          if (settled) return;
          settled = true;
          clearTimeout(watch);
          detectorOff = true;
          resolve("");
        });
      });
    }

    function decodeCanvas(active, invert) {
      return Promise.all([
        detectBitmap(active),
        Promise.resolve().then(function () { return readJsQR(invert); })
      ]).then(function (found) {
        return found[0] || found[1] || "";
      });
    }

    function tick(mine, generation, started) {
      if (mine !== session || generation !== cameraGen || !stream) return;
      if (video.readyState < 2 || !video.videoWidth) {
        if (Date.now() - started > 2500) setNote("The camera did not open. Take a photo of the code instead.");
        timer = setTimeout(function () { tick(mine, generation, started); }, 200);
        return;
      }
      if (note && note.textContent !== "Point the camera at the code.") setNote("Point the camera at the code.");
      var mode = pass % 4;
      pass += 1;
      var crop = mode === 1 ? 0.72 : mode === 3 ? 0.46 : 0;
      if (!drawSource(video, crop, 1280)) {
        timer = setTimeout(function () { tick(mine, generation, started); }, 200);
        return;
      }
      decodeCanvas(detector, mode === 2).then(function (value) {
        if (mine !== session || generation !== cameraGen || !stream) return;
        if (value) {
          apply(value);
          return;
        }
        timer = setTimeout(function () { tick(mine, generation, started); }, 180);
      }, function () {
        if (mine !== session || generation !== cameraGen || !stream) return;
        timer = setTimeout(function () { tick(mine, generation, started); }, 180);
      });
    }

    function begin(mine) {
      var generation = cameraGen;
      prepareVideo();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.isSecureContext) {
        setNote("The camera did not open. Take a photo of the code instead.");
        return;
      }
      setNote("Point the camera at the code.");
      detectorOff = false;
      detector = makeDetector();
      pass = 0;
      var pending = camera();
      var scripts = loadJsQR().catch(function () {});
      pending.then(function (next) {
        if (mine !== session || generation !== cameraGen) {
          next.getTracks().forEach(function (track) { track.stop(); });
          return;
        }
        stream = next;
        video.srcObject = next;
        video.addEventListener("loadedmetadata", kick);
        kick();
        return scripts.then(function () {
          if (mine !== session || generation !== cameraGen || !stream) return;
          tick(mine, generation, Date.now());
        });
      }).catch(function () {
        if (mine !== session || generation !== cameraGen) return;
        stopTracks();
        panel.hidden = false;
        setNote("The camera did not open. Take a photo of the code instead.");
      });
    }

    function finishPhoto(mine, source, done) {
      loadJsQR().catch(function () {}).then(function () {
        if (mine !== session) {
          done();
          return;
        }
        if (!detector) detector = makeDetector();
        function scan(crop) {
          if (!drawSource(source, crop, 1600)) return Promise.resolve("");
          return decodeCanvas(detector, true);
        }
        scan(0).then(function (value) {
          if (value || mine !== session) return value || "";
          return scan(0.62);
        }).then(function (value) {
          done();
          if (mine !== session) return;
          if (value) {
            apply(value);
            return;
          }
          setNote("The photo has no code.");
        }, function () {
          done();
          if (mine === session) setNote("The photo has no code.");
        });
      });
    }

    function readPhotoElement(file, mine) {
      var url = URL.createObjectURL(file);
      var image = new Image();
      image.onload = function () {
        URL.revokeObjectURL(url);
        if (mine !== session) return;
        finishPhoto(mine, image, function () {});
      };
      image.onerror = function () {
        URL.revokeObjectURL(url);
        if (mine === session) setNote("The photo has no code.");
      };
      image.src = url;
    }

    function readPhoto(file) {
      var mine = session;
      if (!file || !context) {
        setNote("The photo has no code.");
        return;
      }
      cameraGen += 1;
      stopTracks();
      setNote("Reading the photo.");
      var oriented = null;
      try {
        if (typeof createImageBitmap === "function") oriented = createImageBitmap(file, { imageOrientation: "from-image" });
      } catch (e) {
        oriented = null;
      }
      if (!oriented || !oriented.then) {
        readPhotoElement(file, mine);
        return;
      }
      oriented.then(function (bitmap) {
        finishPhoto(mine, bitmap, function () { if (bitmap && bitmap.close) bitmap.close(); });
      }, function () {
        readPhotoElement(file, mine);
      });
    }

    open.addEventListener("click", function () {
      var mine = session + 1;
      session = mine;
      stopTracks();
      panel.hidden = false;
      if (photo) photo.value = "";
      begin(mine);
    });

    if (photo) {
      var photoLabel = photo.closest("label");
      function releaseForPhoto() {
        cameraGen += 1;
        stopTracks();
      }
      if (photoLabel) {
        photoLabel.addEventListener("pointerdown", releaseForPhoto);
        photoLabel.addEventListener("touchstart", releaseForPhoto, { passive: true });
      }
      photo.addEventListener("change", function () {
        var file = photo.files && photo.files[0];
        photo.value = "";
        if (!file || panel.hidden) return;
        readPhoto(file);
      });
      photo.addEventListener("cancel", function () {
        if (panel.hidden || stream) return;
        begin(session);
      });
    }

    if (stop) stop.addEventListener("click", halt);
    window.addEventListener("pagehide", halt);
  }
  return { parseBoard: parseBoard, npubFromHex: npubFromHex, readRelay: readRelay, mount: mount };
});
