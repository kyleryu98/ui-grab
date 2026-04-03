# Proposal

## Why

GitHub Actions was failing before tests even started because workspace metadata had drifted in two places:

- `ui-grab-mcp` depended on manifest mutation during packaging, which could leave `package.json` and `pnpm-lock.yaml` out of sync.
- `packages/ui-grab-runtime` pointed at a workspace package name that did not exist on `main`, which caused `pnpm install` to fail immediately.

## What Changes

- Remove the MCP package's need to rewrite its manifest during builds.
- Make the MCP browser client depend on local contract types instead of importing runtime-only package types.
- Keep the runtime workspace dependency aligned with the package that actually exists on `main`.
- Make CI use `pnpm install --frozen-lockfile` and run MCP tests so manifest drift is caught deterministically.

## Impact

- Push and PR checks stop failing during dependency installation for this class of drift.
- MCP packaging becomes source-of-truth driven instead of mutation driven.
- Future manifest drift is caught earlier and with a clearer signal.
