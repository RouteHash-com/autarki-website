(function () {
  var RELAY = "wss://165.245.235.36:8444";
  var BECH32 = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  var CATEGORIES = ["goods", "services", "job", "rental", "giveaway", "personal"];
  var CARRY = "This note cannot be posted. It asks for something this board does not carry.";
  var PRICE_TEXT = "A dollar amount, a fraction, or any other currency is shown as text and cannot be paid.";
  var PRICE_CODE = "A price in whole sats can be paid when this note carries that chain's silent-payment code. This page cannot make the code.";
  var SHIP = "Ship appears when the note names a public Lightning node for a chain that has a code.";
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

  function chars(text) {
    return Array.from(String(text == null ? "" : text));
  }

  function isControl(ch) {
    var code = ch.codePointAt(0);
    return code <= 31 || (code >= 127 && code <= 159);
  }

  function oneLine(text, limit) {
    var raw = String(text == null ? "" : text);
    var list = chars(raw);
    for (var i = 0; i < list.length; i++) {
      if (isControl(list[i]) || list[i] === "\u2028" || list[i] === "\u2029") return null;
    }
    var trimmed = raw.trim();
    if (chars(trimmed).length > limit) return null;
    return trimmed;
  }

  function bodyText(text) {
    var raw = String(text == null ? "" : text).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    var list = chars(raw);
    if (list.length > 4000) return { bad: "length" };
    for (var i = 0; i < list.length; i++) {
      if (list[i] === "\n") continue;
      if (isControl(list[i]) || list[i] === "\u2028" || list[i] === "\u2029") return { bad: "char" };
    }
    return { text: raw };
  }

  function dOk(text) {
    var list = chars(text);
    if (list.length < 1 || list.length > 256) return false;
    for (var i = 0; i < list.length; i++) {
      if (isControl(list[i]) || list[i] === "\u2028" || list[i] === "\u2029" || /\s/u.test(list[i])) return false;
    }
    return true;
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

  function refusedNote(parts) {
    function walk(used, built) {
      if (used === 15) return postingRefused(built);
      for (var i = 0; i < 4; i++) {
        if (used & (1 << i)) continue;
        if (walk(used | (1 << i), built + parts[i])) return true;
      }
      return false;
    }
    return walk(0, "");
  }

  function wholeSats(text) {
    var raw = String(text == null ? "" : text).trim();
    if (!raw) return { empty: true };
    if (!/^[1-9][0-9]*$/.test(raw)) return { bad: true };
    if (raw.length > 15) return { bad: true };
    var n = Number(raw);
    if (!Number.isSafeInteger(n) || n <= 0) return { bad: true };
    return { sats: String(n) };
  }

  function silentCode(text) {
    var raw = String(text == null ? "" : text).trim();
    if (!raw) return "";
    if (raw.length !== 116 || raw.indexOf("sp1q") !== 0) return null;
    for (var i = 3; i < raw.length; i++) {
      if (BECH32.indexOf(raw.charAt(i)) === -1) return null;
    }
    return raw;
  }

  function peerOk(pubkey) {
    return pubkey.length === 66 &&
      pubkey.charAt(0) === "0" &&
      (pubkey.charAt(1) === "2" || pubkey.charAt(1) === "3") &&
      /^[0-9a-f]+$/.test(pubkey);
  }

  function hostName(host) {
    if (host.charAt(0) === "[") {
      var end = host.indexOf("]");
      if (end === -1) return host;
      return host.slice(1, end);
    }
    var mark = host.lastIndexOf(":");
    if (mark === -1) return host;
    return host.slice(0, mark);
  }

  function ipv4(name) {
    var parts = name.split(".");
    if (parts.length !== 4) return null;
    var out = [];
    for (var i = 0; i < 4; i++) {
      var text = parts[i];
      if (!text || (text.length > 1 && text.charAt(0) === "0") || !/^[0-9]+$/.test(text)) return null;
      var n = Number(text);
      if (n > 255) return null;
      out.push(n);
    }
    return out;
  }

  function ipv4Public(octets) {
    var a = octets[0];
    var b = octets[1];
    if (a === 0 || a === 10 || a === 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    return true;
  }

  function ipv6Public(addr) {
    var text = addr.toLowerCase();
    if (text === "::" || text === "::1" || text === "0:0:0:0:0:0:0:1") return false;
    if (/^fe[89ab]/.test(text) || text.indexOf("fc") === 0 || text.indexOf("fd") === 0) return false;
    if (text.indexOf("::ffff:") === 0) {
      var mapped = ipv4(text.slice(7));
      if (mapped) return ipv4Public(mapped);
    }
    return true;
  }

  function channelHostOk(host) {
    if (host.length < 3 || host.length > 300 || /[^\x00-\x7F]/.test(host)) return false;
    if (/[\s\/@?#\\]/.test(host)) return false;
    var port;
    if (host.charAt(0) === "[") {
      var end = host.indexOf("]");
      if (end === -1) return false;
      var addr = host.slice(1, end);
      if (!addr || /[^0-9a-fA-F:]/.test(addr)) return false;
      if (host.charAt(end + 1) !== ":") return false;
      port = host.slice(end + 2);
    } else {
      var mark = host.lastIndexOf(":");
      if (mark <= 0) return false;
      var name = host.slice(0, mark);
      port = host.slice(mark + 1);
      if (!name || name.indexOf(":") !== -1 || /^[.\-]/.test(name) || /[.\-]$/.test(name)) return false;
      if (!/^[A-Za-z0-9.\-]+$/.test(name)) return false;
    }
    if (!port || port.length > 5 || (port.length > 1 && port.charAt(0) === "0") || !/^[0-9]+$/.test(port)) return false;
    var number = Number(port);
    return number > 0 && number <= 65535;
  }

  function hostPublic(host) {
    if (!channelHostOk(host)) return false;
    var name = hostName(host).toLowerCase();
    if (name === "localhost" || /\.local$/.test(name) || /\.localhost$/.test(name)) return false;
    if (host.charAt(0) === "[" || name.indexOf(":") !== -1) return ipv6Public(name);
    var octets = ipv4(name);
    if (octets) return ipv4Public(octets);
    return true;
  }

  function publicName(text) {
    var raw = String(text || "").trim();
    var at = raw.indexOf("@");
    if (at <= 0 || raw.indexOf("@", at + 1) !== -1) return "";
    var peer = raw.slice(0, at).trim().toLowerCase();
    var host = raw.slice(at + 1).trim().toLowerCase();
    if (!peerOk(peer) || !hostPublic(host)) return "";
    return peer + "@" + host;
  }

  function loginPaste(text) {
    return /lndconnect:|macaroon|eclair-|https?:\/\/|api password/i.test(text);
  }

  function tagValue(event, name) {
    var tags = event && event.tags;
    if (!Array.isArray(tags)) return "";
    for (var i = 0; i < tags.length; i++) {
      if (tags[i] && tags[i][0] === name && tags[i][1]) return String(tags[i][1]);
    }
    return "";
  }

  function hasTag(tags, want) {
    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i];
      if (!Array.isArray(tag) || tag.length < want.length) continue;
      var same = true;
      for (var j = 0; j < want.length; j++) {
        if (tag[j] !== want[j]) same = false;
      }
      if (same) return true;
    }
    return false;
  }

  function chainName(value) {
    return value === "btc" ? "btc" : "xbt";
  }

  function fail(message) {
    return { ok: false, message: message };
  }

  function buildPost(fields) {
    var title = oneLine(fields.title, 80);
    if (title === null) return fail("A title is one line, at most 80 characters.");
    if (!title) return fail("A missing title is dropped.");
    var summary = oneLine(fields.summary, 280);
    if (summary === null) return fail("A summary is one line, at most 280 characters.");
    var body = bodyText(fields.body);
    if (body.bad === "length") return fail("The body is at most 4000 characters.");
    if (body.bad) return fail("The body has a character this note cannot carry.");
    if (!dOk(fields.d)) return fail("A listing id is 1 to 256 characters with no spaces.");
    var category = String(fields.category || "");
    if (CATEGORIES.indexOf(category) === -1) return fail("Choose goods, services, a job, a rental, a giveaway, or a personal.");
    var city = oneLine(fields.city, 40);
    if (city === null) return fail("A city is one line, at most 40 characters.");
    if (refusedNote([title, summary, body.text, city])) return fail(CARRY);
    var hire = category === "job" && fields.side === "hire";
    var amount = wholeSats(fields.price);
    if (amount.bad) return fail(PRICE_TEXT);
    var payXbt = "";
    var payBtc = "";
    var nodeXbt = "";
    var nodeBtc = "";
    if (!hire) {
      payXbt = silentCode(fields.payXbt);
      payBtc = silentCode(fields.payBtc);
      if (payXbt === null) return fail("The XBT code is not a silent-payment code. This page cannot make one.");
      if (payBtc === null) return fail("The BTC code is not a silent-payment code. This page cannot make one.");
      if (amount.sats && !payXbt && !payBtc) return fail(PRICE_CODE);
      var nodes = readNodes(fields, payXbt, payBtc);
      if (!nodes.ok) return nodes;
      nodeXbt = nodes.xbt;
      nodeBtc = nodes.btc;
    }
    var published = Number(fields.publishedAt);
    if (!Number.isSafeInteger(published) || published <= 0) return fail("The note could not be prepared.");
    var tags = [["d", String(fields.d)], ["title", title]];
    if (summary) tags.push(["summary", summary]);
    tags.push(["published_at", String(published)]);
    if (city) tags.push(["location", city]);
    tags.push(["t", category]);
    if (amount.sats) tags.push(["price", amount.sats, chainName(fields.chain)]);
    if (payXbt) tags.push(["pay", payXbt, "xbt"]);
    if (payBtc) tags.push(["pay", payBtc, "btc"]);
    if (nodeXbt) tags.push(["node", nodeXbt, "xbt"]);
    if (nodeBtc) tags.push(["node", nodeBtc, "btc"]);
    if (category === "job") tags.push(["side", hire ? "hire" : "offer"]);
    return { ok: true, content: body.text, tags: tags, d: String(fields.d) };
  }

  function readNodes(fields, payXbt, payBtc) {
    var xbt = nodeFor(fields.nodeXbt, payXbt);
    if (!xbt.ok) return xbt;
    var btc = nodeFor(fields.nodeBtc, payBtc);
    if (!btc.ok) return btc;
    return { ok: true, xbt: xbt.name, btc: btc.name };
  }

  function nodeFor(text, code) {
    var raw = String(text || "").trim();
    if (!raw) return { ok: true, name: "" };
    if (loginPaste(raw)) return fail("Paste the public name, the line with @. A login is not that name.");
    var name = publicName(raw);
    if (!name || !code) return fail(SHIP);
    return { ok: true, name: name };
  }

  function buildStatus(fields) {
    var status = fields.status === "canceled" ? "canceled" : fields.status === "sold" ? "sold" : "";
    if (!status) return fail("The note could not be prepared.");
    if (!dOk(fields.d)) return fail("Enter the listing id this key already published.");
    var published = Number(fields.publishedAt);
    if (!Number.isSafeInteger(published) || published <= 0) return fail("The note could not be prepared.");
    return {
      ok: true,
      content: "",
      tags: [
        ["d", String(fields.d)],
        ["published_at", String(published)],
        ["status", status]
      ],
      d: String(fields.d)
    };
  }

  function signedOk(draft, signed) {
    if (!signed || signed.kind !== 30402 || signed.content !== draft.content) return false;
    if (!/^[0-9a-fA-F]{64}$/.test(String(signed.pubkey || ""))) return false;
    if (!/^[0-9a-fA-F]{64}$/.test(String(signed.id || ""))) return false;
    if (!/^[0-9a-fA-F]{128}$/.test(String(signed.sig || ""))) return false;
    if (!Array.isArray(signed.tags)) return false;
    for (var i = 0; i < draft.tags.length; i++) {
      if (!hasTag(signed.tags, draft.tags[i])) return false;
    }
    if (typeof signed.created_at !== "number" || !Number.isFinite(signed.created_at)) return false;
    var now = Math.floor(Date.now() / 1000);
    if (signed.created_at > now + 30 * 60) return false;
    if (signed.created_at < now - 2 * 24 * 60 * 60) return false;
    try {
      if (JSON.stringify(signed).length > 128 * 1024) return false;
    } catch (e) {
      return false;
    }
    return true;
  }

  function newId() {
    var bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    var out = "";
    for (var i = 0; i < bytes.length; i++) {
      var hex = bytes[i].toString(16);
      out += hex.length === 1 ? "0" + hex : hex;
    }
    return out;
  }

  var api = {
    RELAY: RELAY,
    buildPost: buildPost,
    buildStatus: buildStatus,
    signedOk: signedOk,
    postingRefused: postingRefused,
    silentCode: silentCode,
    publicName: publicName,
    dOk: dOk,
    newId: newId
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document === "undefined") return;

  var form = document.getElementById("classified-post");
  if (!form) return;
  var status = form.querySelector(".request-status");
  var titleInput = document.getElementById("classified-title");
  var dInput = document.getElementById("classified-d");
  var summaryInput = document.getElementById("classified-summary");
  var bodyInput = document.getElementById("classified-body");
  var categoryInput = document.getElementById("classified-category");
  var sideField = document.getElementById("classified-side");
  var hireNote = document.getElementById("classified-hire-note");
  var cityInput = document.getElementById("classified-city");
  var priceInput = document.getElementById("classified-price");
  var payXbtInput = document.getElementById("classified-pay-xbt");
  var payBtcInput = document.getElementById("classified-pay-btc");
  var nodeXbtInput = document.getElementById("classified-node-xbt");
  var nodeBtcInput = document.getElementById("classified-node-btc");
  var buttons = form.querySelectorAll("button");
  var busy = false;

  function say(text) {
    status.textContent = text;
  }

  function selected(name) {
    var input = form.querySelector("input[name=" + name + "]:checked");
    return input ? input.value : "";
  }

  function showJob() {
    var job = categoryInput.value === "job";
    sideField.hidden = !job;
    var hire = job && selected("side") === "hire";
    hireNote.hidden = !hire;
  }

  categoryInput.addEventListener("change", showJob);
  sideField.addEventListener("change", showJob);
  showJob();

  function fieldsFrom(act) {
    return {
      title: titleInput.value,
      d: dInput.value.trim(),
      summary: summaryInput.value,
      body: bodyInput.value,
      category: categoryInput.value,
      side: selected("side"),
      city: cityInput.value,
      price: priceInput.value,
      chain: selected("chain"),
      payXbt: payXbtInput.value,
      payBtc: payBtcInput.value,
      nodeXbt: nodeXbtInput.value,
      nodeBtc: nodeBtcInput.value,
      status: act,
      publishedAt: Math.floor(Date.now() / 1000)
    };
  }

  function lock(on) {
    busy = on;
    for (var i = 0; i < buttons.length; i++) buttons[i].disabled = on;
  }

  function once(socket, fn) {
    var settled = false;
    return function (value) {
      if (settled) return;
      settled = true;
      try {
        if (socket && socket.readyState < 2) socket.close();
      } catch (e) {}
      fn(value);
    };
  }

  function askPublishedAt(pubkey, d) {
    return new Promise(function (resolve) {
      var ws;
      var found = 0;
      var finish = function () {};
      var timer = setTimeout(function () { finish(); }, 4000);
      try {
        ws = new WebSocket(RELAY);
      } catch (e) {
        clearTimeout(timer);
        resolve(0);
        return;
      }
      finish = once(ws, function () {
        clearTimeout(timer);
        resolve(found);
      });
      ws.onopen = function () {
        ws.send(JSON.stringify(["REQ", "prior", {
          kinds: [30402],
          authors: [pubkey],
          "#d": [d],
          limit: 8
        }]));
      };
      ws.onmessage = function (message) {
        var frame;
        try {
          frame = JSON.parse(message.data);
        } catch (e) {
          return;
        }
        if (!Array.isArray(frame) || frame[0] === "AUTH") return;
        if (frame[0] === "EVENT" && frame[2]) {
          var at = tagValue(frame[2], "published_at");
          if (/^[1-9][0-9]{0,11}$/.test(at)) {
            var n = Number(at);
            if (Number.isSafeInteger(n) && n > found) found = n;
          }
        }
        if (frame[0] === "EOSE") finish();
      };
      ws.onerror = function () { finish(); };
      ws.onclose = function () { finish(); };
    });
  }

  function sendEvent(event) {
    return new Promise(function (resolve, reject) {
      var ws;
      var finish = function () {};
      var timer = setTimeout(function () { finish(new Error("timeout")); }, 15000);
      try {
        ws = new WebSocket(RELAY);
      } catch (e) {
        clearTimeout(timer);
        reject(e);
        return;
      }
      finish = once(ws, function (err) {
        clearTimeout(timer);
        if (err) reject(err);
        else resolve(true);
      });
      ws.onopen = function () {
        ws.send(JSON.stringify(["EVENT", event]));
      };
      ws.onmessage = function (message) {
        var frame;
        try {
          frame = JSON.parse(message.data);
        } catch (e) {
          return;
        }
        if (!Array.isArray(frame) || frame[0] === "AUTH") return;
        if (frame[0] === "OK" && String(frame[1] || "").toLowerCase() === String(event.id).toLowerCase()) {
          if (frame[2] === true) finish();
          else finish(new Error(relayReason(frame[3])));
        }
      };
      ws.onerror = function () { finish(new Error("closed")); };
      ws.onclose = function () { finish(new Error("closed")); };
    });
  }

  function relayReason(text) {
    var raw = String(text || "");
    if (!raw || raw.length > 160 || /[\r\n]/.test(raw) || /[^\x20-\x7e]/.test(raw)) return "closed";
    return raw;
  }

  function extension() {
    var nostr = window.nostr;
    if (!nostr || typeof nostr.signEvent !== "function" || typeof nostr.getPublicKey !== "function") return null;
    return nostr;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (busy) return;
    var act = event.submitter && event.submitter.value ? event.submitter.value : "post";
    var draftFields = fieldsFrom(act);
    if (act === "post" && !draftFields.d) {
      draftFields.d = newId();
      dInput.value = draftFields.d;
    }
    var built = act === "post" ? buildPost(draftFields) : buildStatus(draftFields);
    if (!built.ok) {
      say(built.message);
      return;
    }
    var nostr = extension();
    if (!nostr) {
      say("A Nostr extension in this browser signs the note. This page does not ask for a secret key.");
      return;
    }
    lock(true);
    say("Waiting for the extension to sign.");
    Promise.resolve()
      .then(function () { return nostr.getPublicKey(); })
      .then(function (pubkey) {
        if (!/^[0-9a-fA-F]{64}$/.test(String(pubkey || ""))) throw new Error("sign");
        return askPublishedAt(String(pubkey).toLowerCase(), built.d).then(function (prior) {
          if (prior) {
            for (var i = 0; i < built.tags.length; i++) {
              if (built.tags[i][0] === "published_at") built.tags[i][1] = String(prior);
            }
          }
          var draft = {
            pubkey: String(pubkey).toLowerCase(),
            created_at: Math.floor(Date.now() / 1000),
            kind: 30402,
            tags: built.tags,
            content: built.content
          };
          return nostr.signEvent(draft);
        });
      })
      .then(function (signed) {
        if (!signedOk({ content: built.content, tags: built.tags }, signed)) throw new Error("sign");
        say("Sending the note.");
        return sendEvent(signed);
      })
      .then(function () {
        if (act === "sold") say("The note is marked sold. A wallet hides it. Listing id " + built.d + ".");
        else if (act === "canceled") say("The note is marked canceled. A wallet hides it. Listing id " + built.d + ".");
        else say("The note is on the relay. Listing id " + built.d + ". The same key replaces it. A wallet shows it when Classifieds is on and that wallet is unlocked.");
      })
      .catch(function (err) {
        var reason = err && err.message;
        if (reason && reason !== "sign" && reason !== "closed" && reason !== "timeout") {
          say("The relay did not accept the note. " + reason);
        } else if (reason === "sign") {
          say("The extension did not sign. This page does not ask for a secret key.");
        } else {
          say("The relay did not accept the note.");
        }
      })
      .then(function () { lock(false); });
  });
})();
