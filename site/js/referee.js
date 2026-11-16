(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.AutarkiReferee = api;
  if (typeof document !== "undefined") {
    var form = document.getElementById("referee-search");
    if (form) api.mount(form);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var RELAY = "wss://nostr.autarki.app";
  var PROFILE_RELAYS = [
    "wss://nos.lol",
    "wss://relay.damus.io",
    "wss://relay.primal.net",
    "wss://purplepag.es"
  ];
  var CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  var DISCORD_PREFIX = "https://discord.com/channels/";

  function npubFromHex(hexText) {
    if (!/^[0-9a-fA-F]{64}$/.test(hexText)) return "";
    var bytes = [];
    for (var i = 0; i < 64; i += 2) bytes.push(parseInt(hexText.slice(i, i + 2), 16));
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

  function hexKey(value) {
    var text = String(value || "").toLowerCase();
    return /^[0-9a-f]{64}$/.test(text) ? text : "";
  }

  function eventId(event) {
    return hexKey(event && event.id);
  }

  function created(event) {
    var n = Number(event && event.created_at);
    return isFinite(n) ? n : 0;
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
    var path = text;
    if (text.indexOf(DISCORD_PREFIX) === 0) path = text.slice(DISCORD_PREFIX.length);
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

  function discordClaim(tags) {
    var found = null;
    var list = tags || [];
    for (var i = 0; i < list.length; i += 1) {
      var tag = list[i];
      if (!tag || tag[0] !== "i" || tag.length < 3) continue;
      var raw = String(tag[1]);
      if (raw.indexOf("discord:") !== 0) continue;
      var name = discordName(raw.slice("discord:".length));
      if (!name) continue;
      var proof = discordProof(tag[2]);
      if (!proof) continue;
      if (found) return null;
      found = { name: name, url: DISCORD_PREFIX + proof };
    }
    return found;
  }

  function asked(tags) {
    var list = tags || [];
    for (var i = 0; i < list.length; i += 1) {
      var tag = list[i];
      if (tag && tag[0] === "t" && String(tag[1] || "").trim().toLowerCase() === "referee") return true;
    }
    return false;
  }

  function firstD(event) {
    var tags = event.tags || [];
    for (var i = 0; i < tags.length; i += 1) {
      if (tags[i] && tags[i][0] === "d" && tags[i][1]) return String(tags[i][1]);
    }
    return "";
  }

  function indexDeletions(events) {
    var byE = {};
    var byA = {};
    events.forEach(function (event) {
      if (!event || event.kind !== 5) return;
      var author = hexKey(event.pubkey);
      if (!author) return;
      var at = created(event);
      (event.tags || []).forEach(function (tag) {
        if (!tag || !tag[1]) return;
        if (tag[0] === "e") {
          var id = hexKey(tag[1]);
          if (!id) return;
          if (!byE[id] || at >= byE[id].at) byE[id] = { at: at, author: author };
        }
        if (tag[0] === "a") {
          var parts = String(tag[1]).split(":");
          if (parts.length < 3) return;
          var key = parts[0] + ":" + parts[1].toLowerCase() + ":" + parts.slice(2).join(":");
          if (!byA[key] || at >= byA[key].at) byA[key] = { at: at, author: author };
        }
      });
    });
    return { byE: byE, byA: byA };
  }

  function removed(event, dels) {
    var at = created(event);
    var author = hexKey(event.pubkey);
    var id = eventId(event);
    var hit = id && dels.byE[id];
    if (hit && hit.at >= at && hit.author === author) return true;
    var d = firstD(event);
    var keys = [event.kind + ":" + author + ":" + d];
    if (d) keys.push(event.kind + ":" + author + ":");
    for (var i = 0; i < keys.length; i += 1) {
      var row = dels.byA[keys[i]];
      if (row && row.at >= at && row.author === author) return true;
    }
    return false;
  }

  function newer(event, have) {
    if (!have) return true;
    var at = created(event);
    var haveAt = created(have);
    if (at !== haveAt) return at > haveAt;
    return eventId(event) < eventId(have);
  }

  function selectReferees(events) {
    var list = events || [];
    var dels = indexDeletions(list);
    var best = {};
    list.forEach(function (event) {
      if (!event || event.kind !== 10011) return;
      var pubkey = hexKey(event.pubkey);
      var id = eventId(event);
      if (!pubkey || !id) return;
      var content = typeof event.content === "string" ? event.content : "";
      if (content.length > 4096) return;
      if (!newer(event, best[pubkey])) return;
      best[pubkey] = event;
    });
    var people = [];
    Object.keys(best).forEach(function (pubkey) {
      var event = best[pubkey];
      if (removed(event, dels)) return;
      var claim = discordClaim(event.tags || []);
      if (!claim || !asked(event.tags || [])) return;
      people.push({
        pubkey: pubkey,
        npub: npubFromHex(pubkey),
        discord: claim.name,
        url: claim.url,
        label: ""
      });
    });
    people.sort(function (a, b) {
      if (a.discord < b.discord) return -1;
      if (a.discord > b.discord) return 1;
      if (a.pubkey < b.pubkey) return -1;
      if (a.pubkey > b.pubkey) return 1;
      return 0;
    });
    return people;
  }

  function hasControl(text) {
    for (var i = 0; i < text.length; i += 1) {
      var code = text.charCodeAt(i);
      if (code < 32 || code === 127 || (code >= 128 && code <= 159) || code === 0x2028 || code === 0x2029) return true;
    }
    return false;
  }

  function cleanProfileLabel(raw) {
    var trimmed = String(raw || "").trim();
    if (!trimmed || hasControl(trimmed) || trimmed.length > 80) return "";
    var body = trimmed.replace(/^@+/, "").trim();
    if (!body || hasControl(body) || body.length > 80) return "";
    var lower = body.toLowerCase();
    if (lower.indexOf("npub1") === 0 || lower.indexOf("nsec1") === 0) return "";
    return "@" + body;
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

  function applyProfiles(people, events) {
    var labels = {};
    (events || []).forEach(function (event) {
      if (!event || event.kind !== 0) return;
      var pubkey = hexKey(event.pubkey);
      if (!pubkey) return;
      var content = typeof event.content === "string" ? event.content : "";
      if (content.length > 100000) return;
      var at = created(event);
      var have = labels[pubkey];
      if (have && have.at >= at) return;
      labels[pubkey] = { at: at, label: profileLabel(content) };
    });
    return (people || []).map(function (person) {
      var next = {
        pubkey: person.pubkey,
        npub: person.npub,
        discord: person.discord,
        url: person.url,
        label: labels[person.pubkey] ? labels[person.pubkey].label : ""
      };
      return next;
    });
  }

  function normalizeQuery(raw) {
    var text = String(raw || "").trim().toLowerCase();
    if (text.indexOf("nostr:") === 0) text = text.slice(6);
    if (text.charAt(0) === "@") text = text.slice(1);
    return text;
  }

  function personMatches(person, query) {
    if (person.discord.indexOf(query) !== -1) return true;
    var label = String(person.label || "").toLowerCase().replace(/^@+/, "");
    if (label && label.indexOf(query) !== -1) return true;
    if (person.npub && person.npub === query) return true;
    if (person.pubkey === query) return true;
    if (query.length >= 8 && person.npub && person.npub.indexOf(query) === 0) return true;
    if (query.length >= 8 && person.pubkey.indexOf(query) === 0) return true;
    return false;
  }

  function matchPeople(people, raw) {
    var query = normalizeQuery(raw);
    if (query.length < 2) return [];
    var found = [];
    var list = people || [];
    for (var i = 0; i < list.length; i += 1) {
      if (personMatches(list[i], query)) found.push(list[i]);
    }
    return found;
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

  function chunks(list, size) {
    var out = [];
    for (var i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
    return out;
  }

  function readDeletions(authors) {
    if (!authors.length) return Promise.resolve([]);
    return Promise.all(chunks(authors, 50).map(function (group, index) {
      return readSocket(RELAY, "referee-del-" + index, [{
        kinds: [5],
        authors: group,
        limit: Math.min(500, Math.max(group.length * 5, 20))
      }], 8000);
    })).then(function (lists) {
      var out = [];
      lists.forEach(function (list) {
        list.forEach(function (event) { out.push(event); });
      });
      return out;
    });
  }

  function readProfiles(authors) {
    if (!authors.length) return Promise.resolve([]);
    var urls = [RELAY].concat(PROFILE_RELAYS);
    var groups = chunks(authors, 50);
    var jobs = [];
    urls.forEach(function (url, urlIndex) {
      groups.forEach(function (group, index) {
        jobs.push(readSocket(url, "referee-name-" + urlIndex + "-" + index, [{
          kinds: [0],
          authors: group,
          limit: Math.min(200, Math.max(group.length * 4, 4))
        }], 8000).catch(function () { return []; }));
      });
    });
    return Promise.all(jobs).then(function (lists) {
      var out = [];
      lists.forEach(function (list) {
        list.forEach(function (event) {
          if (event && event.kind === 0) out.push(event);
        });
      });
      return out;
    });
  }

  function loadPeople() {
    return readSocket(RELAY, "referees", [{ kinds: [10011], limit: 800 }], 12000).then(function (events) {
      var authors = [];
      var seen = {};
      events.forEach(function (event) {
        var pubkey = hexKey(event && event.pubkey);
        if (!pubkey || seen[pubkey]) return;
        seen[pubkey] = true;
        authors.push(pubkey);
      });
      return readDeletions(authors).then(function (dels) {
        var people = selectReferees(events.concat(dels));
        var opted = people.map(function (person) { return person.pubkey; });
        return readProfiles(opted).then(function (profiles) {
          return applyProfiles(people, profiles);
        });
      });
    });
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
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

  function card(person) {
    var article = document.createElement("article");
    article.className = "board-card referee-card";
    var kicker = document.createElement("p");
    kicker.className = "kicker";
    kicker.textContent = "Discord";
    var heading = document.createElement("h2");
    heading.textContent = person.discord;
    article.appendChild(kicker);
    article.appendChild(heading);
    if (person.label) {
      var published = document.createElement("p");
      published.textContent = person.label;
      article.appendChild(published);
    }
    var actions = document.createElement("p");
    actions.className = "referee-actions";
    var button = document.createElement("button");
    button.type = "button";
    button.className = "button button-ghost";
    button.textContent = "Copy public name";
    button.addEventListener("click", function () {
      copyText(person.npub).then(function () {
        button.textContent = "Copied";
        setTimeout(function () { button.textContent = "Copy public name"; }, 1600);
      });
    });
    actions.appendChild(button);
    var proof = discordProof(person.url);
    if (proof) {
      var link = document.createElement("a");
      link.className = "button button-ghost";
      link.href = DISCORD_PREFIX + proof;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Open the Discord message";
      actions.appendChild(link);
    }
    article.appendChild(actions);
    var note = document.createElement("p");
    note.className = "field-note";
    note.textContent = "A member of that server can open the message.";
    article.appendChild(note);
    return article;
  }

  function mount(form) {
    var field = document.getElementById("referee-query");
    var status = document.getElementById("referee-status");
    var list = document.getElementById("referee-list");
    var retry = document.getElementById("referee-retry");
    if (!field || !status || !list) return;
    var people = [];
    var state = "loading";
    var loadId = 0;

    function render() {
      clear(list);
      var query = normalizeQuery(field.value);
      if (retry) retry.hidden = state !== "error";
      if (state === "error") {
        status.textContent = "The relay did not answer.";
        return;
      }
      if (state === "loading") {
        status.textContent = query ? "Looking." : "";
        return;
      }
      if (!query) {
        status.textContent = "";
        return;
      }
      if (query.length < 2) {
        status.textContent = "Type a little more of the name.";
        return;
      }
      var found = matchPeople(people, query);
      if (!found.length) {
        status.textContent = "No one with that name asked to be found.";
        return;
      }
      status.textContent = "";
      found.forEach(function (person) { list.appendChild(card(person)); });
    }

    function load() {
      var mine = loadId + 1;
      loadId = mine;
      state = "loading";
      people = [];
      render();
      loadPeople().then(function (next) {
        if (mine !== loadId) return;
        people = next;
        state = "ready";
        render();
      }, function () {
        if (mine !== loadId) return;
        people = [];
        state = "error";
        render();
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
    });
    field.addEventListener("input", render);
    field.addEventListener("search", render);
    if (retry) retry.addEventListener("click", load);
    load();
  }

  return {
    npubFromHex: npubFromHex,
    discordClaim: discordClaim,
    selectReferees: selectReferees,
    applyProfiles: applyProfiles,
    normalizeQuery: normalizeQuery,
    matchPeople: matchPeople,
    mount: mount
  };
});
