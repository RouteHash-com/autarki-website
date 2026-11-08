# Autarki marketing brief

Use this file when writing the public site. It describes what a person can do with Autarki. It is not install documentation and it is not a security audit.

The line under the name is **No platform. Just the sale.**

One sentence: **Autarki is your wallet and your shop. You hold the keys, you pay over Lightning or on-chain, and you buy and sell without a platform in the middle.**

Store line already in use: **Your wallet and your shop. Lightning, Nostr, and one-click mining.**

---

## What Autarki is

Autarki is a self-custodial wallet and a shop in one app. The same program receives and sends coins, lists a shop, takes a counter sale, posts a classified, hires a mining rig, and keeps a private note with another person. The person holds the 24 words. Autarki does not hold the keys, does not clear the sale, and does not take a fee from it. Shops and classifieds are public notes anyone can read. An order is a private note. The node that carries the order cannot read it. People can look through shops before they create a wallet. Sending an order, paying, and posting need the wallet open.

Autarki is a beta. It runs on the person's own computer: StartOS, Umbrel, or Ubuntu. A 64-bit Android phone can install version 0.1.0 (5) of the same program from the public apk and keep its own wallet file. Request access is a separate Google sign-in. A phone that already has 0.1.0 (1) has to uninstall that copy first. An iPhone can request a TestFlight invite for version 0.1.0 (3). That request is an email to apple@autarki.app. It is not an App Store listing. A phone on the same network can still open the computer's page, and that phone holds no seed.

---

## Who it is for

- People who want the 24 words in their own hands, not on an exchange.
- A shop that wants a public stall, a counter, and a private order, without building a website.
- Someone buying or selling goods, a service, a rental, or a job with another person.
- Someone who wants a shipped parcel to hold the coins until it arrives, with a person who can decide if it does not.
- Someone who wants to hire a listed mining rig and have the rewards come back to this wallet.
- People who want a readable name, a contact list, and a private note, without a public chat room.

It is a poor fit for someone who wants Autarki to custody the coins, invest them, stake them, or pay a yield. Do not write the site in those words.

---

## Coins

Promote XBT first and BTC second. Do not name XBTC. Do not say "two chains" or "three chains."

- **Blake2b XBT bitcoin.** Buttons say **XBT** or **Pay with XBT**. Its own node is Bitcoin Knots. Its Lightning is **Blake2b Lightning**.
- **SHA-256 BTC bitcoin.** Buttons say **BTC** or **Pay with BTC**. Settings headings say SHA-256d BTC and SHA-256 Lightning. Its own node is Bitcoin Core. Its Lightning is **SHA-256 Lightning**. Check Outs on-chain labels say **XBT** and **Bitcoin**.

XBT and SHA-256d BTC share history only up to the fork. A payment is signed for one chain. Coins from the wrong chain do not pay the sale.

Prices are whole satoshis. A dollar figure beside a price is a hint, in US dollars or Canadian dollars. The amount due stays in sats. The hint does not change the sats, the tax, or the spreadsheet.

Until the person connects their own node, ordinary XBT and Bitcoin addresses use Autarki's servers. Those servers can see a normal address. They do not make a silent-payment code, and they cannot see a coin paid to one. A silent-payment code appears after the person's own node is connected.

XBT Knots and Bitcoin Core do not run on the same computer.

---

## Core features

### The wallet

