(function (root) {
  function decimal(value) {
    var raw = typeof value === "number" ? String(value) : String(value == null ? "" : value).trim();
    if (!/^[0-9]+(\.[0-9]+)?$/.test(raw)) return null;
    if (/^0+(\.0+)?$/.test(raw)) return null;
    var dot = raw.indexOf(".");
    var scale = dot === -1 ? 0 : raw.length - dot - 1;
    var digits = raw.replace(".", "").replace(/^0+/, "");
    if (!digits) return null;
    return { digits: digits, scale: scale };
  }

  function divRound(num, den) {
    var q = num / den;
    var r = num % den;
    if (r * 2n >= den) q += 1n;
    return q;
  }

  function grouped(whole) {
    var text = whole.toString();
    var out = "";
    var i;
    for (i = 0; i < text.length; i++) {
      if (i > 0 && (text.length - i) % 3 === 0) out += ",";
      out += text.charAt(i);
    }
    return out;
  }

  function codeFor(country) {
    var text = String(country || "").trim().toLowerCase();
    if (text === "canada" || text === "ca") return "CAD";
    return "USD";
  }

  function usable(coin, value) {
    var n = Number(value);
    if (!isFinite(n)) return false;
    if (coin === "btc") return n >= 1000 && n <= 10000000;
    return n >= 0.5 && n <= 20000;
  }

  function usableCad(value) {
    var n = Number(value);
    return isFinite(n) && n >= 0.5 && n <= 2.5;
  }

  function hint(sats, coin, country, quotes) {
    if (typeof BigInt !== "function" || !quotes) return "";
    var n = Number(sats);
    var market = String(coin || "").toLowerCase();
    if (!Number.isSafeInteger(n) || n <= 0) return "";
    if (market !== "xbt" && market !== "btc") return "";
    var price = market === "btc" ? quotes.btc_usd : quotes.xbt_usd;
    var parts = usable(market, price) ? decimal(price) : null;
    if (!parts) return "";
    var atoms = divRound(BigInt(n) * BigInt(parts.digits), 10n ** BigInt(parts.scale));
    var code = codeFor(country);
    if (code === "CAD") {
      var cad = usableCad(quotes.usd_cad) ? decimal(quotes.usd_cad) : null;
      if (!cad) code = "USD";
      else atoms = divRound(atoms * BigInt(cad.digits), 10n ** BigInt(cad.scale));
    }
    var cents = divRound(atoms, 1000000n);
    var amount;
    if (cents >= 1n) {
      var frac = (cents % 100n).toString();
      if (frac.length < 2) frac = "0" + frac;
      amount = grouped(cents / 100n) + "." + frac;
    } else {
      var four = divRound(atoms, 10000n);
      if (four < 1n) return "";
      var tiny = four.toString();
      while (tiny.length < 4) tiny = "0" + tiny;
      amount = "0." + tiny;
    }
    return "Approx: $" + amount + " " + code;
  }

  var api = { codeFor: codeFor, hint: hint };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.AutarkiHint = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
