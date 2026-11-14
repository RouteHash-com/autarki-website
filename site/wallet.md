# Wallet

> You hold the 24 words. On a package that starts Lightning, paying the other coin spends the coin this wallet already holds. The fee is 1.5%, plus the normal network fees.

The page is [https://autarki.app/wallet](https://autarki.app/wallet).

## You hold the 24 words

Autarki is your wallet and your shop. You hold the 24 words. You pay the person. Autarki does not hold the coins, clear the sale, or take a cut of the catalog price. Lightning still costs: routing at most 1,000 sats, and room of 1,200 sats for 20,000 or 2,000 sats for 100,000.

There is no account that can reset the 24 words. The same install is the shop and the customer.

- 24 English words, shown once. They restore the funds on another machine.
- They do not restore the shop book, the orders, the catalog, or a Lightning channel.
- Save a copy before you replace the computer or wipe the app data. Bring a copy back, then publish. That file is under Settings, then Other, then Backup. The [privacy page](https://autarki.app/privacy.md) names the classifieds node.
- A password is optional. It is not part of the 24 words.

## XBT and BTC

Pay with XBT or Pay with BTC. Pay with XBT still spends XBT. Pay with BTC still spends BTC. XBT is named first.

- Blake2b XBT. Buttons say XBT or Pay with XBT. The node is Bitcoin Knots. Lightning is Blake2b Lightning.
- SHA-256 BTC. Buttons say BTC or Pay with BTC. The node is Bitcoin Core. Lightning is SHA-256 Lightning.
- XBT and SHA-256 BTC share history only up to the fork. A payment is signed for one chain. On-chain, coins from the wrong chain do not pay the sale.
- A price in sats is whole sats. A dollar figure beside it, in US dollars or Canadian dollars, can say About. That hint does not change the sats. One product, or one classified, can keep its price in those dollars. The dollar price stays and the coin amount is set when you pay.
- XBT Knots and Bitcoin Core do not run on the same computer.

## Receive, Send, and Balance

- Whole sats. Prepare builds it. Sign is separate. Broadcast is separate.
- The browser never receives the signed transaction.
- No confirmation: not spendable. An ordinary coin spends after one.
- A mining reward waits longer. On XBT the wait depends on the block. On BTC it is 100 confirmations.
- Balance is confirmed coins still held. Lightning is a separate jar, not added to Balance.

## Lightning

- Lightning for XBT and for BTC is in the AMD and Intel StartOS package, the Ubuntu image, the Umbrel amd64 image file, and Android 0.1.0 (29). You do not install a second Lightning app.
- The Umbrel community store (listing 0.1.24), Raspberry Pi, and Umbrel arm64 leave the Lightning programs out, so Lightning stays off there. On-chain still works on those packages.
- Use other Autarki Lightning nodes is under Settings, then Coin Nodes. Leave it off where Lightning programs start. The Umbrel community store, an iPhone, a Raspberry Pi, and Umbrel arm64 keep it on, for another Autarki that stays running.
- A shipment runs where Lightning starts. Mine needs AMD or Intel. It stays off on a Raspberry Pi and on Umbrel arm64.
- There is no second Lightning app. Install does not open a channel.
- On-chain needs no channel. A Lightning payment spends sats already locked in a channel between two nodes.
- Until your own coin node is connected, Autarki's servers can see a normal address. They do not make a silent-payment code.

## Paying the other coin

On a package that starts Lightning, a Lightning invoice in the other coin spends the coin this wallet already holds. Pay with XBT still spends XBT. Pay with BTC still spends BTC. The shop is paid in the coin it asked for. The fee is 1.5%, plus the normal network fees. Routing through the LSP is at most 1,000 sats. The amount on the confirm screen already includes the fee. Nothing is sent until a channel from this wallet can pay. If that payment cannot finish, it is not sent. The button says Pay with the other coin.

Each install asks for its own code. There is nothing to paste. This is not a screen that turns the coins already in the wallet into the other coin.

Lightning for this is in the AMD and Intel StartOS package, the Ubuntu image, the Umbrel amd64 image file, and Android. The Umbrel community store, Raspberry Pi, Umbrel arm64, and the iPhone build do not start Lightning, so they do not pay across coins.

### A shop that asks for Bitcoin

Mara holds XBT. Jon's shop asks for Bitcoin Lightning. Mara pays that invoice from the XBT she already holds. Jon is paid in Bitcoin Lightning. The XBT leave Mara's wallet. She confirms the amount first. If a channel from her wallet cannot pay it, nothing is sent and Jon is not paid.

### A shop that asks for XBT

The same path runs the other way. Jon holds BTC. Mara's shop asks for XBT Lightning. Jon pays from the BTC he already holds. Mara is paid in XBT Lightning. His BTC are what leave his wallet. Nothing is sent until a channel from his wallet can pay.

The coins arrive on Lightning. They are not added to Balance. Balance stays the confirmed on-chain coins.

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
- A mining payment does not use the LSP. Install does not open a channel. The Umbrel community store, a Raspberry Pi, Umbrel arm64, and the iPhone build leave Lightning off.
- Sitting at your computer, Use Autarki's pool does the same open. The [channel page](https://autarki.app/channel) is the extra door for a node that is not the page in front of you. Fill Send does not open a channel.

## Fees, with a dollar hint

Sats are the price. One XBT sat and one BTC sat are not the same dollar. The wallet page reads the current NeoEX USDC quote and replaces these hints. A dollar hint does not change the sats. This file keeps the quote from the last publish: about $280 for one XBT, and about $75,000 for one BTC.

- Routing through the LSP, at most 1,000 sats: about $0.0028 on XBT, about $0.75 on BTC.
- Inbound room of 20,000 sats costs 1,200 sats: about $0.0034 on XBT, about $0.90 on BTC. That room is about $0.06 of XBT, or about $15 of BTC. The figure is the capacity.
- Inbound room of 100,000 sats costs 2,000 sats: about $0.0056 on XBT, about $1.50 on BTC. That room is about $0.28 of XBT, or about $75 of BTC.

## A $100 sale

Take one order of $100. Online, 2.9% of $100 is $2.90. Add $0.30 and the card fee is $3.20. In person, 2.6% of $100 is $2.60. Add $0.15 and the card fee is $2.75. Routing is charged on this sale. Room is paid once.

| Fee | XBT | BTC | Card |
| --- | --- | --- | --- |
| Routing on this sale | At most 1,000 sats. About $0.0028. | At most 1,000 sats. About $0.75. | $3.20 online. $2.75 in person. |
| Room of 20,000 sats, once | 1,200 sats. About $0.0034. | 1,200 sats. About $0.90. | No room fee. |
| Room of 100,000 sats, once | 2,000 sats. About $0.0056. | 2,000 sats. About $1.50. | No room fee. |

- On this $100 sale, the three XBT fees are each under one cent. On BTC the routing cap is about 75 cents.
- Autarki does not charge the card and does not take that percent. Lightning still costs: routing at most 1,000 sats, and room of 1,200 sats for 20,000 or 2,000 sats for 100,000. On a sale near $5, the online card fee is about $0.45. The BTC routing cap is about $0.75. That cap can cost more than the card fee.
- Room is paid once. Opening a channel also pays a miner fee. That amount is whatever the chain asks that day.
- A node publishes a fee to forward toward each peer, and each peer publishes a fee to forward back. Those are the fees in both directions. The routing cap is what you pay through the LSP. Inbound capacity is the room a shop buys.

## Install

It runs on your computer. A 64-bit Android phone can install its own copy. A phone on the same network can still open your computer's page. See [Install](https://autarki.app/install.md).