- One install is one wallet. The same program is the shop and the customer.
- The backup is 24 English words, shown once. Write them on paper. The words restore the funds on another machine. They do not restore the shop book, the orders, the catalog, or a Lightning channel.
- A new wallet can be made from 99 digits, each from 1 through 6. This computer adds its own randomness. The same digits do not rebuild a wallet. The 24 words shown once are the only backup.
- A password is optional and at least 12 characters when set. It encrypts only this copy of the wallet file. It is not part of the 24 words and it is not a BIP-39 passphrase. A blank password stores the words unencrypted on the device. A backup of that service is then the seed. Say that plainly. Do not claim a secure element, biometrics, or that a backed-up file is unreadable.
- Closing the browser does not lock the page. Restarting Autarki does. There is no Lock button.
- Receive, Send, and Balance. Amounts are whole sats. Prepare builds the payment. Sign is a separate press. Broadcast is a separate press. The browser never receives the signed transaction.
- A coin with no confirmation is not spendable. An ordinary coin can be spent after one confirmation. The page counts on toward six for display. A mining reward waits longer. On XBT the wait depends on the block it was mined in. On BTC it is 100 confirmations.
- Balance is the confirmed coins still held. Lightning is a separate jar. It is not added to Balance. Moving coins into Lightning sends them out of Balance. They have to confirm before a channel can open.
- The person can connect their own coin node under Settings, then Coin Nodes, or keep using Autarki's servers for ordinary addresses. Pair those two choices in the same sentence. Do not say the person's own node always counts the coins.
- A chain can be hidden on this browser. The saved connection stays on the computer.
- Shop books can be saved to a file and brought back. That file leaves out the 24 words, the wallet file, secret keys, and Lightning channel state.

### Lightning

- On an AMD or Intel computer, Autarki starts two Lightning nodes: one for Blake2b XBT and one for SHA-256 BTC. The person does not install a separate Lightning app and does not paste a node address, a macaroon, or a certificate.
- The first start of each node takes about ten minutes. The page keeps checking. Later starts are quicker.
- On-chain is the bank. Lightning is the money loaded before shopping in person. Savings stay on-chain. The first Lightning payment still needs a channel. After that channel has one confirmation, a later payment on it does not wait for a new confirmation.
- A Raspberry Pi, and an Umbrel arm64 package, run the wallet, the shop, Nostr, and on-chain payment. Lightning stays off on those packages. A Lightning payment, a shipment, and Mine need the AMD or Intel package. Do not claim built-in Lightning on a Pi.
- Blake2b Lightning and SHA-256 Lightning are different networks. A Bitcoin payment request is refused on the Blake2b rail.
- Each Lightning node has its own backup, separate from the 24 words. The Blake2b node has its own 24 words. The Bitcoin Lightning node does not use a phrase. Those backups are shown once. Do not tell people to reuse the wallet words for Lightning.
- When a purchase needs a channel, the app can open one. The person does not type a node name for that purchase. A channel that can already cover the amount pays without a new on-chain wait.
- A shared pool, so one channel can pay many shops, is the direction of the product. Do not say that pool already pays every sale, or that a buyer never needs a channel. Do not describe splice, trampoline, or a "Lightning fork" by those names. Say Blake2b Lightning and SHA-256 Lightning.
- Incoming room is what customers can pay into. A channel the shop just funded has the coins on the shop's side, so customers cannot pay into it until room exists on the other side. Zero room does not block a buyer whose own node can open toward the shop.
- A seller can set coins aside as a float so Lightning arrives immediately and a shipment can be held. Most sellers can continue without a float. In person, Lightning is then not instant. Online orders can wait. A shipped order is not held until a float is added. Choosing a float does not send coins by itself.

### Shop

