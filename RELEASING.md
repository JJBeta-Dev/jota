# Releasing Jota

The four published packages are `jota-js`, `vite-plugin-jota`, `jota-guard` and `create-jota-js`. They share one version number and are released together. Until the first real release, npm only has `0.0.1` name placeholders.

`scripts/release.mjs` does the checking and packing; **you** do the publishing, because npm asks for a browser confirmation (Windows Hello PIN) for every package.

## 1. Check (changes nothing)

```bash
pnpm release:check
```

Installs from the lockfile, builds, typechecks, runs every test, packs the four packages with pnpm (which rewrites `workspace:*` ranges to real versions) and verifies each tarball: correct name, no `workspace:` left, the built files and README present, no `src` or `test` folders.

## 2. Prepare the version

```bash
node scripts/release.mjs prepare 1.0.0
```

Sets the version of the four packages, repeats the checks, and leaves the tarballs in `release/` (ignored by git). Then update `CHANGELOG.md` (move the entries under the new version with a date) and commit:

```bash
git add -A
git commit -m "chore: release 1.0.0"
```

## 3. Publish (normal terminal, not an AI session)

```bash
npm login
node scripts/release.mjs publish
```

It publishes the tarballs in order (runtime, plugin, guard, scaffolder). Each one opens the browser for confirmation. If one fails, fix it and run `publish` again: packages already published report that the version exists and can be skipped by publishing the rest by hand with `npm publish release/<file>.tgz --access public`.

## Alternative: publish from GitHub Actions

`.github/workflows/release.yml` publishes the four packages, with provenance, whenever a tag such as `v1.0.0` is pushed. It needs one setup on npmjs.com, once: either **trusted publishing** for each of the four packages (Settings, Trusted publisher, GitHub Actions, repository `JJBeta-Dev/jota`, workflow `release.yml`), or a repository secret `NPM_TOKEN` holding a granular access token allowed to publish them. Then:

```bash
node scripts/release.mjs prepare 1.0.0   # sets the versions and checks the tarballs
git add -A && git commit -m "chore: release 1.0.0"
git tag v1.0.0 && git push --follow-tags
```

The workflow stops early if a tag does not match the package versions. It has not been run yet, so expect to adjust it the first time.

## 4. After publishing

```bash
git tag v1.0.0
git push --follow-tags
```

Then check `npx jota-guard --version` and `npm create jota-js@latest test-app` in an empty folder: the generated project depends on `^1.0.0` of the three packages, so it only installs once they are published.

## Notes

- The repository is private until you make it public: `gh repo edit JJBeta-Dev/jota --visibility public --accept-visibility-change-consequences`.
- `npm publish --provenance` only works from GitHub Actions with `id-token: write`; a manual release does not have provenance. Adding a release workflow with provenance is a possible later step.
- The project's top-level `package.json` stays at `1.0.0` and is private; only the four packages get published.
