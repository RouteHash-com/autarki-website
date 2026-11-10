# Privacy. Autarki

> The 24 words stay on your device. The camera scans a code. Location fills the shop. The page talks to relays and nodes.

This policy covers the Autarki program and this site. It is dated 10 November 2026. This page is [https://autarki.app/privacy](https://autarki.app/privacy).

## The 24 words

You hold the 24 words. They stay on the device that created the wallet, or on a device where you restored them. Restoring the 24 words onto a phone makes a second copy. A password is optional. It is not part of the 24 words.

The phone keeps its wallet file in the app's private storage. That file is not included in Android backup. A phone that only opens your computer's page holds no seed. The wallet file stays on that computer.

This site does not sign in. It does not ask for the 24 words, and it cannot recover them.

The wallet's 24 words are not given to a Lightning node. The Android package includes Lightning for Blake2b XBT bitcoin and SHA-256 BTC bitcoin. The iPhone build does not start Lightning. On that build, Use other Autarki Lightning nodes stays on.

## The camera

The phone asks for the camera with these words: "The page uses the camera to scan a code."

The notice board on this site can ask for the camera for that same scan. The picture is read on the device. It is not saved, and it is not sent to Autarki. You can refuse. When the camera does not open, the page can read a code from a photo you choose.

## This phone's place

The phone asks for this phone's place with these words: "The page uses this phone's place to fill the shop."

On Android the program can ask for an approximate place and a precise place. Neither is required to open the app. The page asks only when you press Use my location, on the shop or on a classified.

The position is not saved. It is not sent to Autarki. The page sends the coordinates to [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/), which returns a city and a region. If the device shares no coordinates, and you did not refuse, the page asks [geojs.io](https://www.geojs.io/) for a city from the network address. A refused prompt stops there.

A city you then save can be published with the stall or the classified. The published line is that place name. The notice board on this site does not ask for a place.

## Relays

The wallet talks to Nostr relays. A stall, a product, and a classified are public notes. Anyone who can read that relay can read them. An order is a private note. The relay cannot read it.

Until a shop names its own relays, the wallet uses Autarki's relay. A shop can name other relays. This site's notice board asks Autarki's relay, shows what came back, and closes. It does not follow a shop onto another relay, and it stores nothing.

The classifieds page publishes a note when a Nostr extension in this browser signs it. The key stays in that extension. This site does not ask for the key and does not keep the note. The note is public on the relay the notice board reads.

A relay sees the connection from your device, including the network address, and the notes published there. Autarki does not take the order.

## Nodes

A payment is signed on your device for XBT or for BTC. The node you use, and the node that is paid, see that payment. A silent payment code is made on your device. Autarki does not make that code and does not see a coin paid to it.

Lightning on a computer can open a channel to the Autarki LSP or to one shop's node. That peer sees the channel. The LSP does not hold the sale and does not take a cut of the catalog price.

Mining talks to [RouteHash](https://routehash.com) after you paste a token and confirm Mine XBT or Mine BTC. Nothing is spent until that confirmation. The next reward address is your wallet's.

## This site

This site does not keep an account. Paper, Ink, and Console stay in this browser. The wallet page on this site reads a public exchange quote for the dollar hint. That request carries no wallet data.

Cloudflare serves autarki.app and can see an ordinary request: the address, the page, and the time. There is no advertising and no tracking across other sites.

A tester install is offered through Firebase. That sign-in is Google's. The phone app does not include the Firebase library.

The iPhone test is Apple's public TestFlight link. This site does not take an email for it.

The page can ask to show a notice when something arrives. You can refuse. The notice is drawn on the device.

## Children

Autarki is not directed at children.

## Removing it

Delete the wallet file on that device to remove the keys from it. Uninstalling the phone app removes the copy in that app's private storage. A note already accepted by a relay can remain there. Autarki cannot pull a public note off a relay you do not run. This site has no account to delete.

## Changes and contact

A later version of this policy replaces this page, and the date at the top changes with it. Help and the contact are on the [support page](https://autarki.app/support.md).
