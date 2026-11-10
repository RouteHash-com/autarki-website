# Autarki website

Static marketing site for [autarki.app](https://autarki.app). The published files are in `site/`. There is no build step. `functions/api/spot.js` is a Pages Function. It reads the public NeoEX price list on the server and returns only the XBT and BTC quotes. The wallet page uses those quotes for the dollar hints. Sats stay the price. `functions/api/iphone.js` accepts an iPhone tester request for apple@autarki.app with the subject Apple Autarki Tester Request. It does not keep the address. Pages rejects an email binding in wrangler.toml, so the function says the request did not send until that binding exists.

Claims follow `autarki-marketing-brief.md`. That brief is not part of the published site.

## Preview locally

From this directory:

```bash
python3 -m http.server 8080 -d site
```

Open http://127.0.0.1:8080/

That server does not run the Pages Functions, so the wallet page keeps the last written dollar hints and the iPhone form cannot send.

Paper is the default contrast. Ink and Console stay in this browser.

The notice board (`site/notice-board.html`) reads public stalls and classifieds in the browser from `wss://165.245.235.36:8444`, then closes the connection. This site does not store those notes and does not take an order.

## Cloudflare Pages

Connect the Git repository in the Cloudflare dashboard. Do not put an API token, account id, or other secret in this repo.

- Framework preset: None
- Build command: empty
- Build output directory: `site`

The `functions` directory stays at the repository root. It is not inside `site`.

After the first deploy, add the custom domain `autarki.app` in the Cloudflare dashboard.

`wrangler.toml` only names the Pages project and the output directory. It does not contain credentials. `site/_headers` sets a few response headers. Cloudflare Pages reads that file from the output directory.