- Shop is the notice board. Search a shop, a product, or a place. Country, province or state, city, neighbourhood, and up to four categories are optional. A logo, a picture, and a map link show when the shop published them.
- Looking through shops does not need a wallet. Sending an order does.
- An unlisted shop opens by its public name or by scanning its printed card.
- A cart, a tip, then Check-Out. Minus stops at one after the order number exists.
- The stall, each product, and the place are public notes. The order is a private note to that shop: the products, the quantities, an optional note, and an optional tip. It does not contain the price. The shop charges its own catalog. It does not contain a payment code. The shop makes the code.
- The public stall uses Autarki's relay until the shop names its own. The relay cannot read the order. Pay-to-relay is off. The key and the books stay with the shop. Do not say the shop is unhosted.
- A shop is POS (the counter) or Online. POS is the choice until the owner picks Online and publishes. POS shows Pay Counter and a clerk ticket with the last four characters and a QR. Online does not show Pay Counter.
- Pay with XBT or Pay with BTC. Lightning sits under the chain that was pressed. Blake2b Lightning for XBT. SHA-256 Lightning for BTC.
- Prepare payment fills Send and prepares. Broadcast is still a separate press.
- Enable storefront features shows the Store tab. The catalog has products for sale and supplies the shop buys. A product has a name, a price in sats, an optional picture link, one description line, and an optional shelf count. The count stays on this computer and is not published.
- Taxes are two names and two rates, such as GST and PST. They apply to products, shipping, and the other fee. The tip is not taxed. Tips can offer up to four percentages, or another amount.
- Clerks are staff names on this computer. They are not published. A sale can name who took it.
- Pay Counter records cash, a debit card, a credit card, a coupon, store credit, bitcoin, or a mix. The page does not charge the card and does not talk to a card terminal. The clerk types the amount on the card machine. The card machine prints its own slip.
- Ledger, with the store on, has Sell, Buy, Check Outs, Open POs, Sales, a coin journal, and a till. Sales can be downloaded as a spreadsheet. The coin journal can be downloaded as CSV. Today, Week, and Month.
- A Lightning sale and a counter payment are on the sales spreadsheet. They do not write a coin, so they are absent from the coin journal, from Accounted, from the till, and from Balance.
- An unpaid checkout with nothing settled is cancelled after 24 hours. A paid sale cannot be cancelled. There is no refund button. A refund is a later order.
- The till is a separate float on this computer. Arming it does not open a channel. A large withdrawal is signed with the 24 words on another computer.
- There is no receipt printer in the app yet. Do not promise a printed Autarki slip.

### Classifieds

- Classifieds are a separate public board from the shop catalog. They stay off until Enable Classifieds under Settings. A new wallet leaves them off.
- A classified uses the same key as the shop. Publishing an ad does not require a store.
- Goods, services, rentals, jobs, giveaways, and personals. A giveaway, a personal, or a job hire can be posted with no coin node. Goods, a service, a rental, or a job offered for a price needs the person's own XBT node or Bitcoin node, because that ad publishes a silent-payment code. Autarki's servers do not make that code.
- The buyer chooses Pick up or Ship. There is no default.
- Pick up can pay on-chain or with Lightning, in XBT or in BTC. Ship pays with Lightning only. On-chain is not offered for a shipment.
- The seller names how many days they have to hand the parcel to the carrier, from one to four, and whether the hold is 14 days at home or 28 days overseas. The ad shows both dates.
- The seller can add a postal code, a country, and a weight. The buyer then chooses a shipping price. Canada Post is offered from a Canadian origin. FedEx can be offered too. Pickup and a counter sale do not ask. The published item price stays the item price. The shipping price is added before payment.
- Ignore an ad, or block a seller on this device. My Ads shows the ads saved on this computer. Only the person who posted an ad sees Edit.
- Set location searches by a city. Use my location asks the browser. The position is not saved and is not sent to Autarki. If the browser shares no coordinates, the city can come from the network. A refused prompt does not ask the network.

### A shipment holds the coins

