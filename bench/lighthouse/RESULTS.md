# Lighthouse results for the docs site

Measured on 2026-11-05 against the production build of `site/` served locally with `vite preview` (no network latency).
Lighthouse 12.8.2 with Microsoft Edge 156 (headless), default mobile emulation and simulated throttling. Categories: performance, accessibility, best practices, SEO.

| Page | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | 100 | 100 | 100 | 100 | 0.8 s | 0.9 s | 0 ms | 0 |
| `/docs/guard/` | 100 | 100 | 100 | 100 | 0.6 s | 0.9 s | 30 ms | 0 |
| `/es/` | 100 | 100 | 100 | 100 | 0.6 s | 0.9 s | 10 ms | 0 |
| `/es/docs/getting-started/` | 100 | 100 | 100 | 100 | 0.6 s | 0.9 s | 0 ms | 0 |

All pages transfer 0 kB of JavaScript.

## Caveats

- This is a local measurement of a small static site. It is not a field measurement and does not prove the same scores on a real host, a slow network, or a bigger site.
- The first run scored SEO 92 because the site had no `robots.txt` (the preview server answered with the home page, which Lighthouse flags as invalid). Adding `site/public/robots.txt` fixed it.
- One early run of `/es/` scored performance 75 with a total blocking time of 1,450 ms on a page with no JavaScript. It did not repeat in later runs; treat single Lighthouse runs as noisy.
- Reproduce: `pnpm --filter jota-site build`, `pnpm --filter jota-site exec vite preview --port 4173`, then `npx lighthouse http://localhost:4173/ --chrome-flags="--headless=new"` with `CHROME_PATH` pointing to a Chromium-based browser.
