# Install

> Install Autarki on your computer. AMD and Intel include Lightning. A Raspberry Pi leaves Lightning off. A 64-bit Android phone can install its own copy. An iPhone can request a TestFlight invite.

The page is [https://autarki.app/install](https://autarki.app/install).

## Install it on your computer.

AMD and Intel include Lightning. A Raspberry Pi runs the wallet, the shop, Nostr, and on-chain payment, and leaves Lightning off. A 64-bit Android phone can install the same program and keep its own wallet.

- StartOS on AMD or Intel uses `autarki_x86_64.s9pk`. This release is 0.1.0:31. Lightning is included: Blake2b Lightning and SHA-256 Lightning.
- StartOS on a Raspberry Pi uses `autarki_aarch64.s9pk`. This file is still the previous page. Lightning is off. The wallet, the shop, and on-chain payment still run.
- Umbrel on AMD or Intel uses the image from the RouteHash community store. The listing is 0.1.19. Lightning is included.
- Umbrel on arm64, including a Raspberry Pi, is still the previous page and leaves Lightning off.
- Ubuntu with Docker uses `autarki_ubuntu_amd64.tar`. Lightning is included. It is the AMD or Intel build.
- The public download is [release 0.1.0](https://github.com/RouteHash-com/autarki/releases/tag/0.1.0). Source is [github.com/RouteHash-com/autarki](https://github.com/RouteHash-com/autarki).
- Install starts the wallet. It does not open a Lightning channel.
- This site does not give you an Umbrel file. Add the RouteHash community store, then install Autarki. That store is not the official Umbrel App Store. The listing is [github.com/RouteHash-com/umbrel-store](https://github.com/RouteHash-com/umbrel-store).
- Check the download with `SHA256SUMS` from that same release: `sha256sum -c SHA256SUMS --ignore-missing`.
- Bug reports go to [Discord #autarki](https://discord.gg/VBxvzQXvt). The [support page](https://autarki.app/support.md) is that contact. The [privacy policy](https://autarki.app/privacy.md) covers the keys, the camera, location, relays, and nodes.
- The wallet page can show English, Español, Português, Français, or Deutsch. The 24 words stay the English list. Amounts stay in sats.

## Android

Version 0.1.0 (17) is the same program as the computer. The phone needs a 64-bit processor and Android 8 or newer. It keeps its own wallet file. Restoring the 24 words onto the phone makes a second copy. The same 99 digits do not rebuild a wallet. This phone adds its own randomness. The 24 words shown once are the only backup.

Download [autarki-android.apk](https://github.com/RouteHash-com/autarki/releases/download/0.1.0/autarki-android.apk) from release 0.1.0 and allow the phone to install it. Check that file against `SHA256SUMS` from the same release. This file installs over the previous signed 0.1.0 package. A phone that already has 0.1.0 (1) has to uninstall that copy before this one will install. Or [request access](https://appdistribution.firebase.dev/i/2ae8a6c81ce866a4). Sign in with a Google account. Firebase emails the install.

Lightning for Blake2b XBT bitcoin and SHA-256 BTC bitcoin is in this package. A phone that only opens your computer's page holds no seed. That path is still there.

## iPhone

Version 0.1.0, build 4, is the same wallet and shop. It keeps its own wallet file. Restoring the 24 words onto the phone makes a second copy.

This build does not start Lightning. Use other Autarki Lightning nodes stays on, for another Autarki that stays running.

It is not on the App Store. Enter your email on [the install page](https://autarki.app/install) and request an invite. The request goes to apple@autarki.app with the subject Apple Autarki Tester Request. Install TestFlight, then open the invite when it arrives.

XBT Knots and Bitcoin Core do not run on the same computer. A Lightning payment runs on AMD or Intel, and in Android 0.1.0 (17). Mine and a shipment need AMD or Intel.