- The buyer pays with Lightning. The coins sit on the seller's node. The seller can send the parcel knowing the money is there. The buyer marks it received, and the seller is paid.
- Before it is marked shipped, Cancel is still open and the coins go back to the buyer.
- After it is marked shipped, Cancel is closed. The buyer sees the carrier, the tracking number, and a link to the shipper's page. Mark received pays the seller.
- Not received stops both automatic moves. The coins stay held until the buyer marks it received, the chosen referee decides, or the Lightning window ends and the coins come back.
- If the seller does not mark it shipped, with a carrier and a tracking number, by the ship-by day, the coins go back. If they did ship it and the buyer does nothing, the seller is paid when the hold ends, when the seller's wallet is on.
- The seller's wallet and Lightning node need to stay on through the window. If the wallet never acts, the window still sends the coins back to the buyer.
- A referee is optional. Each side can name one public name before payment. The referee does not hold the coins. After Not received, the referee sees the carrier, the tracking, the saved scan, and each side's note, then gives one decision. A decision for the seller pays the seller. A decision for the buyer sends the coins back. The shipment is recorded as returned, not cancelled. If no decision arrives, the window still sends the coins back.
- Check the carrier saves the latest scan as words. Canada Post, UPS, FedEx, and DHL are the names it can look up. The person does not create a carrier account. The scan does not pay anyone and does not send the coins back.
- Say what the buyer sees. Do not explain how a node could finish the payment outside the app.

### Mining

- Mining is a tab once the wallet is open. It hires a listed rig from RouteHash. It does not mine on this computer. The phone must not hash.
- Open a RouteHash account at routehash.com and paste that account's API token. The same connection is under Settings, then Other.
- Two cards: **Mine XBT** hires a listed Blake2b rig and pays in Blake2b XBT. **Mine BTC** hires a listed SHA-256 rig and pays in SHA-256 BTC.
- The payout address is the next address from this wallet. Rewards come back to this wallet.
- Click Mine. Nothing is spent until Mine, or until the person confirms the hours. Do not call mining one click that spends. Do not call a hire free.
- A rig can be hired by the hour from a RouteHash balance. That path does not spend this wallet's Lightning balance. A short account says to deposit on RouteHash.
- A meter invoice is paid from this wallet's Lightning node for that chain, when a channel can cover it.
- Before RouteHash is connected, Balance says to hire a rig and that the rewards come back to this wallet. After it is connected, Balance lists Open Mining Invoices.
- Spendable coins from a reward stay on Balance after the confirmation wait for that chain. On XBT the wait is longer and depends on the block. On BTC it is 100 confirmations. The Mining card is not a second balance.
- routehash.com is the mining site. It does not describe the wallet. The wallet page is where the hire happens.

### Names, contacts, and a private note

- The public name is the Nostr key. A profile can add a display name, a short about line, and a picture. People see that name instead of the raw key. The shortened key still copies.
- Profile, Contacts, Nostr nodes, and Discord are under Settings, then Nostr.
- Read your profile checks relays that already have one, including nos.lol, relay.damus.io, relay.primal.net, and purplepag.es, plus the Autarki relay and the relays this wallet saved. A relay that does not answer is not treated as an empty profile. Fields the person does not edit stay on the note.
- Contacts are the people this wallet follows, up to 200. Opening Contacts reads that list. Unfollow removes a key. Block publishes a mute list. Unblock removes it. Neither one pays anyone, and neither one changes a shipment. This wallet is not added to its own list. A list that could not be read is not replaced.
- A pet name is a name the person types for a contact. It stays on their contact list.
- Discord is optional. The person posts "Verifying that I control the following Nostr public key:" plus the public name, then pastes the Discord username and the message link. Autarki does not join Discord, does not use a bot, and does not check that the message is real. A member of that server can open the link. An outsider still sees the ad. Discord is not a delivery count and is not required to buy or sell.
- There is no Autarki username and no NIP-05 mailbox. A website name is not an inbox and is not required.
- **Message**, beside a copied public name, opens one private note to that person. On a phone the sheet fills the screen. On a desktop it stays over the page, so the order remains. Send does not create an order, move coins, or change a shipment.
- A message about an order already travels with that order. About this order can insert the order number into the note, where the person can see it before Send. It is not attached in secret.
- One short plain-text note, up to 1000 characters. No pictures in the note. The older kind of encrypted message stays refused.
- Contacts is the thread list. There is no fifth main tab and no public chat room. Each card can show the published name, the pet name, Discord, the store name, the delivery words this wallet already uses, the last line, and the time. New marks a thread that has not been opened.
- A blocked person still has a card. The composer is hidden.
- The bell names the person. It does not include the message text. Opening the thread clears New on the card. Clear still clears the bell. A later note from the same person marks that bell row again.
- Writing to someone does not follow them. Add to contacts stays its own button.
- The private note is in the current app source. An install built before that work does not show Message until it is updated. Do not tell a visitor on an older package that the button is already on their page.

