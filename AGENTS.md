# SQL Snippet Master – Agent Guide

## What this project is

VS Code / Cursor extension: **SQL Snippet Master**. Sidebar webview for AI-powered SQL snippet management (safety checks, dbt export, semantic search). Extension host is TypeScript (`extension.ts`); the UI is a React app bundled with Vite and loaded as a single script in the webview.

## Building

**Preferred: use the Makefile and Dockerfile.**

- **Full build and package (produces VSIX):**
  ```bash
  make package
  ```
  Builds the Docker image (runs `npm run build` and `npm run build:webview`), then runs the container to execute `vsce package`. Output: `output/extension.vsix`.

- **Build Docker image only (no VSIX):**
  ```bash
  make build
  ```
  Same as `docker build -t vscode-extension-build .`.

**Local build (no Docker):**

- Extension host: `npm run build` (tsc → `out/extension.js`).
- Webview: `npm run build:webview` (vite build → `dist/index.js`).
- Both (what prepublish runs): `npm run build && npm run build:webview`.
- Package locally: `npm run package` (runs prepublish then `vsce package`).

## Key paths

| Path | Purpose |
|------|--------|
| `extension.ts` | Extension entry; registers webview view provider, serves HTML that loads `dist/index.js`. |
| `out/extension.js` | Compiled extension (from `tsc -p .`). |
| `dist/index.js` | Bundled webview app (from `vite build`). Must exist for the sidebar view to show content. |
| `index.tsx`, `App.tsx`, `components/`, `services/` | React webview source. |
| `vite.config.ts` | Vite config; build entry `index.tsx`, output single file to `dist/index.js`. |
| `package.json` | `vscode:prepublish` runs `build` + `build:webview`. |

## Running / testing

- Install the VSIX from `output/extension.vsix` (after `make package`) or from a locally produced `.vsix`.
- In the activity bar, open the **SQL Master** view to load the webview.
- Tests: `npm test` (tsx cli-test-runner.ts; may require API key env for AI tests).

## CI

- `.github/workflows/package.yml`: on push to main/master, install deps and run `npx vsce package` (prepublish runs both builds).
- `.github/workflows/build-and-pack-extension.yml`: on release, runs `make` and uploads `output/extension.vsix`.
