(function () {
  function commas(value) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function roomFee(text) {
    var digits = String(text || "").replace(/[, ]/g, "");
    if (!/^[0-9]+$/.test(digits)) return null;
    var room = Number(digits);
    if (!isFinite(room) || room < 20000 || room > 1000000 || room % 100 !== 0) return null;
    return { room: room, fee: 1000 + room / 100 };
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

  function localPaste(text) {
    return /127\.0\.0\.1|localhost|<your public ip>|192\.168\.|10\.\d|172\.(1[6-9]|2\d|3[0-1])\./i.test(text);
  }

  function nameVerdict(text) {
    var raw = String(text || "").trim();
    if (!raw) return { kind: "empty" };
    var name = publicName(raw);
    if (name) return { kind: "ok", name: name };
    if (loginPaste(raw)) return { kind: "login" };
    if (localPaste(raw)) return { kind: "local" };
    return { kind: "shape" };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { roomFee: roomFee, nameVerdict: nameVerdict };
  }
  if (typeof document === "undefined") return;
  var form = document.getElementById("channel-check");
  if (!form) return;
  var status = form.querySelector(".request-status");
  var roomInput = document.getElementById("channel-room");
  var nameInput = document.getElementById("channel-name");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var priced = roomFee(roomInput.value);
    var chainInput = form.querySelector("input[name=chain]:checked");
    var chain = chainInput && chainInput.value === "btc" ? "SHA-256 BTC" : "Blake2b XBT";
    var verdict = nameVerdict(nameInput.value);
    if (!priced) {
      status.textContent = "Room stays between 20,000 and 1,000,000 sats, in steps of 100.";
      return;
    }
    if (verdict.kind === "empty" || verdict.kind === "shape") {
      status.textContent = "Paste the public name. It is the one line with @ in it, from Show this node's public name.";
      return;
    }
    if (verdict.kind === "login") {
      status.textContent = "That is a login, not a public name. The lndconnect link, the API address, and the API password do not open a channel. Paste only the line with @ in it.";
      return;
    }
    if (verdict.kind === "local") {
      status.textContent = "That host is not the public name. 127.0.0.1 and <your public IP> from the logins are not it.";
      return;
    }
    status.textContent = "Incoming room of " + commas(priced.room) + " sats on " + chain + " costs " + commas(priced.fee) + " sats. That line is a public name. This page does not open the channel and does not keep the name. The pool opens toward it after a payment is tied to that name. A fee by itself does not name the node.";
  });
})();
