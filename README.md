# Autarki website

Static marketing site for [autarki.app](https://autarki.app). The published files are in `site/`. There is no build step and no server-side runtime.

Claims follow `autarki-marketing-brief.md`. That brief is not part of the published site.

## Preview locally

From this directory:

```bash
python3 -m http.server 8080 -d site
```

Open http://127.0.0.1:8080/

Paper is the default contrast. Ink and Console stay in this browser.

## Cloudflare Pages

Connect the Git repository in the Cloudflare dashboard. Do not put an API token, account id, or other secret in this repo.

- Framework preset: None
- Build command: empty
- Build output directory: `site`

After the first deploy, add the custom domain `autarki.app` in the Cloudflare dashboard.

`wrangler.toml` only names the Pages project and the output directory. It does not contain credentials. `site/_headers` sets a few response headers. Cloudflare Pages reads that file from the output directory.
