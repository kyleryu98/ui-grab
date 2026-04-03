# Design

## MCP Packaging

The MCP browser client only needs a narrow structural contract from the runtime API. Importing those types from `ui-grab/core` forced the package build to depend on runtime build artifacts and encouraged package manifest rewriting during publish flows.

To remove that coupling:

- define a local contract file for the browser client types;
- bundle the client directly with `tsup`;
- verify both the source manifest and packed manifest with tests.

## Workspace Consistency

`main` currently contains both legacy `react-grab` and newer `@ui-grab/runtime` workspace packages. The install failure came from `@ui-grab/runtime` referencing `@ui-grab/cli` while only `@react-grab/cli` exists on this branch history. The safe fix is to align that dependency with the package that actually exists on `main`, without broad renaming work.

## CI Guardrails

CI should fail fast and deterministically when the lockfile or package manifests drift. `pnpm install --frozen-lockfile` provides that guarantee, and explicit MCP tests ensure the packaging contract remains stable.
