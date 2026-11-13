# Contributing to Jota

Thank you for helping. Jota is small on purpose, so small, focused pull requests are the easiest to review.

## Set up

```bash
corepack enable
pnpm install
pnpm -r build
pnpm install        # second time: creates the jota-guard and create-jota-js commands
pnpm -r typecheck
pnpm -r test
pnpm lint
```

Node 20 or newer. Windows and Linux are both tested in CI.

## Where things live

| Folder | Package | What it is |
|---|---|---|
| `packages/core` | `jota-js` | signals, DOM runtime, router, islands, hydration, server rendering |
| `packages/guard` | `jota-guard` | accessibility and semantics rules (ESLint plugin and CLI) |
| `packages/vite-plugin` | `vite-plugin-jota` | JSX compiler and the static build |
| `packages/create-jota` | `create-jota-js` | project scaffolder |
| `site` | | the docs site, built with Jota |
| `examples`, `bench` | | sample projects and benchmarks |

## A good first contribution: a Guard rule

1. Describe the rule in `docs/guard-rules.md` first (what it reports, what it accepts, the WCAG criterion).
2. Add `packages/guard/src/rules/<id>.ts` with `createRule`, and register it in `index.ts` and `presets.ts`.
3. Add `packages/guard/test/<id>.test.ts` with valid and invalid cases. A rule that flags correct code is worse than no rule: include the valid patterns that look similar.
4. Only add a fix (`fixable: true`) when the repair cannot change meaning. Never generate accessible text.

## Rules of the repository

- Comments are JSDoc blocks only (`/** ... */`). `pnpm lint` checks it.
- Every change comes with tests. Anything visible is checked in a real browser.
- Numbers in the README or the docs must come from a script in this repository that anyone can run.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `perf:`, `docs:`, `chore:`).
- A new Guard rule or a stricter level is a minor version, because it can fail an existing build.

## Reporting a false positive

A Guard rule that reports valid code is a bug. Open an issue with the smallest JSX that shows it.

Spanish is welcome in issues and discussions. / Puedes escribir en español.
