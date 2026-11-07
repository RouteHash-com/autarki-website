# Wallet

> One install is one wallet. You hold the 24 words. Pay with XBT or Pay with BTC. Lightning is built in on AMD and Intel.

The page is [https://autarki.app/wallet](https://autarki.app/wallet).

## You hold the 24 words

Autarki does not hold them, and there is no account that can reset them. The same install is the shop and the customer.

- 24 English words, shown once. They restore the funds on another machine.
- They do not restore the shop book, the orders, the catalog, or a Lightning channel.
- A password is optional. It is not part of the 24 words.

## XBT and BTC

Pay with XBT or Pay with BTC. You choose the coin, and the payment stays in that coin. XBT is named first.

- Blake2b XBT. Buttons say XBT or Pay with XBT. The node is Bitcoin Knots. Lightning is Blake2b Lightning.
- SHA-256 BTC. Buttons say BTC or Pay with BTC. The node is Bitcoin Core. Lightning is SHA-256 Lightning.
- XBT and SHA-256 BTC share history only up to the fork. A payment is signed for one chain. Coins from the wrong chain do not pay the sale.
- Prices are whole sats. A dollar hint, in US dollars or Canadian dollars, does not change the sats.
- XBT Knots and Bitcoin Core do not run on the same computer.

## Receive, Send, and Balance

- Whole sats. Prepare builds it. Sign is separate. Broadcast is separate.
- The browser never receives the signed transaction.
- No confirmation: not spendable. An ordinary coin spends after one.
- A mining reward waits longer. On XBT the wait depends on the block. On BTC it is 100 confirmations.
- Balance is confirmed coins still held. Lightning is a separate jar, not added to Balance.

## Lightning, on AMD and Intel

- AMD or Intel StartOS, Umbrel, and Ubuntu start Blake2b Lightning and SHA-256 Lightning.
- A Raspberry Pi and Umbrel arm64 start the wallet and the shop. Lightning stays off.
- A Lightning payment, a shipment, and Mine need AMD or Intel.
- There is no second Lightning app. Install does not open a channel.
- On-chain needs no channel. Routing at most 1,000 sats. Room is 1,200 sats for 20,000, or 2,000 sats for 100,000.
- The pool does not hold the sale and does not take a cut of the catalog price.
- Until your own coin node is connected, Autarki's servers can see a normal address. They do not make a silent-payment code.

## Install

It runs on your computer. A phone on the same network opens that page. There is no separate phone app. See [Install](https://autarki.app/install.md).
