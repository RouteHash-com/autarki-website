# Wallet

> You hold the 24 words. Lightning is built in on AMD and Intel. The Autarki LSP is one channel that can pay later shops.

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
- On-chain needs no channel. A Lightning payment spends sats already locked in a channel between two nodes.
- Until your own coin node is connected, Autarki's servers can see a normal address. They do not make a silent-payment code.

## Why a Lightning channel is necessary

On-chain is the bank. Each payment waits for a confirmation and pays a miner fee. Savings stay on-chain.

Capacity is the sats locked in the channel. Outbound capacity is what your node can send. Those coins sit on your side. Inbound capacity is what your node can receive. Those coins sit on the other node's side. You can pay only up to your outbound capacity. A shop can receive only up to its inbound capacity. A channel you just funded has almost no inbound capacity, so a customer cannot pay you on it yet.

## The Autarki LSP

The Autarki LSP is a Lightning node you open one channel to. In the wallet that button says Use Autarki's pool. There is one LSP for Blake2b Lightning, on XBT, and one for SHA-256 Lightning, on BTC.

- One channel can pay this shop, or this seller, and later shops that already have inbound capacity with the LSP.
- Your own channel has no LSP fee and pays only that one node. The wallet already knows the node. You never type the shop's public key.
- The first open waits about ten minutes and pays a miner fee, either way. Nothing opens until you confirm.
- If the Autarki LSP cannot be reached, the page offers the direct channel. Nothing was sent.
- Inbound room is 1,200 sats for 20,000 sats of capacity, or 2,000 sats for 100,000. The buttons say Pay 1,200 sats for Blake2b pool room and Pay 1,200 sats for Bitcoin pool room. Prepare, then Broadcast. The page does not open the room.
- The seller's node has to be on. It does not need its own confirmed sats. Zero inbound capacity does not block a buyer who will open a channel.
- The LSP does not hold the sale and does not take a cut of the catalog price. Lightning still costs: routing at most 1,000 sats, and room of 1,200 sats for 20,000 or 2,000 sats for 100,000. A buyer still needs a channel.
- A mining payment does not use the LSP. Install does not open a channel. A Raspberry Pi and Umbrel arm64 leave Lightning off.

## Fees, with a dollar hint

Sats are the price. Hints on 7 November 2026 use about $276 for one XBT, from a USDC quote, and about $75,800 for one BTC. They move. A dollar hint does not change the sats.

- Routing through the LSP, at most 1,000 sats: about $0.003 on XBT, about $0.76 on BTC.
- Inbound room of 20,000 sats costs 1,200 sats: about $0.003 on XBT, about $0.91 on BTC. That room is about $0.06 of XBT, or about $15 of BTC. The figure is the capacity.
- Inbound room of 100,000 sats costs 2,000 sats: about $0.006 on XBT, about $1.52 on BTC. That room is about $0.28 of XBT, or about $76 of BTC.
- A card takes a percent of every sale. A common online rate is 2.9% plus $0.30, about $3.20 on a $100 sale. In person, 2.6% plus $0.15 is about $2.75 on $100.
- Autarki does not charge the card and does not take that percent. On a $100 BTC sale the routing cap is about $0.76. On a sale near $5, the online card fee is about $0.45, and the BTC cap can cost more.
- Room is paid once. Opening a channel also pays a miner fee. That amount is whatever the chain asks that day.
- A node publishes a fee to forward toward each peer, and each peer publishes a fee to forward back. Those are the fees in both directions. The routing cap is what you pay through the LSP. Inbound capacity is the room a shop buys.

## Install

It runs on your computer. A 64-bit Android phone can install its own copy. A phone on the same network can still open your computer's page. See [Install](https://autarki.app/install.md).
