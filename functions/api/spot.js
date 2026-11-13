// XBT is the NeoEX BTCB2 quote. BTC is the NeoEX BTC quote.
// NEOX is a different coin, far below one dollar, and is not used here.
// A browser on autarki.app cannot read NeoEX itself: a request that carries
// that Origin gets HTTP 500. This function fetches with no Origin.

var UPSTREAM = "https://neoxa.exchange/api/prices";
// Canadian dollars for one US dollar. Bank of Canada, no key.
// The request sends no amount, address, or order.
var CAD_URL = "https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?recent=1";

function finite(value) {
  var n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function cadFromPayload(payload) {
  var observations = payload && payload.observations;
  if (!Array.isArray(observations) || !observations.length) return 0;
  var last = observations[observations.length - 1];
  var row = last && last.FXUSDCAD;
  var n = finite(row && row.v);
  if (n < 0.5 || n > 2.5) return 0;
  return n;
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

  var payload = null;
  var cadPayload = null;
  try {
    var pair = await Promise.all([
      readJson(UPSTREAM),
      readJson(CAD_URL).catch(function () { return null; })
    ]);
    payload = pair[0];
    cadPayload = pair[1];
  } catch (e) {
    return json({ ok: false }, 502, "no-store");
  }

  var quotes = quotesFromPayload(payload);
  if (!quotes) return json({ ok: false }, 502, "no-store");
  var body = {
    ok: true,
    xbt_usd: quotes.xbt_usd,
    btc_usd: quotes.btc_usd
  };
  var cad = cadFromPayload(cadPayload);
  if (cad) body.usd_cad = cad;
  var out = json(body, 200, "public, max-age=60");
  if (typeof caches !== "undefined" && caches.default) {
    try {
      await caches.default.put(cacheKey, out.clone());
    } catch (e) {}
  }
  return out;
}

async function readJson(url) {
  var response = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000),
    cf: { cacheTtl: 0 }
  });
  if (!response.ok) return null;
  return response.json();
}

export { quotesFromPayload, cadFromPayload };
