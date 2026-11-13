# Security policy

## Supported versions

The latest minor version of each package (`jota-js`, `jota-guard`, `vite-plugin-jota`, `create-jota-js`) receives security fixes.

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private report: **Security > Report a vulnerability** on https://github.com/JJBeta-Dev/jota. You will get an answer within 7 days.

Useful to include: the package and version, a minimal example, and what an attacker could do.

## What counts

- HTML or script injection through `renderToString`, the static build or the DOM runtime when values come from data (text and attributes are expected to be escaped).
- Anything in the build tooling that runs code or writes files outside the project.
- Problems in how the packages are published.
