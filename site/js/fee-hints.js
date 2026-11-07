(function (root) {
  function finite(value) {
    var n = Number(value);
    return isFinite(n) ? n : 0;
  }

  function usable(xbt, btc) {
    return xbt >= 0.5 && xbt <= 20000 && btc >= 1000 && btc <= 10000000;
  }

  function dollars(sats, usd) {
    return (Number(sats) / 100000000) * usd;
  }

  function grouped(whole) {
    var text = String(Math.round(whole));
    var out = "";
    var i;
    for (i = 0; i < text.length; i++) {
      if (i > 0 && (text.length - i) % 3 === 0) out += ",";
      out += text.charAt(i);
    }
    return out;
  }

  function money(amount) {
    if (!(amount > 0) || !isFinite(amount)) return "";
    if (amount >= 10) return "$" + grouped(amount);
    if (amount >= 0.01) return "$" + amount.toFixed(2);
    return "$" + amount.toFixed(4);
  }

  function render(xbt, btc) {
    var routeXbt = dollars(1000, xbt);
    var roomXbt = dollars(1200, xbt);
    var bigXbt = dollars(2000, xbt);
    var routeBtc = dollars(1000, btc);
    var roomBtc = dollars(1200, btc);
    var bigBtc = dollars(2000, btc);
    var xbtAmounts = [routeXbt, roomXbt, bigXbt];
    var under = true;
    var largest = 0;
    var i;
    for (i = 0; i < xbtAmounts.length; i++) {
      if (xbtAmounts[i] >= 0.01) under = false;
      if (xbtAmounts[i] > largest) largest = xbtAmounts[i];
    }
    var xbtLine = under
      ? "On XBT those three fees are each under one cent."
      : "On XBT the largest of those three fees is about " + money(largest) + ".";
    var btcLine = routeBtc >= 1
      ? "On BTC the routing cap is about " + money(routeBtc) + "."
      : "On BTC the routing cap is about " + Math.round(routeBtc * 100) + (Math.round(routeBtc * 100) === 1 ? " cent." : " cents.");
    var compare = "and the BTC cap is about the same.";
    if (routeBtc > 0.45) compare = "and the BTC cap can cost more.";
    else if (routeBtc < 0.45) compare = "and the BTC cap can cost less.";
    return {
      lede: "Sats are the price. One XBT sat and one BTC sat are not the same dollar. These hints follow the NeoEX USDC quote: about " + money(xbt) + " for one XBT, and about " + money(btc) + " for one BTC. They move. A dollar hint does not change the sats.",
      cells: {
        "1000-xbt": "About " + money(routeXbt),
        "1000-btc": "About " + money(routeBtc),
        "1200-xbt": "About " + money(roomXbt),
        "1200-btc": "About " + money(roomBtc),
        "2000-xbt": "About " + money(bigXbt),
        "2000-btc": "About " + money(bigBtc)
      },
      scale: xbtLine + " " + btcLine,
      capacity: "20,000 sats of inbound capacity is about " + money(dollars(20000, xbt)) + " of XBT, or about " + money(dollars(20000, btc)) + " of BTC. 100,000 sats is about " + money(dollars(100000, xbt)) + " of XBT, or about " + money(dollars(100000, btc)) + " of BTC. That figure is the capacity.",
      card: "Autarki does not charge the card and does not take that percent. On a $100 BTC sale the routing cap is about " + money(routeBtc) + ". On a sale near $5, the online card fee is about $0.45, " + compare
    };
  }

  var api = { usable: usable, money: money, dollars: dollars, render: render, finite: finite };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (!root || !root.document) return;

  function apply(xbt, btc) {
    xbt = finite(xbt);
    btc = finite(btc);
    if (!usable(xbt, btc)) return;
    var view = render(xbt, btc);
    var lede = root.document.getElementById("fee-spot");
    var scale = root.document.getElementById("fee-scale");
    var capacity = root.document.getElementById("fee-capacity");
    var card = root.document.getElementById("fee-card");
    var cells = root.document.querySelectorAll("[data-fee]");
    var i;
    if (lede) lede.textContent = view.lede;
    if (scale) scale.textContent = view.scale;
    if (capacity) capacity.textContent = view.capacity;
    if (card) card.textContent = view.card;
    for (i = 0; i < cells.length; i++) {
      var key = cells[i].getAttribute("data-fee");
      if (view.cells[key]) cells[i].textContent = view.cells[key];
    }
  }

  var spot = root.document.getElementById("fee-spot");
  if (spot) apply(spot.getAttribute("data-xbt"), spot.getAttribute("data-btc"));

  if (!root.fetch) return;
  root.fetch("/api/spot", { headers: { accept: "application/json" } })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (body) {
      if (!body || body.ok !== true) return;
      apply(body.xbt_usd, body.btc_usd);
    })
    .catch(function () {});
})(typeof window !== "undefined" ? window : this);
