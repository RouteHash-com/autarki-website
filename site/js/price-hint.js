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

  function positiveInt(value) {
    if (typeof value === "number") {
      if (!Number.isSafeInteger(value) || value <= 0) return 0;
      return value;
    }
    var text = String(value == null ? "" : value).trim();
    if (!text || text.charAt(0) === "+" || !/^[0-9]+$/.test(text)) return 0;
    var n = Number(text);
    if (!Number.isSafeInteger(n) || n <= 0) return 0;
    return n;
  }

  function hasOwn(body, key) {
    return !!body && Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined;
  }

  function centsOf(text) {
    var raw = String(text == null ? "" : text).trim();
    if (!/^\d+(\.\d{0,2})?$/.test(raw) && !/^\.\d{1,2}$/.test(raw)) return null;
    var parts = raw.split(".");
    var whole = parts[0] === "" ? "0" : parts[0].replace(/^0+/, "");
    if (!whole) whole = "0";
    var frac = parts.length === 2 ? parts[1] : "";
    while (frac.length < 2) frac += "0";
    var digits = (whole + frac).replace(/^0+/, "");
    if (!digits || digits.length > 15) return null;
    var cents = Number(digits);
    if (!Number.isSafeInteger(cents) || cents < 1) return null;
    return cents;
  }

  function locked(cents, currency) {
    var n = positiveInt(cents);
    var code = String(currency || "").trim().toLowerCase();
    if (!n || (code !== "usd" && code !== "cad")) return "";
    var frac = n % 100;
    var fracText = frac < 10 ? "0" + frac : String(frac);
    return "$" + grouped(Math.floor(n / 100)) + "." + fracText + " " + (code === "cad" ? "CAD" : "USD");
  }

  function shownDollars(cents, currency, sats, coin) {
    var primary = locked(cents, currency);
    if (!primary) return null;
    var n = positiveInt(sats);
    var market = String(coin || "").toLowerCase();
    var note = "The dollar price stays and the coin amount is set when you pay.";
    if (n && (market === "xbt" || market === "btc")) note = grouped(n) + " sats · " + market.toUpperCase();
    return { primary: primary, note: note };
  }

  function productMoney(body) {
    if (!body) return null;
    var currency = String(body.currency || "").trim().toLowerCase();
    var priceSet = hasOwn(body, "price");
    var centsSet = hasOwn(body, "cents");
    if (priceSet && centsSet) return null;
    if (currency === "sats") {
      if (centsSet) return null;
      var sats = positiveInt(body.price);
      if (!sats) return null;
      return { kind: "sats", sats: sats };
    }
    if (currency !== "usd" && currency !== "cad") return null;
    if (priceSet) return null;
    var cents = positiveInt(body.cents);
    if (!cents) return null;
    return { kind: "dollars", cents: cents, currency: currency, sats: 0, coin: "" };
  }

  function firstTag(tags, name) {
    var i;
    if (!tags) return null;
    for (i = 0; i < tags.length; i++) {
      if (tags[i] && tags[i][0] === name) return tags[i];
    }
    return null;
  }

  function listingMoney(tags) {
    var price = firstTag(tags, "price");
    var centsTag = firstTag(tags, "cents");
    var hintTag = firstTag(tags, "hint");
    var sats = 0;
    var coin = "";
    var text = "";
    var payable = false;
    var cents = 0;
    var currency = "";
    var hinted = 0;
    if (price && price.length >= 2) {
      sats = positiveInt(price[1]);
      coin = price[2] === "xbt" || price[2] === "btc" ? price[2] : "";
      if (price.length === 3 && sats && coin) payable = true;
      else {
        sats = 0;
        coin = "";
        text = price.slice(1).join(" ").trim();
      }
    }
    if (centsTag && centsTag.length === 3) {
      cents = positiveInt(centsTag[1]);
      currency = String(centsTag[2] || "").trim().toLowerCase();
      if (currency !== "usd" && currency !== "cad") cents = 0;
    }
    if (hintTag && hintTag.length === 2) hinted = positiveInt(hintTag[1]);
    if (cents) {
      if (!(payable && hinted === 0)) {
        if (payable && hinted > 0 && coin) {
          return { kind: "dollars", cents: cents, currency: currency, sats: sats, coin: coin };
        }
        return { kind: "dollars", cents: cents, currency: currency, sats: 0, coin: "" };
      }
    }
    if (payable) return { kind: "sats", sats: sats, coin: coin };
    if (text) return { kind: "text", text: text };
    return { kind: "none" };
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

  var api = {
    codeFor: codeFor,
    hint: hint,
    centsOf: centsOf,
    locked: locked,
    shownDollars: shownDollars,
    productMoney: productMoney,
    listingMoney: listingMoney
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.AutarkiHint = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
