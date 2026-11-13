# Entry for js-framework-benchmark

`jota/` is a keyed implementation in the format of [krausest/js-framework-benchmark](https://github.com/krausest/js-framework-benchmark), ready to copy to `frameworks/keyed/jota` in a fork of that repository.

It is not submitted yet. Before opening the pull request:

1. Publish `jota-js` and `vite-plugin-jota` 1.2.0 (the entry installs them from npm).
2. In the fork: `cd frameworks/keyed/jota && npm install && npm run build-prod`.
3. From the root of the fork: `npm run bench -- --framework keyed/jota` and `npm run isKeyed -- --framework keyed/jota`.
4. Open the pull request with the results the fork produced, not with numbers from this repository.

In this repository the entry is built and its buttons are exercised in a real browser by `node bench/browser/check-jfb.mjs` (after `pnpm -r build`).
