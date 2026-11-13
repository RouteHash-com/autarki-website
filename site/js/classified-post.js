(function () {
  var RELAY = "wss://165.245.235.36:8444";
  var BECH32 = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
  var CATEGORIES = ["goods", "services", "job", "rental", "giveaway", "personal"];
  var CARRY = "This note cannot be posted. It asks for something this board does not carry.";
  var PRICE = "The price is a whole number of sats on XBT or BTC.";
  var SHIP = "Ship appears when the note names a public Lightning node for a chain that has a code.";
  var SHIP_PROMISE = "A shipment is 1 to 4 days, and Domestic or Overseas.";
  var SHIP_ORIGIN = "A shipment names a postal code, a country code, and a weight.";
  var TERMS_NEED = "Accept the board terms before posting.";
  var PREVIEW_NOTE = "This is how the note looks. It is not on the board yet. Edit the fields and preview again.";
  var PREVIEW_STALE = "The fields changed. Preview this ad again before posting.";
  var SIGNPOST_RELAYS = [
    "wss://nos.lol",
    "wss://relay.damus.io",
    "wss://relay.primal.net",
    "wss://relay.nostr.band"
  ];
  var SIGNPOST_SHOWN = "Other markets can show this ad. The sale stays on Autarki.";
  var SIGNPOST_HIDDEN = "Other markets were told to drop this ad. The ad stays on Autarki.";
  var SIGNPOST_MISSED = "A node did not answer.";
  var SIGNPOST_KEY = "autarki-classified-signposts";
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

  function wholeSats(text) {
    var raw = String(text == null ? "" : text).trim();
    if (!raw) return { empty: true };
    if (!/^[0-9]+$/.test(raw) || raw.length > 16) return { bad: true };
    var n = Number(raw);
    if (!Number.isSafeInteger(n)) return { bad: true };
    if (n === 0) return { empty: true };
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

  function cleanTyped(text, mode) {
    var out = "";
    var raw = String(text == null ? "" : text);
    for (var i = 0; i < raw.length; i++) {
      var ch = raw.charAt(i);
      var code = raw.charCodeAt(i);
      if ((mode === "break" || mode === "lines") && ch === "\n") {
        out += ch;
        continue;
      }
      if (mode === "digit") {
        if (code >= 48 && code <= 57) out += ch;
        continue;
      }
      if (mode === "weight") {
        if (code >= 48 && code <= 57) out += ch;
        else if (ch === "." && out && out.indexOf(".") === -1) out += ch;
        continue;
      }
      if (code < 32 || code === 127 || code === 8232 || code === 8233) continue;
      if ((mode === "url" || mode === "lines") && ch === " ") continue;
      out += ch;
    }
    return out;
  }

  function placeClip(text) {
    var clean = cleanTyped(text, "line").trim();
    var out = "";
    var count = 0;
    for (var i = 0; i < clean.length && count < 40; i++) {
      var code = clean.charCodeAt(i);
      out += clean.charAt(i);
      if (code >= 55296 && code <= 56319 && i + 1 < clean.length) {
        i += 1;
        out += clean.charAt(i);
      }
      count += 1;
    }
    return out;
  }

  function logoAddress(text) {
    var url = String(text || "").trim();
    if (!url) return "";
    if (url.length > 8000) return null;
    for (var i = 0; i < url.length; i++) {
      var code = url.charCodeAt(i);
      if (code < 33 || code === 127 || code === 8232 || code === 8233 || url.charAt(i) === "<" || url.charAt(i) === ">") return null;
    }
    if (url.slice(0, 11) === "data:image/") return null;
    if (url.length > 2000 || url.slice(0, 8) !== "https://") return null;
    if (url.indexOf("@") >= 0 || url.indexOf("\\") >= 0) return null;
    var hostRest = url.slice(8);
    var cut = hostRest.length;
    var marks = ["/", "?", "#"];
    for (var m = 0; m < marks.length; m++) {
      var found = hostRest.indexOf(marks[m]);
      if (found >= 0 && found < cut) cut = found;
    }
    var host = hostRest.slice(0, cut).toLowerCase();
    if (!host || host.indexOf(":") >= 0 || host.indexOf("..") >= 0) return null;
    if (host.charAt(0) === "." || host.charAt(0) === "-" || host.charAt(host.length - 1) === "." || host.charAt(host.length - 1) === "-") return null;
    if (!/^[a-z0-9.-]+$/.test(host) || host.indexOf(".") < 0) return null;
    return url;
  }

  function pictureAddress(text) {
    var url = logoAddress(text);
    if (url === null) return null;
    if (url.slice(0, 5) === "data:") return null;
    return url;
  }

  function imageLines(text) {
    var lines = String(text == null ? "" : text).split("\n");
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      var url = pictureAddress(line);
      if (url !== line) return null;
      if (out.indexOf(url) >= 0) continue;
      if (out.length >= 4) return null;
      out.push(url);
    }
    return out;
  }

  function mapSource(text) {
    var raw = String(text || "");
    if (raw.indexOf("<") >= 0 || raw.indexOf(">") >= 0 || /\s/.test(raw)) {
      var lower = raw.toLowerCase();
      var at = lower.indexOf("src=");
      if (at < 0) return null;
      var rest = raw.slice(at + 4);
      var quote = rest.charAt(0);
      if (quote !== "\"" && quote !== "'") return null;
      var end = rest.indexOf(quote, 1);
      if (end < 1) return null;
      return rest.slice(1, end).replace(/&amp;/g, "&").trim();
    }
    return raw.trim();
  }

  function mapPathOk(path) {
    for (var i = 0; i < path.length; i++) {
      if (!/[A-Za-z0-9\-._~:/?#!$&()*+,;=%]/.test(path.charAt(i))) return false;
    }
    return true;
  }

  function mapHostCut(rest) {
    var cut = rest.length;
    var marks = ["/", "?", "#"];
    for (var m = 0; m < marks.length; m++) {
      var found = rest.indexOf(marks[m]);
      if (found >= 0 && found < cut) cut = found;
    }
    return cut;
  }

  function mapAddress(text) {
    var url = mapSource(String(text == null ? "" : text).trim());
    if (url === null) return null;
    url = url.trim();
    if (!url) return "";
    if (url.length > 800 || url.slice(0, 8) !== "https://") return null;
    if (url.indexOf("@") >= 0 || url.indexOf("\\") >= 0) return null;
    for (var i = 0; i < url.length; i++) {
      var code = url.charCodeAt(i);
      if (code < 33 || code === 127 || code === 8232 || code === 8233) return null;
    }
    var rest = url.slice(8);
    var cut = mapHostCut(rest);
    var host = rest.slice(0, cut).toLowerCase();
    var path = rest.slice(cut);
    if (!host || host.indexOf(":") >= 0 || host.indexOf("..") >= 0) return null;
    if (host.charAt(0) === "." || host.charAt(0) === "-" || host.charAt(host.length - 1) === "." || host.charAt(host.length - 1) === "-") return null;
    if (!/^[a-z0-9.-]+$/.test(host) || host.indexOf(".") < 0) return null;
    if (!mapPathOk(path)) return null;
    if (host === "maps.app.goo.gl") {
      if (path.charAt(0) !== "/") return null;
      var token = path.slice(1);
      if (!token || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
      return url;
    }
    if (host === "goo.gl") {
      if (path.slice(0, 6) !== "/maps/" || path.length <= 6 || path.charAt(6) === "/") return null;
      return url;
    }
    if (host === "google.com" || host === "www.google.com" || host === "maps.google.com") {
      if (path.slice(0, 5) !== "/maps") return null;
      var next = path.charAt(5);
      if (next && next !== "/" && next !== "?" && next !== "#") return null;
      return url;
    }
    if (host === "maps.apple.com" || host === "openstreetmap.org" || host === "www.openstreetmap.org") {
      if (path && path.charAt(0) !== "/" && path.charAt(0) !== "?" && path.charAt(0) !== "#") return null;
      return url;
    }
    return null;
  }

  function shipPostal(text) {
    var raw = String(text || "").toUpperCase();
    var out = "";
    for (var i = 0; i < raw.length; i++) {
      var ch = raw.charAt(i);
      if (ch === " " || ch === "-") continue;
      var code = raw.charCodeAt(i);
      var digit = code >= 48 && code <= 57;
      var letter = code >= 65 && code <= 90;
      if (!digit && !letter) return "";
      out += ch;
    }
    if (out.length < 3 || out.length > 10) return "";
    return out;
  }

  function shipCountry(text) {
    var raw = String(text || "").trim().toUpperCase();
    if (raw.length !== 2) return "";
    var first = raw.charCodeAt(0);
    var second = raw.charCodeAt(1);
    if (first < 65 || first > 90 || second < 65 || second > 90) return "";
    return raw;
  }

  function shipWeight(text) {
    text = String(text || "").trim();
    if (!text || text.charAt(0) === "+" || text.charAt(0) === "-" || text.charAt(0) === ".") return "";
    var dot = text.indexOf(".");
    if (dot >= 0 && text.indexOf(".", dot + 1) >= 0) return "";
    var whole = dot < 0 ? text : text.slice(0, dot);
    var frac = dot < 0 ? "" : text.slice(dot + 1);
    if (!whole || whole.length > 2 || frac.length > 3) return "";
    if (whole.charAt(0) === "0" && whole.length > 1) return "";
    var index;
    for (index = 0; index < whole.length; index++) {
      var wholeCode = whole.charCodeAt(index);
      if (wholeCode < 48 || wholeCode > 57) return "";
    }
    for (index = 0; index < frac.length; index++) {
      var fracCode = frac.charCodeAt(index);
      if (fracCode < 48 || fracCode > 57) return "";
    }
    var milli = Number(whole) * 1000;
    var padded = frac;
    while (padded.length < 3) padded += "0";
    if (frac) milli += Number(padded);
    if (!Number.isSafeInteger(milli) || milli < 100 || milli > 68000) return "";
    if (!frac || Number(padded) === 0) return String(Number(whole));
    var shown = String(Number(padded));
    while (shown.length < 3) shown = "0" + shown;
    while (shown.charAt(shown.length - 1) === "0") shown = shown.slice(0, shown.length - 1);
    return String(Number(whole)) + "." + shown;
  }

  function shipOrigin(postal, cc, kg) {
    var postalRaw = String(postal == null ? "" : postal).trim();
    var ccRaw = String(cc == null ? "" : cc).trim();
    var kgRaw = String(kg == null ? "" : kg).trim();
    if (!postalRaw && !ccRaw && !kgRaw) return { ok: true, postal: "", cc: "", kg: "" };
    var cleanPostal = shipPostal(postalRaw);
    var cleanCc = shipCountry(ccRaw);
    var cleanKg = shipWeight(kgRaw);
    if (!cleanPostal || !cleanCc || !cleanKg) return fail(SHIP_ORIGIN);
    return { ok: true, postal: cleanPostal, cc: cleanCc, kg: cleanKg };
  }

  function hireAccept(npub, id) {
    var name = String(npub == null ? "" : npub).trim();
    var job = String(id == null ? "" : id).trim();
    if (!name && !job) return { ok: true, npub: "", d: "" };
    if (!/^npub1[023456789acdefghjklmnpqrstuvwxyz]{11,85}$/.test(name)) {
      return fail("The public name could not be read.");
    }
    if (!dOk(job)) return fail("Name the job and the person who posted it.");
    return { ok: true, npub: name, d: job };
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
    if (title === null || !title) return fail("The title is one line of at most 80 characters.");
    var summary = oneLine(fields.summary, 280);
    if (summary === null) return fail("The summary is one line of at most 280 characters.");
    var body = bodyText(fields.body);
    if (body.bad) return fail("The description is at most 4000 characters.");
    if (!dOk(fields.d)) return fail("A listing id is 1 to 256 characters with no spaces.");
    var category = String(fields.category || "");
    if (CATEGORIES.indexOf(category) === -1) return fail("Choose goods, services, a job, a rental, a giveaway, or a personal.");
    var country = oneLine(fields.country, 40);
    var province = oneLine(fields.province, 40);
    var city = oneLine(fields.city, 40);
    var neighbourhood = oneLine(fields.neighbourhood, 40);
    if (country === null || province === null || city === null || neighbourhood === null) {
      return fail("A place is one line of at most 40 characters.");
    }
    if (refusedNote([title, summary, body.text, city, neighbourhood])) return fail(CARRY);
    var job = category === "job";
    var priced = job || category === "goods" || category === "services" || category === "rental";
    var picture = category === "goods" || category === "services" || category === "rental" || category === "giveaway";
    var allowMap = category === "goods" || category === "services" || category === "rental";
    var hire = job && fields.side === "hire";
    var images = [];
    if (picture) {
      images = imageLines(fields.images);
      if (!images) return fail("An image address is https. Four is the limit.");
    }
    var map = "";
    if (allowMap) {
      map = mapAddress(fields.map);
      if (map === null) return fail("The map link could not be saved.");
    }
    var amount = { empty: true };
    if (priced) {
      amount = wholeSats(fields.price);
      if (amount.bad) return fail(PRICE);
    }
    var payXbt = "";
    var payBtc = "";
    var nodeXbt = "";
    var nodeBtc = "";
    if (priced && !hire) {
      payXbt = silentCode(fields.payXbt);
      payBtc = silentCode(fields.payBtc);
      if (payXbt === null) return fail("The XBT code is not a silent-payment code. This page cannot make one.");
      if (payBtc === null) return fail("The BTC code is not a silent-payment code. This page cannot make one.");
      var nodes = readNodes(fields, payXbt, payBtc);
      if (!nodes.ok) return nodes;
      nodeXbt = nodes.xbt;
      nodeBtc = nodes.btc;
    }
    var shipDays = "";
    var hold = "";
    var postal = "";
    var cc = "";
    var kg = "";
    if ((category === "goods" || category === "services" || category === "rental") && amount.sats) {
      var days = String(fields.shipDays == null ? "" : fields.shipDays).trim();
      hold = fields.hold === "domestic" || fields.hold === "overseas" ? fields.hold : "";
      if ((days !== "1" && days !== "2" && days !== "3" && days !== "4") || !hold) return fail(SHIP_PROMISE);
      shipDays = days;
      var origin = shipOrigin(fields.postal, fields.cc, fields.kg);
      if (!origin.ok) return origin;
      postal = origin.postal;
      cc = origin.cc;
      kg = origin.kg;
    }
    var hireNpub = "";
    var hireD = "";
    if (job && !hire) {
      var accepted = hireAccept(fields.hireNpub, fields.hireD);
      if (!accepted.ok) return accepted;
      hireNpub = accepted.npub;
      hireD = accepted.d;
    }
    var published = Number(fields.publishedAt);
    if (!Number.isSafeInteger(published) || published <= 0) return fail("The note could not be prepared.");
    var tags = [["d", String(fields.d)], ["title", title]];
    if (summary) tags.push(["summary", summary]);
    tags.push(["published_at", String(published)]);
    if (city) tags.push(["location", city]);
    if (country) tags.push(["country", country]);
    if (province) tags.push(["province", province]);
    if (neighbourhood) tags.push(["neighbourhood", neighbourhood]);
    tags.push(["t", category]);
    if (amount.sats) tags.push(["price", amount.sats, chainName(fields.chain)]);
    for (var i = 0; i < images.length; i++) tags.push(["image", images[i]]);
    if (map) tags.push(["map", map]);
    if (payXbt) tags.push(["pay", payXbt, "xbt"]);
    if (payBtc) tags.push(["pay", payBtc, "btc"]);
    if (nodeXbt) tags.push(["node", nodeXbt, "xbt"]);
    if (nodeBtc) tags.push(["node", nodeBtc, "btc"]);
    if (job) tags.push(["side", hire ? "hire" : "offer"]);
    if (hireNpub && hireD) tags.push(["hire", hireNpub, hireD]);
    if (shipDays) {
      tags.push(["ship_days", shipDays]);
      tags.push(["hold", hold]);
      if (postal) {
        tags.push(["postal", postal]);
        tags.push(["cc", cc]);
        tags.push(["kg", kg]);
      }
    }
    return {
      ok: true,
      content: body.text,
      tags: tags,
      d: String(fields.d),
      images: images,
      map: map,
      usedImages: picture,
      usedMap: allowMap
    };
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

  function tagText(tags, name) {
    var i;
    for (i = 0; i < tags.length; i++) {
      if (tags[i] && tags[i][0] === name && tags[i][1]) return String(tags[i][1]);
    }
    return "";
  }

  function groupedSats(text) {
    return String(text).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function signpostLine(chain) {
    if (chain === "xbt") return "Available only on Autarki; priced in XBT.";
    if (chain === "btc") return "Available only on Autarki; priced in BTC.";
    return "";
  }

  function signpostDraft(built, signD, publishedAt) {
    if (!built || !built.ok) return fail("The note could not be prepared.");
    var tagsIn = built.tags || [];
    var price = null;
    var images = [];
    var category = "";
    var hire = false;
    var i;
    for (i = 0; i < tagsIn.length; i++) {
      var tag = tagsIn[i];
      if (!tag) continue;
      if (tag[0] === "price" && !price && (tag[2] === "xbt" || tag[2] === "btc")) price = tag;
      if (tag[0] === "image" && images.length < 4) images.push(String(tag[1]));
      if (tag[0] === "t" && !category) category = String(tag[1]);
      if (tag[0] === "side" && tag[1] === "hire") hire = true;
    }
    if (hire || !price || !price[1]) return fail("This ad has no XBT or BTC amount.");
    if (category !== "goods" && category !== "services" && category !== "job" && category !== "rental") {
      return fail("This ad has no XBT or BTC amount.");
    }
    var at = Number(publishedAt);
    if (!/^[0-9a-f]{16}$/.test(String(signD || "")) || signD === String(built.d) || !Number.isSafeInteger(at) || at <= 0) {
      return fail("That listing cannot be changed that way.");
    }
    var title = tagText(tagsIn, "title");
    if (!title) return fail("The title is one line of at most 80 characters.");
    var line = signpostLine(String(price[2]));
    if (!line) return fail("This ad has no XBT or BTC amount.");
    var seller = built.content ? String(built.content) : "";
    var content = line + "\n" + groupedSats(price[1]) + " sats.\nhttps://autarki.app";
    if (seller) content += "\n\n" + seller;
    var body = bodyText(content);
    if (body.bad) return fail("The description is at most 4000 characters.");
    var city = tagText(tagsIn, "location");
    var country = tagText(tagsIn, "country");
    var province = tagText(tagsIn, "province");
    var neighbourhood = tagText(tagsIn, "neighbourhood");
    if (refusedNote([body.text, line, title, city, neighbourhood, country, province])) return fail(CARRY);
    var tags = [
      ["d", String(signD)],
      ["title", title],
      ["summary", line],
      ["published_at", String(at)]
    ];
    if (city) tags.push(["location", city]);
    if (country) tags.push(["country", country]);
    if (province) tags.push(["province", province]);
    if (neighbourhood) tags.push(["neighbourhood", neighbourhood]);
    tags.push(["t", category]);
    for (i = 0; i < images.length; i++) tags.push(["image", images[i]]);
    return { ok: true, content: body.text, tags: tags, d: String(signD), publishedAt: at };
  }

  function signpostCancel(signD, publishedAt) {
    var at = Number(publishedAt);
    if (!/^[0-9a-f]{16}$/.test(String(signD || "")) || !Number.isSafeInteger(at) || at <= 0) {
      return fail("That listing cannot be changed that way.");
    }
    return {
      ok: true,
      content: "",
      tags: [
        ["d", String(signD)],
        ["published_at", String(at)],
        ["status", "canceled"]
      ],
      d: String(signD),
      publishedAt: at
    };
  }

  function bech32Polymod(values) {
    var gen = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    var chk = 1;
    var i;
    for (i = 0; i < values.length; i++) {
      var top = chk >>> 25;
      chk = ((chk & 0x1ffffff) << 5) ^ values[i];
      var bit;
      for (bit = 0; bit < 5; bit++) {
        if ((top >>> bit) & 1) chk ^= gen[bit];
      }
    }
    return chk >>> 0;
  }

  function bech32HrpExpand(hrp) {
    var out = [];
    var i;
    for (i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) >> 5);
    out.push(0);
    for (i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) & 31);
    return out;
  }

  function bech32Encode(hrp, data) {
    var values = bech32HrpExpand(hrp);
    var i;
    for (i = 0; i < data.length; i++) values.push(data[i]);
    for (i = 0; i < 6; i++) values.push(0);
    var mod = bech32Polymod(values) ^ 1;
    var out = hrp + "1";
    for (i = 0; i < data.length; i++) out += BECH32.charAt(data[i]);
    for (i = 0; i < 6; i++) out += BECH32.charAt((mod >>> (5 * (5 - i))) & 31);
    return out;
  }

  function convertBits(data, from, to, pad) {
    var acc = 0;
    var bits = 0;
    var out = [];
    var maxv = (1 << to) - 1;
    var i;
    for (i = 0; i < data.length; i++) {
      acc = (acc << from) | data[i];
      bits += from;
      while (bits >= to) {
        bits -= to;
        out.push((acc >>> bits) & maxv);
      }
    }
    if (pad) {
      if (bits) out.push((acc << (to - bits)) & maxv);
    } else if (bits >= from || ((acc << (to - bits)) & maxv)) {
      return null;
    }
    return out;
  }

  function naddrFor(pubkey, identifier) {
    if (!/^[0-9a-fA-F]{64}$/.test(String(pubkey || ""))) return "";
    if (typeof identifier !== "string" || !identifier || identifier.length > 255) return "";
    var author = [];
    var ident = [];
    var tlv = [];
    var i;
    for (i = 0; i < 64; i += 2) author.push(parseInt(String(pubkey).substr(i, 2), 16));
    for (i = 0; i < identifier.length; i++) ident.push(identifier.charCodeAt(i) & 255);
    function push(type, bytes) {
      tlv.push(type);
      tlv.push(bytes.length);
      for (var n = 0; n < bytes.length; n++) tlv.push(bytes[n]);
    }
    push(0, ident);
    for (i = 0; i < SIGNPOST_RELAYS.length; i++) {
      var relay = [];
      var c;
      for (c = 0; c < SIGNPOST_RELAYS[i].length; c++) relay.push(SIGNPOST_RELAYS[i].charCodeAt(c));
      push(1, relay);
    }
    push(2, author);
    push(3, [0, 0, 0x76, 0xc2]);
    var five = convertBits(tlv, 8, 5, true);
    if (!five) return "";
    return bech32Encode("naddr", five);
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
    newId: newId,
    imageLines: imageLines,
    mapAddress: mapAddress,
    signpostDraft: signpostDraft,
    signpostCancel: signpostCancel,
    naddrFor: naddrFor,
    signpostRelays: SIGNPOST_RELAYS
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
  var fieldsBlock = document.getElementById("classified-fields");
  var sideField = document.getElementById("classified-side");
  var hireNote = document.getElementById("classified-hire-note");
  var needNote = document.getElementById("classified-need");
  var priceBlock = document.getElementById("classified-price-block");
  var shipBlock = document.getElementById("classified-ship");
  var payBlock = document.getElementById("classified-pay");
  var hireAcceptBlock = document.getElementById("classified-hire-accept");
  var pictureBlock = document.getElementById("classified-pictures");
  var mapBlock = document.getElementById("classified-map-block");
  var nodeBlock = document.getElementById("classified-nodes");
  var termsBlock = document.getElementById("classified-terms");
  var countryInput = document.getElementById("classified-country");
  var provinceInput = document.getElementById("classified-province");
  var cityInput = document.getElementById("classified-city");
  var neighbourhoodInput = document.getElementById("classified-neighbourhood");
  var priceInput = document.getElementById("classified-price");
  var payXbtInput = document.getElementById("classified-pay-xbt");
  var payBtcInput = document.getElementById("classified-pay-btc");
  var postalInput = document.getElementById("classified-postal");
  var ccInput = document.getElementById("classified-cc");
  var kgInput = document.getElementById("classified-kg");
  var hireNpubInput = document.getElementById("classified-hire-npub");
  var hireDInput = document.getElementById("classified-hire-d");
  var imagesInput = document.getElementById("classified-images");
  var mapInput = document.getElementById("classified-map");
  var previewBlock = document.getElementById("classified-preview");
  var previewCard = document.getElementById("classified-preview-card");
  var previewNote = document.getElementById("classified-preview-note");
  var previewButton = document.getElementById("classified-preview-open");
  var signpostLineEl = document.getElementById("classified-signpost-line");
  var signpostInput = document.getElementById("classified-signpost");
  var signpostLinks = document.getElementById("classified-signpost-links");
  var nodeXbtInput = document.getElementById("classified-node-xbt");
  var nodeBtcInput = document.getElementById("classified-node-btc");
  var locateButton = document.getElementById("classified-locate");
  var placeStatus = document.getElementById("classified-place-status");
  var buttons = form.querySelectorAll("button");
  var busy = false;
  var spotQuotes = null;
  var signerPubkey = "";
  var signpostCache = null;

  function say(text) {
    status.textContent = text;
  }

  function selected(name) {
    var input = form.querySelector("input[name='" + name + "']:checked");
    return input ? input.value : "";
  }

  function termsAccepted() {
    try {
      if (localStorage.getItem("autarki-board-terms") === "1") return true;
    } catch (e) {}
    return termsBlock && termsBlock.getAttribute("data-accepted") === "1";
  }

  function acceptTerms() {
    if (termsBlock) termsBlock.setAttribute("data-accepted", "1");
    try {
      localStorage.setItem("autarki-board-terms", "1");
    } catch (e) {}
  }

  function paintTerms() {
    if (termsBlock) termsBlock.hidden = termsAccepted();
  }

  function showPlan() {
    if (!categoryInput) return;
    var category = categoryInput.value;
    var known = CATEGORIES.indexOf(category) !== -1;
    var job = category === "job";
    var priced = job || category === "goods" || category === "services" || category === "rental";
    var picture = category === "goods" || category === "services" || category === "rental" || category === "giveaway";
    var allowMap = category === "goods" || category === "services" || category === "rental";
    var hire = job && selected("side") === "hire";
    var amount = wholeSats(priceInput ? priceInput.value : "");
    var ship = (category === "goods" || category === "services" || category === "rental") && !!amount.sats;
    var pay = priced && !hire;
    if (fieldsBlock) fieldsBlock.hidden = !known;
    if (sideField) {
      sideField.hidden = !job;
      // .chain-pick sets display:flex, which overrides the hidden attribute.
      sideField.style.display = job ? "" : "none";
    }
    if (hireNote) hireNote.hidden = !hire;
    if (needNote) needNote.hidden = !(category === "goods" || category === "services" || category === "rental" || (job && !hire));
    if (priceBlock) priceBlock.hidden = !priced;
    if (shipBlock) shipBlock.hidden = !ship;
    if (payBlock) payBlock.hidden = !pay;
    if (hireAcceptBlock) hireAcceptBlock.hidden = !(job && !hire);
    if (pictureBlock) pictureBlock.hidden = !picture;
    if (mapBlock) mapBlock.hidden = !allowMap;
    if (nodeBlock) nodeBlock.hidden = !pay;
    if (signpostLineEl) {
      var showSign = signpostCategory();
      signpostLineEl.hidden = !showSign;
      // A later display rule must not keep this box on screen after it is hidden.
      signpostLineEl.style.display = showSign ? "" : "none";
    }
    paintSignpostLinks();
    paintPriceHint();
  }

  function paintPriceHint() {
    var node = document.getElementById("classified-price-hint");
    if (!node) return;
    var amount = wholeSats(priceInput ? priceInput.value : "");
    var chain = selected("chain");
    var country = countryInput ? countryInput.value : "";
    var text = "";
    if (amount.sats && (chain === "xbt" || chain === "btc") && typeof AutarkiHint !== "undefined" && spotQuotes) {
      text = AutarkiHint.hint(Number(amount.sats), chain, country, spotQuotes);
    }
    node.textContent = text ? " · " + text : "";
  }

  function signpostCategory() {
    var category = categoryInput ? categoryInput.value : "";
    var job = category === "job";
    var hire = job && selected("side") === "hire";
    return category === "goods" || category === "services" || category === "rental" || (job && !hire);
  }

  function signpostOffer() {
    if (!signpostCategory()) return false;
    var amount = wholeSats(priceInput ? priceInput.value : "");
    if (!amount.sats) return false;
    var chain = selected("chain");
    return chain === "xbt" || chain === "btc";
  }

  function signpostBoxOn() {
    if (!signpostOffer()) return false;
    return !!(signpostInput && signpostInput.checked);
  }

  var termsAccept = document.getElementById("classified-terms-accept");
  var termsLater = document.getElementById("classified-terms-later");
  if (termsAccept) {
    termsAccept.addEventListener("click", function () {
      acceptTerms();
      paintTerms();
      showPlan();
      say("");
    });
  }
  if (termsLater) {
    termsLater.addEventListener("click", function () {
      say(TERMS_NEED);
    });
  }
  if (categoryInput) categoryInput.addEventListener("change", showPlan);
  if (sideField) sideField.addEventListener("change", showPlan);
  var chainField = document.getElementById("classified-chain");
  if (chainField) chainField.addEventListener("change", showPlan);
  showPlan();
  paintTerms();
  window.addEventListener("pageshow", showPlan);

  function guardInput(node, mode) {
    if (!node) return;
    node.addEventListener("input", function () {
      var next = cleanTyped(node.value, mode);
      if (next === node.value) return;
      var at = node.selectionStart;
      node.value = next;
      if (node.setSelectionRange && typeof at === "number") {
        var pos = at > next.length ? next.length : at;
        node.setSelectionRange(pos, pos);
      }
    });
  }

  guardInput(titleInput, "line");
  guardInput(dInput, "line");
  guardInput(summaryInput, "line");
  guardInput(bodyInput, "break");
  guardInput(countryInput, "line");
  guardInput(provinceInput, "line");
  guardInput(cityInput, "line");
  guardInput(neighbourhoodInput, "line");
  guardInput(priceInput, "digit");
  if (priceInput) priceInput.addEventListener("input", showPlan);
  if (countryInput) countryInput.addEventListener("input", paintPriceHint);
  if (typeof fetch === "function") {
    fetch("/api/spot", { headers: { accept: "application/json" } })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (body) {
        if (!body || body.ok !== true) return;
        spotQuotes = body;
        paintPriceHint();
      })
      .catch(function () {});
  }
  guardInput(kgInput, "weight");
  guardInput(hireNpubInput, "url");
  guardInput(hireDInput, "line");
  guardInput(payXbtInput, "url");
  guardInput(payBtcInput, "url");
  guardInput(imagesInput, "lines");
  guardInput(mapInput, "url");
  guardInput(nodeXbtInput, "line");
  guardInput(nodeBtcInput, "line");

  function placeNote(text) {
    if (placeStatus) placeStatus.textContent = text || "";
  }

  function placeParts(address) {
    var found = address || {};
    return {
      country: placeClip(found.country),
      province: placeClip(found.state),
      city: placeClip(found.city || found.town || found.village || found.municipality || found.hamlet),
      neighbourhood: placeClip(found.suburb || found.neighbourhood || found.quarter || found.city_district)
    };
  }

  function placeCity(place) {
    if (!place) return "";
    return place.city || place.neighbourhood || place.province || place.country || "";
  }

  function lookupPlace(latitude, longitude, done) {
    var address = "https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=" +
      encodeURIComponent(String(latitude)) + "&lon=" + encodeURIComponent(String(longitude));
    fetch(address, { headers: { "Accept": "application/json" }, cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("lookup");
        return response.json();
      })
      .then(function (payload) {
        var parts = placeParts(payload && payload.address);
        if (!placeCity(parts)) throw new Error("lookup");
        done(null, parts, "");
      })
      .catch(function () {
        done("The city could not be looked up.");
      });
  }

  function networkCity(done, failure) {
    fetch("https://get.geojs.io/v1/ip/geo.json", { headers: { "Accept": "application/json" }, cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("lookup");
        return response.json();
      })
      .then(function (row) {
        var parts = {
          country: placeClip(row && row.country),
          province: placeClip(row && row.region),
          city: placeClip(row && row.city),
          neighbourhood: ""
        };
        if (!placeCity(parts)) throw new Error("lookup");
        done(null, parts, "network");
      })
      .catch(function () {
        done(failure || "The city could not be looked up.");
      });
  }

  function placeDenied(error, done) {
    var code = error && error.code;
    if (code === 1) {
      if (!navigator.permissions || !navigator.permissions.query) {
        done("This browser did not share a place.");
        return;
      }
      navigator.permissions.query({ name: "geolocation" }).then(function (status) {
        if (status && status.state === "granted") networkCity(done, "This browser allowed it, but no place came back.");
        else done("This browser did not share a place.");
      }).catch(function () {
        done("This browser did not share a place.");
      });
      return;
    }
    var failure = code === 3 ? "The place lookup timed out." : "This browser allowed it, but no place came back.";
    networkCity(done, failure);
  }

  function devicePlace(done) {
    if (!navigator.geolocation) {
      networkCity(done, "This browser has no location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(function (position) {
      var coords = position && position.coords;
      if (!coords || typeof coords.latitude !== "number" || typeof coords.longitude !== "number") {
        networkCity(done, "This browser allowed it, but no place came back.");
        return;
      }
      lookupPlace(coords.latitude, coords.longitude, function (error, place) {
        if (error || !place) done(error || "The city could not be looked up.");
        else done(null, place, "");
      });
    }, function (error) {
      placeDenied(error, done);
    }, { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 });
  }

  function fillPlace(place) {
    countryInput.value = place.country || "";
    provinceInput.value = place.province || "";
    cityInput.value = place.city || "";
    neighbourhoodInput.value = place.neighbourhood || "";
    markPreviewStale();
  }

  if (locateButton) {
    locateButton.addEventListener("click", function () {
      placeNote("Looking up this place.");
      locateButton.disabled = true;
      devicePlace(function (error, place, source) {
        locateButton.disabled = false;
        if (error || !place) {
          placeNote(error || "The city could not be looked up.");
          return;
        }
        fillPlace(place);
        placeNote(source === "network" ? "Filled from the network." : "Filled from this device.");
      });
    });
  }

  function fieldsFrom(act) {
    return {
      title: titleInput.value,
      d: dInput.value.trim(),
      summary: summaryInput.value,
      body: bodyInput.value,
      category: categoryInput.value,
      side: selected("side"),
      country: countryInput.value,
      province: provinceInput.value,
      city: cityInput.value,
      neighbourhood: neighbourhoodInput.value,
      price: priceInput.value,
      chain: selected("chain"),
      shipDays: selected("ship-days"),
      hold: selected("hold"),
      postal: postalInput ? postalInput.value : "",
      cc: ccInput ? ccInput.value : "",
      kg: kgInput ? kgInput.value : "",
      hireNpub: hireNpubInput ? hireNpubInput.value : "",
      hireD: hireDInput ? hireDInput.value : "",
      payXbt: payXbtInput.value,
      payBtc: payBtcInput.value,
      images: imagesInput.value,
      map: mapInput.value,
      nodeXbt: nodeXbtInput.value,
      nodeBtc: nodeBtcInput.value,
      status: act,
      publishedAt: Math.floor(Date.now() / 1000)
    };
  }

  function lock(on) {
    busy = on;
    for (var i = 0; i < buttons.length; i++) buttons[i].disabled = on;
    if (signpostInput) signpostInput.disabled = on;
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

  function previewTag(tags, name) {
    for (var i = 0; i < tags.length; i++) {
      if (tags[i] && tags[i][0] === name && tags[i][1]) return tags[i];
    }
    return null;
  }

  function previewValue(tags, name) {
    var tag = previewTag(tags, name);
    return tag ? String(tag[1]) : "";
  }

  function previewSats(text) {
    return String(text).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " sats";
  }

  function previewDay(unix) {
    var date = new Date(Number(unix) * 1000);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  }

  function previewImage(parent, url, className) {
    var img = document.createElement("img");
    if (className) img.className = className;
    img.alt = "";
    img.referrerPolicy = "no-referrer";
    img.decoding = "async";
    img.onload = function () {
      if (img.naturalWidth && !img.parentNode) parent.appendChild(img);
    };
    img.src = url;
    if (img.complete && img.naturalWidth && !img.parentNode) parent.appendChild(img);
  }

  function previewFact(list, label, text, stack) {
    if (!text) return;
    var line = document.createElement("p");
    line.className = stack ? "fact fact-stack" : "fact";
    if (label) {
      var term = document.createElement("span");
      term.className = "fact-label";
      term.textContent = stack ? label : label + ": ";
      line.appendChild(term);
    }
    var value = document.createElement("span");
    value.className = "fact-value";
    value.textContent = text;
    line.appendChild(value);
    list.appendChild(line);
  }

  function clearPreview() {
    if (previewCard) {
      while (previewCard.firstChild) previewCard.removeChild(previewCard.firstChild);
    }
    if (previewNote) previewNote.textContent = PREVIEW_NOTE;
    if (previewBlock) previewBlock.hidden = true;
  }

  function markPreviewStale() {
    if (!previewBlock || previewBlock.hidden || !previewNote) return;
    previewNote.textContent = PREVIEW_STALE;
  }

  function paintPreview(built) {
    if (!previewCard) return;
    var tags = built.tags;
    var pictures = [];
    var paid = false;
    var i;
    for (i = 0; i < tags.length; i++) {
      if (tags[i][0] === "image" && pictures.length < 4) pictures.push(String(tags[i][1]));
      if (tags[i][0] === "pay" && (tags[i][2] === "xbt" || tags[i][2] === "btc")) paid = true;
    }
    while (previewCard.firstChild) previewCard.removeChild(previewCard.firstChild);
    var top = document.createElement("div");
    top.className = "card-top";
    if (pictures.length) previewImage(top, pictures[0], "ad-thumb");
    var heading = document.createElement("div");
    var title = document.createElement("h3");
    title.textContent = previewValue(tags, "title");
    heading.appendChild(title);
    var price = previewTag(tags, "price");
    if (price && (price[2] === "xbt" || price[2] === "btc")) {
      var amount = document.createElement("p");
      amount.className = "price";
      amount.appendChild(document.createTextNode(previewSats(price[1]) + " · " + String(price[2]).toUpperCase()));
      if (typeof AutarkiHint !== "undefined" && spotQuotes) {
        var hint = AutarkiHint.hint(Number(price[1]), price[2], previewValue(tags, "country"), spotQuotes);
        if (hint) {
          amount.appendChild(document.createTextNode(" · "));
          var hintSpan = document.createElement("span");
          hintSpan.className = "price-hint";
          hintSpan.textContent = hint;
          amount.appendChild(hintSpan);
        }
      }
      heading.appendChild(amount);
      if (previewValue(tags, "side") !== "hire" && !paid) {
        var unpaid = document.createElement("p");
        unpaid.className = "price";
        unpaid.textContent = "That listing cannot be paid yet. It has no payment code.";
        heading.appendChild(unpaid);
      }
    }
    var place = [previewValue(tags, "location"), previewValue(tags, "province"), previewValue(tags, "country"), previewValue(tags, "neighbourhood")].filter(Boolean).join(", ");
    if (place) {
      var where = document.createElement("p");
      where.className = "place-line";
      where.textContent = place;
      heading.appendChild(where);
    }
    var summary = previewValue(tags, "summary");
    if (summary) {
      var summaryText = document.createElement("p");
      summaryText.className = "summary";
      summaryText.textContent = summary;
      heading.appendChild(summaryText);
    }
    top.appendChild(heading);
    previewCard.appendChild(top);
    var body = document.createElement("div");
    body.className = "card-body";
    if (built.content) {
      var text = document.createElement("p");
      text.className = "ad-body";
      text.textContent = built.content;
      body.appendChild(text);
    }
    if (pictures.length) {
      var pics = document.createElement("div");
      pics.className = "ad-pictures";
      for (i = 0; i < pictures.length; i++) previewImage(pics, pictures[i], "");
      body.appendChild(pics);
    }
    var facts = document.createElement("div");
    facts.className = "facts";
    previewFact(facts, "Country", previewValue(tags, "country"), false);
    previewFact(facts, "Province", previewValue(tags, "province"), false);
    previewFact(facts, "City", previewValue(tags, "location"), false);
    previewFact(facts, "Neighbourhood", previewValue(tags, "neighbourhood"), false);
    previewFact(facts, "Categories", previewValue(tags, "t"), true);
    var map = previewValue(tags, "map");
    if (map) {
      var mapLine = document.createElement("p");
      mapLine.className = "fact";
      var link = document.createElement("a");
      link.href = map;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Map";
      mapLine.appendChild(link);
      facts.appendChild(mapLine);
    }
    var days = previewValue(tags, "ship_days");
    if (days === "1" || days === "2" || days === "3" || days === "4") {
      previewFact(facts, "Ship by", days === "1" ? "1 day" : days + " days", false);
      previewFact(facts, "Hold", previewValue(tags, "hold") === "overseas" ? "28 days overseas" : "14 days at home", false);
      var origin = [previewValue(tags, "postal"), previewValue(tags, "cc")];
      var kg = previewValue(tags, "kg");
      if (kg) origin.push(kg + " kg");
      previewFact(facts, "Origin", origin.filter(Boolean).join(", "), false);
    }
    previewFact(facts, "Published", previewDay(previewValue(tags, "published_at")), false);
    body.appendChild(facts);
    previewCard.appendChild(body);
  }

  function showPreview() {
    var fields = fieldsFrom("post");
    var typedId = fields.d;
    if (!typedId) fields.d = "preview";
    var built = buildPost(fields);
    if (!built.ok) {
      clearPreview();
      say(built.message);
      return;
    }
    if (built.usedImages && imagesInput) imagesInput.value = built.images.join("\n");
    if (built.usedMap && mapInput) mapInput.value = built.map;
    if (!typedId) dInput.value = "";
    paintPreview(built);
    if (previewNote) previewNote.textContent = PREVIEW_NOTE;
    if (previewBlock) {
      previewBlock.hidden = false;
      var header = document.querySelector(".site-header");
      var gap = header ? header.offsetHeight + 12 : 0;
      var top = previewBlock.getBoundingClientRect().top + window.pageYOffset - gap;
      window.scrollTo(0, top < 0 ? 0 : top);
    }
    say("");
  }

  if (previewButton) {
    previewButton.addEventListener("click", function () {
      if (busy) return;
      showPreview();
    });
  }
  form.addEventListener("input", markPreviewStale);
  form.addEventListener("change", function (event) {
    var target = event && event.target;
    if (target && target.id === "classified-signpost") return;
    markPreviewStale();
  });

  function signpostCacheGet() {
    if (signpostCache) return signpostCache;
    signpostCache = {};
    try {
      var raw = localStorage.getItem(SIGNPOST_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) signpostCache = parsed;
    } catch (e) {}
    return signpostCache;
  }

  function signpostCacheSave() {
    try {
      localStorage.setItem(SIGNPOST_KEY, JSON.stringify(signpostCacheGet()));
    } catch (e) {}
  }

  function signpostRecall(pubkey, ad) {
    if (!/^[0-9a-fA-F]{64}$/.test(String(pubkey || "")) || !ad) return null;
    var bucket = signpostCacheGet()[String(pubkey).toLowerCase()];
    if (!bucket || typeof bucket !== "object" || Array.isArray(bucket)) return null;
    var row = bucket[ad];
    if (!row || typeof row !== "object") return null;
    if (!/^[0-9a-f]{16}$/.test(String(row.d || "")) || row.d === ad) return null;
    var at = Number(row.published_at);
    if (!Number.isSafeInteger(at) || at <= 0) return null;
    return { d: String(row.d), published_at: at, shown: row.shown === true };
  }

  function signpostRemember(pubkey, ad, row) {
    var key = String(pubkey).toLowerCase();
    var cache = signpostCacheGet();
    if (!cache[key] || typeof cache[key] !== "object" || Array.isArray(cache[key])) cache[key] = {};
    cache[key][ad] = { d: row.d, published_at: row.published_at, shown: row.shown === true };
    signpostCacheSave();
  }

  function signpostFind(ad) {
    if (!ad) return null;
    if (signerPubkey) {
      var mine = signpostRecall(signerPubkey, ad);
      return mine ? { pubkey: signerPubkey, row: mine } : null;
    }
    var cache = signpostCacheGet();
    var found = null;
    var pubkey;
    for (pubkey in cache) {
      if (!Object.prototype.hasOwnProperty.call(cache, pubkey)) continue;
      if (!/^[0-9a-fA-F]{64}$/.test(pubkey)) continue;
      var row = signpostRecall(pubkey, ad);
      if (!row) continue;
      if (found) return null;
      found = { pubkey: pubkey.toLowerCase(), row: row };
    }
    return found;
  }

  function signpostFresh(ad) {
    var used = {};
    used[String(ad)] = true;
    var cache = signpostCacheGet();
    var pubkey;
    var id;
    for (pubkey in cache) {
      if (!Object.prototype.hasOwnProperty.call(cache, pubkey)) continue;
      var ads = cache[pubkey];
      if (!ads || typeof ads !== "object") continue;
      for (id in ads) {
        if (!Object.prototype.hasOwnProperty.call(ads, id)) continue;
        used[id] = true;
        if (ads[id] && ads[id].d) used[String(ads[id].d)] = true;
      }
    }
    var n;
    for (n = 0; n < 4; n++) {
      var minted = newId();
      if (!used[minted]) return minted;
    }
    return "";
  }

  function paintSignpostLinks() {
    if (!signpostLinks) return;
    while (signpostLinks.firstChild) signpostLinks.removeChild(signpostLinks.firstChild);
    signpostLinks.hidden = true;
    if (!signpostBoxOn()) return;
    var ad = dInput ? dInput.value.trim() : "";
    var found = signpostFind(ad);
    if (!found || !found.row.shown) return;
    var naddr = naddrFor(found.pubkey, found.row.d);
    if (!naddr) return;
    var pages = [
      ["Shopstr", "https://shopstr.store/listing/" + naddr],
      ["njump", "https://njump.me/" + naddr],
      ["nostr.band", "https://nostr.band/" + naddr],
      ["Coracle", "https://coracle.social/" + naddr]
    ];
    var line = document.createElement("p");
    line.className = "field-note";
    var i;
    for (i = 0; i < pages.length; i++) {
      if (i) line.appendChild(document.createTextNode(" · "));
      var link = document.createElement("a");
      link.href = pages[i][1];
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = pages[i][0];
      line.appendChild(link);
    }
    signpostLinks.appendChild(line);
    signpostLinks.hidden = false;
  }

  function sendRelay(relay, event) {
    return new Promise(function (resolve) {
      var ws;
      var finish = function () {};
      var timer = setTimeout(function () { finish(false); }, 15000);
      try {
        ws = new WebSocket(relay);
      } catch (e) {
        clearTimeout(timer);
        resolve(false);
        return;
      }
      finish = once(ws, function (ok) {
        clearTimeout(timer);
        resolve(ok === true);
      });
      ws.onopen = function () {
        try {
          ws.send(JSON.stringify(["EVENT", event]));
        } catch (err) {
          finish(false);
        }
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
          finish(frame[2] === true);
        }
      };
      ws.onerror = function () { finish(false); };
      ws.onclose = function () { finish(false); };
    });
  }

  function sendSignpost(event) {
    var accepted = 0;
    var chain = Promise.resolve();
    var i;
    for (i = 0; i < SIGNPOST_RELAYS.length; i++) {
      (function (relay) {
        chain = chain.then(function () {
          return sendRelay(relay, event).then(function (ok) {
            if (ok) accepted += 1;
          });
        });
      })(SIGNPOST_RELAYS[i]);
    }
    return chain.then(function () { return accepted; });
  }

  function signSecond(nostr, pubkey, draft) {
    return nostr.signEvent({
      pubkey: pubkey,
      created_at: Math.floor(Date.now() / 1000),
      kind: 30402,
      tags: draft.tags,
      content: draft.content
    }).then(function (signed) {
      if (!signedOk({ content: draft.content, tags: draft.tags }, signed)) throw new Error("sign");
      return sendSignpost(signed);
    });
  }

  function postedLine(d) {
    return "The note is on the relay. Listing id " + d + ". The same key replaces it. A wallet shows it when Classifieds is on and that wallet is unlocked.";
  }

  function showLine(accepted) {
    if (accepted < 1) return SIGNPOST_MISSED;
    if (accepted < SIGNPOST_RELAYS.length) return SIGNPOST_SHOWN + " " + SIGNPOST_MISSED;
    return SIGNPOST_SHOWN;
  }

  function hideLine(accepted) {
    if (accepted === SIGNPOST_RELAYS.length) return SIGNPOST_HIDDEN;
    if (accepted > 0) return SIGNPOST_HIDDEN + " " + SIGNPOST_MISSED;
    return SIGNPOST_MISSED;
  }

  function finishSignpost(nostr, pubkey, built, share) {
    var posted = postedLine(built.d);
    var row = signpostRecall(pubkey, built.d);
    if (share) {
      var signD = row ? row.d : signpostFresh(built.d);
      var publishedAt = row ? row.published_at : Math.floor(Date.now() / 1000);
      if (!signD) {
        say(posted + " That listing cannot be changed that way.");
        return Promise.resolve();
      }
      var draft = signpostDraft(built, signD, publishedAt);
      if (!draft.ok) {
        say(posted + " " + draft.message);
        return Promise.resolve();
      }
      if (!row) signpostRemember(pubkey, built.d, { d: draft.d, published_at: draft.publishedAt, shown: false });
      say("Sending this ad to the other markets.");
      return signSecond(nostr, pubkey, draft).then(function (accepted) {
        if (accepted > 0) signpostRemember(pubkey, built.d, { d: draft.d, published_at: draft.publishedAt, shown: true });
        say(posted + " " + showLine(accepted));
        paintSignpostLinks();
      }).catch(function () {
        say(posted + " The extension did not sign. This page does not ask for a secret key.");
      });
    }
    if (row && row.shown) {
      var cancel = signpostCancel(row.d, row.published_at);
      if (!cancel.ok) {
        say(posted + " " + cancel.message);
        return Promise.resolve();
      }
      say("Telling the other markets to drop this ad.");
      return signSecond(nostr, pubkey, cancel).then(function (accepted) {
        if (accepted === SIGNPOST_RELAYS.length) {
          signpostRemember(pubkey, built.d, { d: row.d, published_at: row.published_at, shown: false });
        }
        say(posted + " " + hideLine(accepted));
        paintSignpostLinks();
      }).catch(function () {
        say(posted + " The extension did not sign. This page does not ask for a secret key.");
      });
    }
    say(posted);
    paintSignpostLinks();
    return Promise.resolve();
  }

  if (signpostInput) signpostInput.addEventListener("change", paintSignpostLinks);
  if (dInput) dInput.addEventListener("input", paintSignpostLinks);

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (busy) return;
    if (!termsAccepted()) {
      say(TERMS_NEED);
      if (termsBlock) termsBlock.hidden = false;
      return;
    }
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
    if (act === "post") {
      if (built.usedImages) imagesInput.value = built.images.join("\n");
      if (built.usedMap) mapInput.value = built.map;
    }
    var nostr = extension();
    if (!nostr) {
      say("A Nostr extension in this browser signs the note. This page does not ask for a secret key.");
      return;
    }
    var share = act === "post" && signpostBoxOn();
    var signer = "";
    lock(true);
    say("Waiting for the extension to sign.");
    Promise.resolve()
      .then(function () { return nostr.getPublicKey(); })
      .then(function (pubkey) {
        if (!/^[0-9a-fA-F]{64}$/.test(String(pubkey || ""))) throw new Error("sign");
        signer = String(pubkey).toLowerCase();
        signerPubkey = signer;
        return askPublishedAt(signer, built.d).then(function (prior) {
          if (prior) {
            for (var i = 0; i < built.tags.length; i++) {
              if (built.tags[i][0] === "published_at") built.tags[i][1] = String(prior);
            }
          }
          var draft = {
            pubkey: signer,
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
        if (act === "sold") {
          say("The note is marked sold. A wallet hides it. Listing id " + built.d + ".");
          return;
        }
        if (act === "canceled") {
          say("The note is marked canceled. A wallet hides it. Listing id " + built.d + ".");
          return;
        }
        return finishSignpost(nostr, signer, built, share);
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
