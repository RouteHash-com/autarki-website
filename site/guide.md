# User guide

The page is [https://autarki.app/guide](https://autarki.app/guide).

## The 29 procedures.

A step marked Spend is the click that moves coins. Prepare payment fills Send and does not spend. A Lightning payment request is not a payment.

Do not paste a seed, a secret key, a payment request, an address, or an order number into a note.

## Shop, customer side

### 1. Look through shops

Customer only. No wallet, no pay, no order.

1. Open Shop.
2. In Search, type a shop, a product, or a place. The field reads “A shop, a product, or a place.”
3. Read the Notice board. The shops listed there are the public stalls.
4. Open one stall.
5. If the shop published a logo, that picture is on the stall. A product picture is on that product.
6. If the shop published a map link, press Open the map.
7. If this shop has completed shipments, the stall shows “Received shipments” and the count. The first date is shown when the board has it.
8. Stop there. Do not add a product. Do not press Check-Out.

### 2. Connect an unlisted shop

The shop prints the poster first. The customer uses it second.

Shop

1. Open Store, then Nostr.
2. Press Show this shop's key. The poster uses the public name. Do not press Show the secret, and do not copy a secret key into a note.
3. Press Print the poster.
4. Press Print or save as PDF. In the print dialog, turn headers off. That dialog does not spend coins.
5. Put the page in the shop.

Customer

1. Open Shop.
2. Under Connect an unlisted shop, either paste the public name from the poster into Public name, or press Scan the QR and scan the poster.
3. Press Show this shop.
4. The stall opens the same way as a listed shop. Stop before adding a product.

### 3. Build a cart

Customer. Stop before any pay button.

1. Open a stall, from the notice board or from Show this shop.
2. On a product, press Add.
3. Change the count with + and −. The number between them is the count. − is “Take one off.” + is “Add one.”
4. Read Your order. The estimated total includes the taxes the shop saved.
5. A note is optional. The field is “Note or special request for the store.”
6. Press Check-Out. This opens the review on this computer. It is not a payment.
7. If the shop turned on Enable Tips at checkout, the tip row is on that review. Press a percent, or type Other amount and press Tip this amount.
8. Press Change Order. The lines go back to the cart.
9. Stop. Do not press Pay with XBT, Pay with BTC, XBT Lightning, BTC Lightning, or Pay Counter.

### 4. Pay at the counter

The shop is set to POS and that choice is already published. No coin moves.

Customer

1. Build the cart and press Check-Out.
2. Press Pay Counter.
3. The page says to pay the shop there. The clerk ticket shows the last four characters and a code. Tell the clerk those four characters, or let the clerk scan the code.
4. Leave this page open. The receipt arrives after the shop records the sale.

Shop

1. Open Ledger, then Check Outs.
2. Press Check for orders. Wait until the card appears. The page can say “Checking for orders.” or “The page is still working.” Press Check for orders again if that check stops waiting.
3. Open the card. It shows the customer, the lines, and the amount still due.
4. Press Cash, Debit card, Credit card, Coupon, or Store credit.
5. Read “This marks the sale paid. It does not record a coin.”
6. Press Mark this sale paid once. Wait. A second press while the page is still working is dropped. Cash ends as “Taken at the counter — Paid with cash.” The other methods use the same sentence with debit card, credit card, a coupon, or store credit.
7. The card leaves Check Outs. Open Sales. The paid row is there. Today is the default. A Sales date can be the next UTC day.

Customer again

1. Open Ledger.
2. Press Sent. A customer with the store off does not see the shop chips. The receipt is on Sent.
3. Open the receipt. It reads “Paid with cash.” or the matching line for the method the clerk chose.

Do not press XBT, Bitcoin, Lightning for these sales, Scan an order, or Hand off to customer for this procedure.

### 5. Pay a pickup on-chain

The shop is already published as Online. Ship and Pick up are on that checkout. A POS stall does not offer them. Do not switch a live counter shop to Online just to practice this.

**Spend:** Broadcast this payment.

1. Customer builds the cart and presses Check-Out.
2. Under “How should this order reach you?”, press Pick up.
3. Press Pay with XBT or Pay with BTC.
4. The page shows the code and the amount still due. Read both.
5. Press Prepare payment. That fills Send. Nothing is sent.
6. Read the amount, the destination, and the miner fee.
7. Press Sign on this computer. Nothing is sent.
8. **Spend:** Press Broadcast this payment. That is the spend.
9. Cancel this payment drops the prepared payment and does not spend. An open wallet broadcasts without asking again, so do not press Broadcast unless this payment is intended.
10. For a film, stop when the code and the amount still due are on screen. Do not press Prepare payment.

The shop records the sale when the coin arrives. Paying on-chain needs no Lightning channel.

### 6. Pay a pickup with Lightning

Same order as [procedure 5](https://autarki.app/guide#pickup-chain). The shop is Online and the customer already chose Pick up.

**Spend:** the Lightning send, after a channel can cover the amount. The payment request is not the spend.

1. Under Pay with XBT, press XBT Lightning. Under Pay with BTC, press BTC Lightning. Those buttons stay hidden until the checkout offers them.
2. The page asks the shop for a payment request and shows it. Read “A payment request from the shop. Paying it does not mark this sale by itself.”
3. A channel from the customer has to be able to pay that amount before anything is sent. If it cannot, the page does not send it.
4. **Spend:** When the channel can cover the amount, the page pays the shop. The line is “The Lightning node is sending this payment.”
5. The sale stays open until the shop node reports the payment. The shop can press Check this payment after the customer has sent it. That check does not send a second payment.
6. The first opening waits about ten minutes for one confirmation. A later payment on a channel that can cover the amount does not wait.
7. If the payment needs a new channel, the page offers Use Autarki Pool or Use Shop Channel. Nothing is sent until that choice is confirmed. Coins have to be confirmed in the Lightning node’s own wallet first. [Procedure 24](https://autarki.app/guide#open-channel) puts them there.

### 7. Finish an amount still due

An order that already has a payment and still owes sats. A refund is a later order. There is no refund button on this order.

1. Open Balance.
2. Read the amount still due.
3. Press Pay what is still due. The same words are on the checkout when a Lightning line says “A Lightning payment is recorded. Pay what is still due.”
4. That opens the checkout for the remainder.
5. Pay the remainder with the same path as [procedure 5](https://autarki.app/guide#pickup-chain) or [procedure 6](https://autarki.app/guide#pickup-lightning).
6. **Spend:** On-chain, Broadcast this payment is the spend. Lightning, the send is the spend, and only after a channel can cover the remainder.
7. Open this order is the other Balance button. Use it when nothing has been sent to the shop yet. It is not the remainder path.

### 8. Cancel an unpaid order

1. Customer opens Shop.
2. Under Open orders, open the unpaid order.
3. Press Cancel.
4. If nothing was paid, the shop’s Check for orders drops that card from Check Outs.
5. If the order has shipped, Cancel is closed. The page says to mark it received, or to say it was not received. Use [procedure 13](https://autarki.app/guide#close-shipment).
6. A paid shipment that has not shipped is not this procedure. Cancel on that order checks whether it has shipped before it closes.

## Shop, seller side

### 9. Turn the store on

Shop wallet. No coin moves in this procedure.

1. Open Settings, then Nostr.
2. Turn on Enable storefront features on this device. Store appears. Turning it off hides Store. Orders and the catalog stay on this computer.
3. Open Store, then Catalog. Press Add a catalog item.
4. Leave For sale pressed. Type the name and the price. Sats is the default. US dollars and Canadian dollars are the other units.
5. Picture and Description are optional. On hand counts the shelf. Leave it empty and the product is not counted.
6. Type Weight in kilograms for one unit. An online shipment adds that weight for each unit, then asks FedEx or Canada Post. Leave it empty and a shipment of that product stays the product price.
7. Press Add this product.
8. Open Taxes. Type the federal name and percent, and the state or provincial name and percent. Press Save taxes.
9. Open Tips. Turn on Enable Tips at checkout. Type up to four percents. Press Save tips.
10. Open Clerks. Turn on Enable clerk assignment. Type a staff name and press Add this clerk. On Ledger, then Sell, the active clerk is chosen there. An empty roster says “Add a clerk under Store.”
11. The first-run selling card asks “Will a customer pay while standing there?” In person sets the counter. Online sets the shipment path. Both records both.
12. Press Provide a float or Continue without a float. Either press records the choice. Neither press sends coins.
13. The room card can offer Pay 1,200 sats for Blake2b pool room, Pay 1,200 sats for Bitcoin pool room, or Use a direct channel. Paying the fee only fills Send. Nothing is sent until Prepare payment, then Broadcast this payment. Use a direct channel has no pool fee. Skip that card when this procedure is only turning the store on.

### 10. Publish the stall

1. Open Store, then Nostr.
2. Choose POS or Online. POS is the counter. Online hides Pay Counter and the clerk ticket. Until you publish, customers still see the counter.
3. Type the shop name.
4. Press Use my location, or type Country, Province or state, City, and Neighbourhood.
5. For an online shop, type Postal code you ship from and Country code. A counter shop can leave them blank. Blank means an online shipment stays the product price.
6. Map link, Logo, and Categories are optional. Categories become filters after publish.
7. Press Save profile. That stays on this computer.
8. Press Publish this shop. That announces the name, the place, the map, the products for sale, the taxes, the tips, POS or Online, and the code a customer pays.
9. Press Show this shop's key, then Print the poster, as in [procedure 2](https://autarki.app/guide#unlisted).
10. Paste a secret key only when this shop already has one. It starts with nsec. The public name alone cannot publish. Do not display that key.

### 11. Take a checkout

Shop. This is the clerk screen. It does not record the payment by itself.

1. Open Ledger, then Check Outs.
2. Press Check for orders.
3. Open the card. It shows the customer, the lines, and the amount still due.
4. Press Hand off to customer when the customer will finish on their own screen.
5. Press Take this back. The clerk screen returns.
6. Recording cash, a card, a coupon, or store credit is [procedure 4](https://autarki.app/guide#counter). Recording an on-chain or Lightning payment is [procedure 5](https://autarki.app/guide#pickup-chain) or [procedure 6](https://autarki.app/guide#pickup-lightning).

### 12. Ship a shop order

The shop is published as Online. Ship is Lightning only. The customer has to choose Ship or Pick up before pay.

Customer, before pay

1. On Check-Out, press Ship.
2. Type the postal code and the country code this shipment goes to.
3. Press FedEx or Canada Post. Canada Post is offered from a Canadian origin.
4. The shipping price is added before pay. If neither carrier returns a price, the line says the shipping price is not available and pay stays closed.
5. Name a referee, or both sides name nobody, before pay. [Procedure 14](https://autarki.app/guide#referee). Payment waits until those names match.
6. Pay with XBT Lightning or BTC Lightning. [Procedure 6](https://autarki.app/guide#pickup-lightning). Pickup adds no shipping price.

Shop, after the payment is recorded

1. Open the order.
2. Press Canada Post, UPS, FedEx, or DHL, or type a carrier.
3. Type the tracking number.
4. A seal id is optional. Contents and Sealed box are optional https picture links. Two is the limit.
5. Press Mark shipped.
6. The buyer sees the tracking link. The shop marks it shipped before Mark received can be saved.

### 13. Close a shipment

One of three endings. The first two pay the seller. The third stops both.

1. **Spend:** Buyer presses Mark received. That pays the seller.
2. **Spend:** Or the hold ends and the seller is paid. Domestic and Overseas set that hold on a classified. The shop order uses the shipment clock the page already shows. No extra button.
3. Or the buyer presses Not received. Read “Not received stops the automatic payment. It does not return the coins by itself.”
4. Coins stay where they are until the referee decides. [Procedure 20](https://autarki.app/guide#dispute). There is no button named Dispute.

### 14. Name a referee

Before pay. Each side names the same person, or both name nobody. Payment waits until those names match. Copy a public name for a classified shipment from [Find a referee](https://autarki.app/referee). A shop sale does not use that page. A store stall does not use that page.

1. On the checkout, open Dispute Referee?.
2. The hint says a referee is optional, and that payment waits until both sides name the same person or both name nobody.
3. Choose a name from the menu, or paste one public name. The menu is Contacts. Add a contact under Settings, then Nostr, then Contacts, and that name shows here.
4. Press Assign a referee.
5. The other side does the same. If they named someone else, press Agree to use that name.
6. When the names match, the page says: “Both sides named this person. That name is agreed. The buyer can pay; or click Remove Referee then the buyer can pay with no Referee.”
7. Both sides named nobody also lets the buyer pay.
8. The referee decides only after the buyer presses Not received.
9. **Spend:** Decide for the seller pays the seller.
10. **Spend:** Decide for the buyer sends the coins back.

### 15. Books

Shop ledger. Lightning payments and counter payments stay off the coin journal.

1. Open Ledger.
2. Sell is the counter cart. Add a product from For sale. Paid sales move to Sales.
3. Buy is supplies. Add a supply. Create that product under Store as Supply. Paid purchases are on Sales, under Supplies.
4. Open POs lists the open purchase orders.
5. Check Outs is [procedure 11](https://autarki.app/guide#take-checkout).
6. Sales lists paid orders. Today, Week, and Month change the period. Press Download sales for one row per item. That file is the sales sheet, not the coin journal.
7. Ledger, the chip beside Sales, is the coin journal. Today, Week, and Month change the period. Credit is a receipt and debit is a payment. The balance runs from the oldest line. A counter sale and a Lightning sale are not lines here.
8. Till shows the float this page can see. Sign on this till signs and does not broadcast. Prepare the vault packet prepares an unsigned payment and does not sign. A refund is still a later order.

## Classifieds

### 16. Post an ad

1. Settings, then Nostr. Turn on Enable Classifieds. A giveaway, a personal, or a job you are hiring for needs no coin node. Goods, a service, a rental, or a priced job needs the Blake2b XBT node or the SHA-256 BTC node. One is enough.
2. Open Classifieds. Press Post.
3. Press Goods, Services, Jobs, Rentals, Giveaways, or Personals.
4. Type the title, the description, and the place. Use my location can fill the place.
5. For a priced ad, type the price. Press Sats, US dollars, or Canadian dollars. Press XBT or BTC for the coin that node can see.
6. Press Save. That stays on this computer.
7. Press Publish. The listing is on the board.
8. Other markets is optional. On the ad form, turn on Show this ad on other markets. Publish then sends a second note only when the ad names an XBT or BTC amount. The title, the place, the category, and the images stay. The note names the sat amount and https://autarki.app. It has no payment code, no node, and no shipment. The sale stays on Autarki. The second note goes only to nos.lol, relay.damus.io, relay.primal.net, and relay.nostr.band. Turn the switch off and publish again to tell those boards to drop the second note.

### 17. Buyer checkout

Tax and a tip are not added.

1. Open the ad.
2. Press Ship or Pick up.
3. Ship asks for a destination. Type Postal / Zip Code and Country code, or press Use my location.
4. Press FedEx or Canada Post. That price is added before pay. Pickup adds none.
5. If the ad left postal code, country, and weight blank, Ship pays the item price only.
6. Open Dispute Referee? and finish [procedure 14](https://autarki.app/guide#referee), or both sides name nobody. Copy a public name from [Find a referee](https://autarki.app/referee).
7. Press XBT Lightning or BTC Lightning.
8. **Spend:** The payment request is not the payment. A channel has to be able to pay before anything is sent. The Lightning send is the spend.
9. After you pay, the seller marks it shipped. Then Mark received is available.

### 18. Seller’s own ad

1. Open the ad you published.
2. Set shipping days: 1 day, 2 days, 3 days, or 4 days.
3. Press Domestic or Overseas.
4. Type the postal code you ship from, the country code, and the package weight in kilograms. Use my location can fill the origin.
5. Press Publish. That saves the shipping promise. A buyer uses those three to ask FedEx or Canada Post. The price is not written on the ad. Leave them blank and the item price is the total.
6. Each order is its own card with the order number.
7. The board card can show a waiting count, as “N new orders.”
8. On the three wallets that are already open, “No new orders.” can still sit above Publish. That placement is fixed in the source and shows after the next startup. Do not restart them for this procedure.

### 19. Referee notice

1. The bell is Notices.
2. When the referee is accepted, the notice says both sides named that person.
3. Open the order. The buyer can pay, or press Remove Referee and then pay with no referee.
4. On the referee’s own wallet, Notices lists Shipments you may review.
5. Press Open on that card. Press Close to leave it.
6. If only one side named this person, the notice says you are not the referee until both sides name you. Press Decline to refuse a proposal. Decline does not move coins.
7. The referee decides only after Not received.

### 20. Dispute

There is no button named Dispute.

1. The buyer presses Not received.
2. The seller can enter one note, the tracking that is already on the shipment, and picture links. A picture is an https link. Two is the limit. Press Send this note. A second note is refused.
3. The buyer can send one note the same way.
4. The referee opens the card from Shipments you may review.
5. The card shows both notes and the two decisions.
6. **Spend:** Press Decide for the seller. That pays the seller.
7. **Spend:** Press Decide for the buyer. That sends the coins back.
8. Review the notes before either decision.

## Wallet

### 21. Receive

No coin leaves this wallet.

1. Open Receive. If the wallet file is locked, press Open wallet once. Later addresses do not ask again.
2. Press XBT, BTC, or XBTC. The chain is named beside the address.
3. Press New XBT address, or the same button renamed for the chain you selected.
4. The address and Show QR are on this page. Do not copy the address into a chat or a note.
5. A coin that has not confirmed yet is waiting for its first confirmation. It is not spendable on Balance until it confirms.
6. Lightning on this page is a separate request. Press Lightning, type an amount, and press Ask for a payment request. Those sats arrive on the Lightning node, not as an on-chain coin in Balance.

### 22. Send

**Spend:** Broadcast this payment.

1. Open Send.
2. Press XBT, BTC, or XBTC.
3. Type the destination and the amount in sats.
4. A silent-payment code needs your own node. A normal address can use Autarki's server.
5. Press Prepare payment. That sets the exact total. Nothing is sent. The wallet password opens this computer. Prepare does not sign.
6. Read the destination, the amount, and the miner fee.
7. Press Sign on this computer.
8. **Spend:** Press Broadcast this payment. That is the spend.
9. Cancel this payment drops it before broadcast.

### 23. Balance

1. Open Balance.
2. Press XBT, BTC, or XBTC. Each figure is confirmed coins on that chain.
3. Lightning is a separate jar. It is not added to these three figures.
4. To move coins into Lightning, open the Lightning card for that chain. Press Show the node's address, type how many sats, and press Fill Send with this amount.
5. That fills Send. Press Prepare payment, then Sign on this computer, then Broadcast this payment. **Spend:** Broadcast this payment.
6. Those coins leave Balance and wait for one confirmation before they can open a channel or pay Lightning.

On Balance, Prepare the transfer is the same idea when the page is already asking for a move. It fills the payment. Broadcast is still the spend.

### 24. Open a channel

The buyer opens it. The seller does not fund it.

1. Coins have to be confirmed in the Lightning node’s own wallet. [Procedure 23](https://autarki.app/guide#balance) puts them there. Balance itself cannot open the channel.
2. On a purchase that needs a channel, press Use Autarki Pool or Use Shop Channel. A classified seller uses Use Seller Channel for the direct path.
3. The pool is one channel that can pay many shops that already have incoming room. The routing fee cap is 1,000 sats. A direct channel has no pool fee and pays only that shop or that seller.
4. The first opening waits about ten minutes for one confirmation. A later payment on a channel that can cover the amount does not.
5. Adding room waits for one confirmation.
6. Paying a pool fee, including Pay 1,200 sats for Blake2b pool room or the Bitcoin room button, only fills Send. Nothing is sent until Prepare payment, then Broadcast this payment. **Spend:** that broadcast. The page does not open the room by itself.
7. Open a channel, the form under the Lightning card, is for a node whose public name you already have. Do not type a shop or a customer into that form. A purchase does not use it.

### 25. Pay the other coin

A Lightning invoice in the other coin spends the coin this wallet already holds. XBT can pay a BTC Lightning invoice. BTC paying an XBT invoice stays hidden while that side cannot send.

1. Open Send.
2. Press the chain this wallet will spend.
3. Press Lightning.
4. Paste the payment request, or press Scan payment request.
5. Read the amount. If the other coin can pay it, the button reads Pay with the other coin and then names the amount in the coin this wallet holds.
6. The line under it includes the pool fee. That fee is 1.5 percent. Read the amount and the fee before you continue.
7. **Spend:** Press that pay button. That press sends.
8. If it cannot finish, it is not sent. Do not press it again until you know the first one did not leave.

## Mining and the person

### 26. Hire a rig

**Spend:** Pay to start, or Pay to keep. Mine itself does not spend.

1. Open a RouteHash account. On Mining, or under Settings, then Other, paste the API token and press Connect RouteHash. The token stays on this computer. Do not paste it into a note.
2. Open Mining.
3. Mine XBT hires a listed Blake2b rig and is paid in XBT. Mine BTC hires a listed SHA-256 rig and is paid in BTC.
4. Press Mine XBT or Mine BTC. Nothing is spent. The card writes a Lightning invoice for accepted shares and waits.
5. **Spend:** Read the invoice. Press Pay to start. That pays the invoice from this wallet. Pay to keep extends a hire the same way.
6. **Spend:** Hours from balance uses the confirmed balance for the rig’s minimum time. Nothing is spent until you confirm those hours.
7. Rewards come back to the next address in this wallet. Spendable coins stay on Balance after 100 confirmations on BTC, or 4320 on XBT. The mining card is not a second balance.
8. If the invoice expires, the payment was not sent. Press Mine again for a new invoice.

Procedures 27 through 29 do not create an order and do not move coins. Do not paste a public name, the Discord sentence, or a message into a note.

### 27. Profile, contacts, and a message

The published name is what a shop sees on an order. A contact is a public key you follow. A message is a private note to that person.

1. Open the wallet if it is locked. Press Open wallet once. Later steps on this page do not ask again.
2. Open Settings, then Nostr. Profile is the first chip.
3. Under Your Nostr key, press Show your public key. Leave Show the secret closed. Do not copy that name into a note.
4. Under Your profile, press Read your profile. The page checks the relays it already reads before it writes. A relay that does not answer is not an empty profile. The name fields stay hidden until that read finishes.
5. Type the name. About and Picture are optional. Picture is an https link. Fields you do not edit stay on the note.
6. Press Publish profile. That is the published name.
7. Open Contacts. Opening this chip reads the list. An empty list says “No contacts yet.” A published name is shown when one of those relays has it.
8. To add someone by hand, paste their public name into Public name and press Add to contacts. The field placeholder starts with npub1. Do not paste that name into a note.
9. On a person already listed, the row has Message. A person who is not a contact yet has Add to contacts. A person who is a contact has Unfollow. Block adds that key to the mute list. Unblock removes it there. A blocked key reads “This key is blocked.” Unfollow, Block, and Unblock do not pay anyone and do not change a shipment.
10. The same Add to contacts sits on the name row of an order card and of a referee card. Message sits beside that name.
11. Press Message. The sheet title is Message. Type the note. The limit is 1,000 characters. Press Send.
12. If you opened Message from an order, About this order can appear beside Send. That attaches the note to the order that is already open. It does not create a second order.
13. Press Back to leave the sheet.
14. Stop. A message does not create an order, move coins, or change a shipment.

### 28. Discord link

This wallet does not join Discord. Publishing replaces the previous link. The username then shows beside the public name.

1. Finish step 3 of [procedure 27](https://autarki.app/guide#profile) so this wallet has shown its public key. Copy the sentence stays hidden until then.
2. Open Settings, then Nostr, then Discord.
3. Read the sentence on the page. It includes the public name. Press Copy the sentence.
4. Paste that sentence into the Discord server as a message. Do not paste it into a note here.
5. In Discord username, type the name under the display name. A leading @ is dropped. A User ID is not that name.
6. In Message link, paste the link of that Discord message. The field starts with https://discord.com/channels/.
7. Press Publish Discord link.
8. On a stall, an ad, or a name row, the username shows beside the public name as “Discord” plus that username. A person in that server can open the message. A person outside that server still sees the ad and cannot open the message.
9. Publishing again replaces the previous link. A tag for another site already on that note is kept. The shop and the classified stay public.
10. Press Remove to drop the link. That does not move coins.

### 29. Backup and the page

Save a copy writes the shop book to a file. It does not back up the 24 words or the Lightning channel. Page contrast stays in this browser.

1. Open Settings, then Other.
2. Under Backup, press Save a copy. Save the file on this computer or a drive.
3. The file keeps the profile, the contact list, the mute list, the relay list, the Discord link, vouches, and shipment receipts this wallet has already published.
4. The file leaves out the 24 words, the wallet file, a secret key, a macaroon, and a node password. It does not hold the Lightning channel. That state stays on the Lightning node. The 24 words do not bring the shop book back.
5. The stall, each product, and each classified are already public notes on the Nostr node. Anyone can read them. They are not an encrypted copy of this computer. The orders, the catalog counts, the taxes, the clerks, and the drafts stay on this computer. Publish this shop, or publish a classified, sends those notes to the current node. This wallet does not send the shop book to the shared node.
6. Press Bring a copy back only when you mean to replace the shop files named in that file. Choose the file. Page contrast is not in the file, so this step does not change Paper, Ink, or Console.
  - Paper keeps this page.
  - Ink is light text on black.
  - Console is green on black.

7. Under Page contrast, press one of these. The choice stays in this browser:
8. Language, on the same Other page, is English, Español, Português, Français, or Deutsch. This browser asks once, the first time it opens the page. The choice stays on this browser. It does not change the 24 words, the shop book, or the dollar hint.

That is the end of the 29 procedures.
