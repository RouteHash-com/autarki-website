# Install

> The buyer pays you, and you keep the keys. One install is the wallet and the shop. Sell at the counter, ship a classified, and hire a rig.

The page is [https://autarki.app/install](https://autarki.app/install).

## Install it on your computer.

24 November 2026. Lightning for XBT and for BTC is in the AMD and Intel StartOS package, the Ubuntu image, the Umbrel amd64 image file, and Android. The Umbrel community store, a Raspberry Pi, and Umbrel arm64 leave Lightning off. On-chain still works there. Prepare payment no longer stops with "The payment was not prepared." Used Lightning addresses stay hidden unless that method is selected. After you broadcast, Spendable here keeps this wallet's own change until the normal balance can be shown. A refused broadcast says why. A mining reward that is too young to send stays out of Spendable here. Choosing the seller opens a direct channel once this Lightning node's own wallet holds the confirmed sats. The confirmation count stays on the Lightning jar. A receive address says which chain it is, and that the text looks like the other chain. A transfer this wallet already sent keeps its confirmation count from the chain.

- StartOS on AMD or Intel (x86_64) uses `autarki_x86_64.s9pk`. This release is 0.1.0:53. Lightning is included: Blake2b Lightning and SHA-256 Lightning.
- StartOS on a Raspberry Pi (aarch64) uses `autarki_aarch64.s9pk`. This release is 0.1.0:53. Lightning is off. The wallet, the shop, and on-chain payment still run.
- The Umbrel amd64 image file is on release 0.1.0, the same page as the Ubuntu image. Lightning is included.
- The Umbrel community store listing is 0.1.36. A wallet from 0.1.35 stays. That listing leaves the Lightning programs out. On-chain still works. The store is not the official Umbrel App Store. In Umbrel, open Settings, then App stores, then Add a community app store. Paste [github.com/RouteHash-com/umbrel-store](https://github.com/RouteHash-com/umbrel-store). Install Autarki.
- Umbrel on arm64, including a Raspberry Pi, leaves Lightning off. On-chain still works.
- Ubuntu with Docker uses `autarki_ubuntu_amd64.tar` (amd64). Lightning is included. It is the AMD or Intel build. The steps are on the [Ubuntu page in the repository](https://github.com/RouteHash-com/autarki/blob/main/ubuntu/README.md).
- The public download is [release 0.1.0](https://github.com/RouteHash-com/autarki/releases/tag/0.1.0). Source is [github.com/RouteHash-com/autarki](https://github.com/RouteHash-com/autarki).
- Install starts the wallet. It does not open a Lightning channel.
- Check the download with `SHA256SUMS` from that same release: `sha256sum -c SHA256SUMS --ignore-missing`.
- Bug reports go to [Discord #autarki](https://discord.gg/VBxvzQXvt). The [support page](https://autarki.app/support.md) is that contact. The [privacy policy](https://autarki.app/privacy.md) covers the keys, the camera, location, relays, and nodes.
- The wallet page can show English, Español, Português, Français, or Deutsch. The 24 words stay the English list. Amounts stay in sats.

## On a phone

A phone on the same network can open your computer's page. That phone holds no seed. Installing the Android app, or the iPhone app, makes its own wallet file. Restoring the 24 words onto the phone makes a second copy. The 24 words are shown once. They are the only backup.

## Android

Version 0.1.0 (80) is the same program as the computer. The phone needs a 64-bit processor and Android 8 or newer. The same 99 digits do not rebuild a wallet. This phone adds its own randomness.

Google Play offers open testing. Join from the Play Store at [https://play.google.com/store/apps/details?id=app.autarki](https://play.google.com/store/apps/details?id=app.autarki), or from the web at [https://play.google.com/apps/testing/app.autarki](https://play.google.com/apps/testing/app.autarki). This install replaces the previous signed 0.1.0 package. A phone that already has 0.1.0 (1) has to uninstall that copy before this one will install.

Lightning for XBT and for BTC comes with this package.

## iPhone

Version 0.1.0, build 22. The same page as the computer and Android packages.

This build does not start Lightning. It uses Lightning on another Autarki that you keep running. Use other Autarki Lightning nodes stays on.

It is not an App Store listing. Join the public TestFlight test from this page: [https://testflight.apple.com/join/2WMBzSpM](https://testflight.apple.com/join/2WMBzSpM). Install TestFlight, then open that link.

XBT Knots and Bitcoin Core do not run on the same computer. A Lightning payment runs where Lightning starts. A shipment runs there too. Mine needs AMD or Intel.