### Trust

Four public signs. No stars, no thumbs, no review essays, and no zaps.

- The stall can say how many shipments were received after a completed payment, the day of the first, and how many are still not received. The seller's own book writes those numbers. Nobody types a count by hand. Pickup does not count. A shop set to POS leaves that card off the visit.
- After a completed shipment, each side can sign a short note that names the order and the other key. It does not name the goods or the price. The page says how many orders both keys signed.
- A vouch is a name, shown only after those two keys share a completed shipment. The page says "You said you know this key" and "Known by." A vouch is not required to buy or sell.
- Discord, as above, stands apart from the counts.

### Notices

- The bell lists what happened on this computer: a new order, a payment, a shipment, a referee note, and a private message.
- A shipment note and Not received show the words that belong on that order. A private message does not. The bell names the person and leaves the message out.
- A click opens the order, or the person's card. Clear this and Clear all leave the row and mark it read.
- The browser can show a banner when the page is open. There is no phone push service. A computer that is off, or a wallet that has not been opened since start, rings on the next read.

### Keys and cold storage

- Settings, then Keychains, shows public account keys. They do not spend.
- The personal account is what Receive and Send use.
- The shop account can be published on the stall. It cannot spend, and it does not reveal the personal account.
- A native SegWit watcher account is shown and not spent.
- A Krux device can be imported as watch-only. The 24 words stay on the device. This copy can receive and show a balance. It cannot sign, and it cannot run the shop key, Lightning, the till, or a silent-payment code.
- An ordinary XBT Taproot payment can be signed on a Yahboom K210 running Paperclip's Krux firmware, by file or by scan. The device shows the destination, the amount, the change, and the fee. Official Krux and a stock Bitcoin hardware wallet sign a sighash the XBT chain rejects. The device does not sign SHA-256d payments, Lightning, or silent-payment coins.
- A native SegWit phrase can be imported for SHA-256d BTC. XBT from those words stays a different Taproot account.

### The page itself

- Navigation: Shop, Receive, Send, Balance, Ledger, and Settings. Store appears after storefront features are on. Classifieds appears after they are turned on. Mining appears once the wallet is open. The bell appears when there is something to show.
- A computer with no wallet yet opens on Shop. After a wallet exists, the page opens on Receive.
- Three contrasts: **Paper**, **Ink**, and **Console**. Paper is the default. Ink is light text on black. Console is green on black. The choice stays in this browser.
- Language, in this browser: English, Español, Português, Français, and Deutsch. The 24 words stay the English list. Amounts stay in sats. The dollar hint stays US dollars or Canadian dollars.
- The in-app guide is a manual at `/guide` on that wallet. It is not a public website.
- First run is six steps: the password, the servers, XBT, Bitcoin, the shop, and Lightning. It can be skipped and opened again from Settings, then Keychains.

---

## Benefits, in the site's voice

- You keep the 24 words. No exchange holds the coins.
- You can look through shops before you make a wallet.
- You pay the person, not a platform. Autarki does not take a cut of the sale.
- The stall is public. The order is private. The node that stores the order cannot read it.
- Lightning is there for speed, on AMD and Intel, without installing a second Lightning app.
- On-chain still works, including when Lightning is off.
- A shipment can hold the coins until the parcel is received, and a named person can decide if it was not.
- A counter can record cash or a card without this page charging the card.
- A delivery count comes from completed shipments, not from stars someone can type.
- A private note reaches one person. It does not become an order and it does not move coins.
- A listed rig can be hired from the same wallet, and the rewards come back to it.
- The books stay on this computer. A spreadsheet and a CSV can be downloaded.

