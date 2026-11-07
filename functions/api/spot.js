// XBT is the NeoEX BTCB2 quote. BTC is the NeoEX BTC quote.
// NEOX is a different coin, far below one dollar, and is not used here.
// A browser on autarki.app cannot read NeoEX itself: a request that carries
// that Origin gets HTTP 500. This function fetches with no Origin.

var UPSTREAM = "https://neoxa.exchange/api/prices";

function finite(value) {
  var n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function quotesFromPayload(payload) {
  var prices = payload && payload.prices;
  if (!prices || typeof prices !== "object") return null;
  var xbt = finite(prices.BTCB2);
  var btc = finite(prices.BTC);
  if (xbt < 0.5 || xbt > 20000) return null;
  if (btc < 1000 || btc > 10000000) return null;
  return { xbt_usd: xbt, btc_usd: btc };
}

function json(body, status, cache) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cache,
      "x-content-type-options": "nosniff"
    }
  });
}

export async function onRequestGet() {
  var cacheKey = new Request("https://autarki.app/api/spot");
  if (typeof caches !== "undefined" && caches.default) {
    try {
      var hit = await caches.default.match(cacheKey);
      if (hit) return hit;
    } catch (e) {}
  }

  var payload;
  try {
    var response = await fetch(UPSTREAM, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      cf: { cacheTtl: 0 }
    });
    if (!response.ok) return json({ ok: false }, 502, "no-store");
    payload = await response.json();
  } catch (e) {
    return json({ ok: false }, 502, "no-store");
  }

  var quotes = quotesFromPayload(payload);
  if (!quotes) return json({ ok: false }, 502, "no-store");
  var out = json({
    ok: true,
    xbt_usd: quotes.xbt_usd,
    btc_usd: quotes.btc_usd
  }, 200, "public, max-age=60");
  if (typeof caches !== "undefined" && caches.default) {
    try {
      await caches.default.put(cacheKey, out.clone());
    } catch (e) {}
  }
  return out;
}

export { quotesFromPayload };
