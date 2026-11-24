# Lightning

> Your node holds the coins. A channel pays the shop. A shipment stays on the seller's node until it is marked received.

The page is [https://autarki.app/lightning](https://autarki.app/lightning).

## Lightning on Autarki

Your node holds the coins. A counter sale and a pickup pay the shop. A shipment stays on the seller's node until the parcel is marked received, the hold ends, or the coins come back.

## Three facts

- Lightning for Blake2b XBT and for SHA-256 BTC comes with the wallet. Pay with the coin you hold. Pay with XBT still spends XBT. Pay with BTC still spends BTC.
- About 1 percent of the channel stays reserved. What you can send is what is on your side, minus that reserve. Fund a little more than the payment.
- A shipment pays with Lightning. The coins sit on the seller's node. Autarki cannot move them. Public pool does not hold the sale.

## Two ways to connect

A 100,000 sat price, worked the way the wallet works it. Nothing on this page is sent.

### Use Seller Channel

A shop shows Use Shop Channel. A classified shows Use Seller Channel. The buyer opens one channel to that shop or that seller. The seller does not pay a room fee. The buyer's leftover can pay this shop or this seller again. It does not pay a later shop.

1. The seller publishes the Lightning node and keeps that node on. The seller does not put sats into a channel for this sale.
2. The buyer sends 122,000 sats on-chain into their own Lightning wallet. 120,000 open the channel. 2,000 stay in that wallet for the miner fee of the open. What the miner does not take stays there. Moving the sats from the on-chain wallet pays that wallet's own miner fee.
3. The buyer opens a channel of 120,000 sats. Nothing is pushed to the other side. After one confirmation, the buyer pays the 100,000 sat request. A direct channel does not pay Public pool's routing fee.
4. The seller then has 100,000 sats on their side. The buyer keeps 20,000 sats on their side. About 18,800 of that can be sent. The rest is the 1 percent reserve.

### Use Public pool

Use this when buyers already have a channel to Public pool, or when the seller wants that room. The seller pays the room fee only. Public pool puts its own sats into the channel.

1. A room of 100,000 sats can forward 98,800 sats after the 1 percent reserve. To receive a 100,000 sat payment, the wallet asks for 101,300 sats of incoming room. The smallest room is 20,000 sats, in steps of 100.
2. The seller pays 2,013 sats. That is 1,000 sats plus 1 percent of the 101,300 sat room, plus the miner fee on that on-chain payment. The node charges the 2,013. Autarki does not collect it. Public pool puts 121,300 sats into the channel and pushes 20,000 to the seller. After the reserve, 100,087 sats can be forwarded. Incoming room is ready after that open confirms. Paying the fee fills Send. This page does not open the room.
3. A buyer who already has a funded channel to Public pool can pay then. A buyer who does not opens the same 120,000 sat channel toward Public pool. That Lightning wallet still needs 122,000 sats before the open. The payment is 100,000 sats, plus a routing fee of at most 1,000 sats. The node charges that fee. Autarki does not collect it.

| A 100,000 sat price | Use Seller Channel | Use Public pool |
| --- | --- | --- |
| Seller puts into a channel | 0 sats | 0 sats. Public pool puts 121,300 sats into the channel. |
| Seller pays up front | 0 sats | 2,013 sats, plus the miner fee on that payment |
| Buyer puts into the channel | 120,000 sats, toward the seller | 120,000 sats, toward Public pool, unless a channel is already open |
| Left in the buyer's Lightning wallet | 2,000 sats for the open. What the miner does not take stays there. | 2,000 sats for the open. What the miner does not take stays there. |
| Routing fee | 0 sats | At most 1,000 sats |
| What the buyer can still send | About 18,800 sats, at this shop or this seller | About 18,800 sats after the 100,000 sat payment, at shops that already have room with Public pool. A routing fee comes out of that same channel. |

- A named room still has the posted price. 20,000 sats of room costs 1,200. 100,000 costs 2,000. 1,000,000 costs 11,000. The price is 1,000 sats plus 1 percent of the room. The node charges it. Autarki does not collect it.
- The first opening waits about ten minutes for one confirmation. A later payment on that channel does not wait.
- A channel you fund starts with You can receive at 0. The seller gets room when Public pool opens toward them after the room fee, or when someone opens a direct channel.
- Balance can open the channel. The button is Open a channel to Public pool. It asks for at least 20,000 sats on your side and leaves 2,000 sats in the Lightning wallet for the miner fee. The other side starts at 0.

## Paying the other coin

Paying the coin the listing asks for does not add this fee. Pay with XBT still spends XBT. Pay with BTC still spends BTC.

A Lightning invoice in the other coin spends the coin this wallet already holds. The button is Pay with the other coin. It is there when that side can pay. The person you pay is paid in the coin they asked for.

The node that carries the payment charges 1.5%, plus the normal network fees. Autarki does not collect that fee. One XBT sat is not one BTC sat. Read the amount and the fee on the line under the button before you continue. A routing fee is separate and is at most 1,000 sats. The node charges that too.

## Counter, pickup, and a shipment

A counter sale and a pickup pay the shop node. A shipment waits. Without a float, the shipment is not held.

### Counter sale or pickup

Pays the shop node. No hold. A shop sale does not name a referee. A store stall does not name one.

### Shipment, shop or classified

The seller's node accepts the Lightning hold. The coins sit on that node. Autarki cannot move them. The preimage stays on the seller's computer in `secrets/holds`. It is not in the order book. Keep a copy of that file as private as the wallet.

Domestic is 14 days, about 2,016 blocks. Overseas is 28 days, about 4,032 blocks. The clock starts when the payment is accepted. The seller names 1, 2, 3, or 4 days to ship.

- Before it is marked shipped, Cancel closes the order and the coins go back to the buyer.
- If it is not marked shipped, with a carrier and a tracking number, by the ship-by day, the coins go back when the seller's wallet is on. If that wallet stays off, the coins sit until the Lightning window ends, and the network sends them back.
- A carrier scan does not move the coins.
- Mark received pays the seller. The seller's unlocked wallet reads `secrets/holds` while the node is on.
- If it was shipped and the buyer does nothing, the seller is paid when the hold ends, when the seller's wallet is on. If that wallet never acts, the Lightning window still sends the coins back.
- Not received stops both automatic moves. It does not return the coins by itself.

### A classified can name a referee

A shop sale does not name a referee. On a classified, both sides name the same person before payment, or both name nobody. The referee does not hold the coins and cannot spend them.

- Decide for the seller pays the seller. That is not Mark received. Mark received closes once that decision is stored.
- Decide for the buyer cancels the hold and records a returned delivery. The order stays.
- A decision after the window is ignored. The Lightning window still sends the coins back.

## Four rules

You can restart during a hold. Unlock before the window ends. The preimage that settles a shipment is in `secrets/holds` on this computer. Restarting is fine. Unlock the wallet and bring the node back on before the 14 or 28 days end. Locking the page does not stop the Lightning node. Closing the phone app does. Public pool does not hold the payment while that node is stopped.

The 24 words bring back the on-chain wallet and the Nostr key made from those words. They do not bring the shop book back, and they do not bring `secrets/holds` back. Each Lightning node's paper brings back the coins still in that node's own wallet, after the scan. Blake2b and SHA-256 each have their own paper. On this computer, the SHA-256 paper is two lines. On a phone, that paper is 24 words. An open channel is not in this file and is not on that paper. After this device's data is deleted, the channel list is gone. The other side does not send its record here. The channel does not keep working.

Save a copy, under Settings, then Other, then Backup, can hold a shipment still held, and it includes `secrets/holds`. Do not wipe the disk while a shipment is in transit unless that copy is saved. This wallet does not send the shop book to the shared node.

A 28-day hold asks for 4,032 blocks. Paying adds 3, and one pool hop adds 80. This wallet's Blake2b Lightning node is set to 4,224 blocks, so that hold fits. A node left at 2,016 blocks refuses the invoice. The page says "This Lightning node cannot hold a shipment for 28 days." On this computer, SHA-256 Lightning is Eclair. An Eclair build that cannot hold a shipment refuses the payment. Pay on-chain until that computer is running the build that holds a payment.

Settled sats stay in the channel until you close it. Close this channel asks the peer to close. Each side is paid the balance it holds now. You are paid what you can pay now. The peer is paid what you can receive. The closing transaction pays a miner fee from this channel. The fee stays the smaller one. It comes from the side that can pay it and still keep its output. Cancel leaves the channel open. The sats return to that Lightning node's own wallet after the closing transaction confirms. They return to Balance only after a later send.