---

## What is working, and what is not

### Say this is here

- Wallet, Receive, Send, Balance, and the 24-word backup.
- Shop browsing before a wallet exists. Cart, checkout, tip, tax, clerks, POS and Online, Pay Counter.
- Classifieds, after they are turned on. Pickup and Ship. Delivery counts, both-keys notes, and a vouch after a shared shipment.
- Contacts, profiles, Discord links, block, and unfollow.
- Notices for orders, shipments, and referee notes.
- A private note to one person, in the current source: Message beside a name, a thread on the contact card, and a bell row that does not contain the message. Older installed packages do not show it yet.
- Mining hire from a RouteHash account, paid in XBT or BTC, with rewards back to this wallet.
- Built-in Blake2b Lightning and SHA-256 Lightning on AMD and Intel packages.
- Shipment holds, ship-by of one to four days, a 14-day home hold, cancel before ship, mark received, Not received, and one referee decision.
- Silent-payment codes after the person's own node is connected. Ordinary addresses on Autarki's servers before that.
- English, Spanish, Portuguese, French, and German as a browser language choice.
- Paper, Ink, and Console.
- StartOS on AMD/Intel, Umbrel from the RouteHash community store, and Ubuntu.

### Say this is the direction, not a finished promise

- A shared Lightning pool so one channel pays many shops. The app can open a channel when a payment needs one. Do not say every purchase already clears through a funded pool with no channel and no wait.
- A 28-day overseas hold is a choice on the ad. Treat the 14-day home hold as the one to describe as the usual shipment. Do not promise a 28-day hold on every node.
- Private messages need the build that contains them. Do not say the public download from an older release already has Message.

### Do not claim these

- An App Store listing or a Play Store listing. Android 0.1.0 (5) is a public apk, plus request access. It is not a store listing. iPhone 0.1.0 (3) is a TestFlight invite request, not an App Store listing.
- On-device mining. Apple's rules also forbid mining on the device. The hire is a remote rig.
- A receipt printer.
- Zaps, a public chat room, a group chat, reactions, or a Lightning address as a mailbox.
- An Autarki username or a required NIP-05 name.
- A refund button. A refund is a later order.
- That the page charges a debit or credit card.
- That Autarki has been security-audited. Project tests are not an audit.
- Invest, Returns, Staking, Yield, Guaranteed, exchange, payment processor, or passive income.
- "Invoice" as the product word. Prefer **sale**.
- "Online store" as the product word. Prefer **shop**.
- Emoji.
- That the shop is unhosted, or that the person's own node always counts the coins.
- Built-in Lightning on Raspberry Pi or Umbrel arm64.
- That a blank password is a form of security.
- Mainland China as a store region, if a store listing is ever written. There is no store listing now.

---

## How someone gets it

