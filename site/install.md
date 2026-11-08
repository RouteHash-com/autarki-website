# Install

> Install Autarki on your computer. AMD and Intel include Lightning. A Raspberry Pi leaves Lightning off. A 64-bit Android phone can install its own copy.

The page is [https://autarki.app/install](https://autarki.app/install).

## Install it on your computer.

AMD and Intel include Lightning. A Raspberry Pi runs the wallet, the shop, Nostr, and on-chain payment, and leaves Lightning off. A 64-bit Android phone can install the same program and keep its own wallet.

- StartOS on AMD or Intel uses `autarki_x86_64.s9pk`. Lightning is included: Blake2b Lightning and SHA-256 Lightning.
- StartOS on a Raspberry Pi uses `autarki_aarch64.s9pk`. Lightning is off. The wallet, the shop, and on-chain payment still run.
- Umbrel on AMD or Intel uses the image from the RouteHash community store. Lightning is included.
- Umbrel on arm64, including a Raspberry Pi, leaves Lightning off.
- Ubuntu with Docker uses `autarki_ubuntu_amd64.tar`. Lightning is included. It is the AMD or Intel build.
- The public download is [release 0.1.0](https://github.com/RouteHash-com/autarki/releases/tag/0.1.0). Source is [github.com/RouteHash-com/autarki](https://github.com/RouteHash-com/autarki).
- Install starts the wallet. It does not open a Lightning channel.
- This site does not give you an Umbrel file. Add the RouteHash community store, then install Autarki. That store is not the official Umbrel App Store. The listing is [github.com/RouteHash-com/umbrel-store](https://github.com/RouteHash-com/umbrel-store).
- Check the download with `SHA256SUMS` from that same release: `sha256sum -c SHA256SUMS --ignore-missing`.
- Bug reports go to [Discord #autarki](https://discord.gg/VBxvzQXvt). The [support page](https://autarki.app/support.md) is that contact. The [privacy policy](https://autarki.app/privacy.md) covers the keys, the camera, location, relays, and nodes.
- The wallet page can show English, Español, Português, Français, or Deutsch. The 24 words stay the English list. Amounts stay in sats.

## Android

Version 0.1.0 (3) is the same program as the computer. The phone needs a 64-bit processor and Android 8 or newer. It keeps its own wallet file. Restoring the 24 words onto the phone makes a second copy.

Download [autarki-android.apk](https://github.com/RouteHash-com/autarki/releases/download/0.1.0/autarki-android.apk) from release 0.1.0 and allow the phone to install it. Check that file against `SHA256SUMS` from the same release. A phone that already has 0.1.0 (1) has to uninstall that copy before this one will install. The StartOS and Umbrel packages on release 0.1.0 were left as they were. Or [request access](https://appdistribution.firebase.dev/i/2ae8a6c81ce866a4). Sign in with a Google account. Firebase emails the install.

This package does not include Lightning. The page still offers it, and it stays closed until a node is connected. A phone that only opens your computer's page holds no seed. That path is still there.

This build was checked on an emulator. It has not been checked on a handset yet.

XBT Knots and Bitcoin Core do not run on the same computer. Mine, a Lightning payment, and a shipment need AMD or Intel.
