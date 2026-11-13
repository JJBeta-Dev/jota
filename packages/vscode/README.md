# Jota Guard for VS Code

Shows [Jota Guard](https://github.com/JJBeta-Dev/jota/tree/main/packages/guard) problems in `.tsx` and `.jsx` files when you open or save them: images without alt text, clickable `<div>`s, inputs without a label, invalid ARIA and the rest of the rules. Works in any JSX project (Jota, React, Solid, Preact).

## Requirements

Install Jota Guard in the project: `npm install -D jota-guard`. The extension runs the copy in your `node_modules`, so the editor and your build always agree. Settings come from `jota.config.json`.

## Commands

- **Jota Guard: Check this file**
- **Jota Guard: Fix what is safe in this file** (removes redundant roles, `autofocus` and `accesskey`; it never invents accessible text)

Every problem links to the rule's documentation.

## Settings

- `jotaGuard.enable`: check files on open and save (default: on).
- `jotaGuard.preset`: `recommended`, `strict` or `a11y-only`. Empty uses your config file.

## Install from a file

```bash
cd packages/vscode
npm run package
code --install-extension jota-guard-vscode-1.2.0.vsix
```