- The public source and release are at [github.com/RouteHash-com/autarki](https://github.com/RouteHash-com/autarki). The release tag people download is 0.1.0. Newer StartOS sideload packages exist for AMD/Intel. The site should point at the current download, not at a private build number.
- StartOS: the package in that repository is an x86_64 sideload. Check `SHA256SUMS`.
- Umbrel: add the RouteHash community store at [github.com/RouteHash-com/umbrel-store](https://github.com/RouteHash-com/umbrel-store), then install Autarki. That store is not the official Umbrel App Store. Load the image that matches the machine. The arm64 image leaves Lightning off.
- Ubuntu: the image in the repository.
- Bug reports go to the RouteHash Discord channel **#autarki**, [discord.gg/VBxvzQXvt](https://discord.gg/VBxvzQXvt). Do not send people to GitHub issues.
- There is no GitHub Pages site. routehash.com is the mining site, not the wallet brochure. The in-app guide is not public.

---

## Branding

- Name: **Autarki**. Slogan: **No platform. Just the sale.**
- The mark is a flat geometric cutout, used with the word Autarki or alone. Approved files are in `brand/` in the Autarki repository: `mark.svg`, paper, ink, and console PNGs, and the matching lockups. Paper uses copper `#a15c38`. Ink uses light copper `#e0a080`. Console uses green `#3dff6e`. Backgrounds of the lockup PNGs are transparent.
- The StartOS service icon is a dark rounded tile, `#141210`, with the light-copper mark.
- Marks stay sharp and flat. Grain, a single copper-on-paper treatment, and a mountain path are rejected.
- Subtitles stay short and plain, about 23 characters and not past the low 30s. No emoji.
- Rejected lines, do not revive them: "The public shop. The private order.", "Sell in the open. Order in private.", "No website in the middle.", and "Put your shop on Nostr."
- The direction people like is "no platform in the sale." More variations on that promise are welcome. Do not pitch Autarki as the platform in the sale.
- Prefer **sale** over **payment** when the sentence is about the shop. Card terminals are outside the app.
- When a sentence names one way, name the other in the same place: Autarki's servers and the person's own node, a normal address and a silent-payment code, an ad with no code and a priced ad that carries one, a catalog announced without a node and payment after the node is connected.

### Tone

- Straightforward. Short sentences. Say what the person does next.
- Name the control the way the page names it: Pay with XBT, Pay with BTC, Pay Counter, Check Outs, Mine, Message, Mark received, Not received.
- Explain a limit in the same breath as the feature. Lightning is fast after a channel exists. The first one still needs a channel. A shipment holds the coins, and the seller's wallet has to stay on.
- Do not stack protocol numbers on the marketing page. "Private note" is enough. Kind numbers belong in the in-app guide and the spec, not in a headline.
- Do not moralize about other wallets.

---

## Suggested website

### Goals

- Explain Autarki in one sentence, then the slogan.
- Show three benefits: the person holds the keys, Lightning is in the app on AMD and Intel, and the shop and classifieds settle between the two people.
- Give one concrete example each for a counter sale, a shipped classified, a private note, and hiring a rig.
- Send the visitor to the GitHub release and the Umbrel community store, and say which machines include Lightning.
- Leave a path to Discord #autarki for help.

### A first page could say

1. **No platform. Just the sale.** Autarki is your wallet and your shop.
2. **You hold the 24 words.** Autarki does not.
3. **Pay the person.** Lightning or on-chain. Cash and cards are recorded at the counter. This page does not charge the card.
4. **The stall is public. The order is private.**
5. **Ship it.** The coins wait until the parcel is received.
6. **Hire a rig.** Rewards come back to this wallet. Nothing is spent until you click Mine.
7. **A name, not a raw key.** And a private note to that person, which does not move coins.
8. **Install it on your computer.** AMD and Intel include Lightning. A Pi runs the wallet and the shop, and leaves Lightning off.

### Examples that stay concrete

- A buyer searches a shop, adds a product, and pays with Lightning. The shop sees the order. The relay does not.
- A seller posts a classified, the buyer chooses Ship, and the coins stay held until Mark received. Not received asks the named referee. The referee does not hold the coins.
- A clerk marks a sale paid with cash. The card machine is the clerk's. Autarki records the sale.
- Someone pastes a RouteHash token, clicks Mine XBT, and the next reward address is already this wallet's.
- Someone taps Message beside a shop name, writes one note, and sends it. The order on the screen does not change.

---

## Words

Use: wallet, shop, sale, classified, Receive, Send, Balance, Pay with XBT, Pay with BTC, Blake2b Lightning, SHA-256 Lightning, Pay Counter, shipment, Mark received, Not received, referee, Mine, public name, contact, private note, 24 words, your own node, Autarki's servers.

Avoid: XBTC, invoice, online store, two chains, three chains, Lightning fork, trampoline, splice, gift wrap, zap, yield, stake, invest, guaranteed, exchange, payment processor, passive income, audited, unhosted, one-click mining that spends, free rig, emoji.
