# Install

> Lightning for XBT and for BTC is in the AMD and Intel StartOS package, the Ubuntu image, the Umbrel amd64 image file, and Android. The Umbrel community store, a Raspberry Pi, and Umbrel arm64 leave Lightning off.

The page is [https://autarki.app/install](https://autarki.app/install).

## Install it on your computer.

13 November 2026. Lightning for XBT and for BTC is in the AMD and Intel StartOS package, the Ubuntu image, the Umbrel amd64 image file, and Android. The Umbrel community store, a Raspberry Pi, and Umbrel arm64 leave Lightning off. On-chain still works there.

- StartOS on AMD or Intel uses `autarki_x86_64.s9pk`. This release is 0.1.0:41. Lightning is included: Blake2b Lightning and SHA-256 Lightning.
- StartOS on a Raspberry Pi uses `autarki_aarch64.s9pk`. Lightning is off. The wallet, the shop, and on-chain payment still run.
- The Umbrel amd64 image file is on release 0.1.0, the same page as the Ubuntu image. Lightning is included.
- The Umbrel community store listing is 0.1.24. That listing leaves the Lightning programs out. On-chain still works. The store is not the official Umbrel App Store.
- Umbrel on arm64, including a Raspberry Pi, leaves Lightning off. On-chain still works.
- Ubuntu with Docker uses `autarki_ubuntu_amd64.tar`. Lightning is included. It is the AMD or Intel build.
- The public download is [release 0.1.0](https://github.com/RouteHash-com/autarki/releases/tag/0.1.0). Source is [github.com/RouteHash-com/autarki](https://github.com/RouteHash-com/autarki).
- Install starts the wallet. It does not open a Lightning channel.
- Add the RouteHash community store, then install Autarki. The listing is [github.com/RouteHash-com/umbrel-store](https://github.com/RouteHash-com/umbrel-store). That listing is 0.1.24 and leaves Lightning out. The amd64 image file on release 0.1.0 is a separate file, and Lightning is in it.
- Check the download with `SHA256SUMS` from that same release: `sha256sum -c SHA256SUMS --ignore-missing`.
- Bug reports go to [Discord #autarki](https://discord.gg/VBxvzQXvt). The [support page](https://autarki.app/support.md) is that contact. The [privacy policy](https://autarki.app/privacy.md) covers the keys, the camera, location, relays, and nodes.
- The wallet page can show English, Español, Português, Français, or Deutsch. The 24 words stay the English list. Amounts stay in sats.

## Android

Version 0.1.0 (29) is the same program as the computer. The phone needs a 64-bit processor and Android 8 or newer. It keeps its own wallet file. Restoring the 24 words onto the phone makes a second copy. The same 99 digits do not rebuild a wallet. This phone adds its own randomness. The 24 words shown once are the only backup.

Download [autarki-android.apk](https://github.com/RouteHash-com/autarki/releases/download/0.1.0/autarki-android.apk) from release 0.1.0 and allow the phone to install it. Check that file against `SHA256SUMS` from the same release. This file installs over the previous signed 0.1.0 package. A phone that already has 0.1.0 (1) has to uninstall that copy before this one will install. There is no Play Store listing to announce. Or [request access](https://appdistribution.firebase.dev/i/2ae8a6c81ce866a4). Sign in with a Google account. Firebase emails the install.

Lightning for Blake2b XBT bitcoin and SHA-256 BTC bitcoin is in this package. A phone that only opens your computer's page holds no seed. That path is still there.

## iPhone

Version 0.1.0, build 8, is the same wallet and shop. It keeps its own wallet file. Restoring the 24 words onto the phone makes a second copy.

This build does not start Lightning. Use other Autarki Lightning nodes stays on, for another Autarki that stays running.

It is not an App Store listing. Join the public TestFlight test from this page: [https://testflight.apple.com/join/2WMBzSpM](https://testflight.apple.com/join/2WMBzSpM). Install TestFlight, then open that link.

XBT Knots and Bitcoin Core do not run on the same computer. A Lightning payment runs where Lightning starts. A shipment runs there too. Mine needs AMD or Intel.
