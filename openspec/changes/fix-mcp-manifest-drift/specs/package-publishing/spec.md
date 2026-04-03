## ADDED Requirements

### Requirement: MCP source manifests remain workspace-safe

The source manifest for `ui-grab-mcp` MUST stay valid inside the workspace without requiring publish-time dependency rewrites.

#### Scenario: source build does not rewrite MCP dependencies

- **WHEN** a developer runs the MCP build inside the repository
- **THEN** `packages/mcp/package.json` remains unchanged
- **AND** the build succeeds without adding a direct workspace dependency on `ui-grab`

### Requirement: Packed MCP tarballs must not leak workspace dependencies

Published MCP tarballs MUST contain only publishable dependencies.

#### Scenario: packed manifest excludes workspace-only runtime dependency

- **WHEN** a tarball is created for `ui-grab-mcp`
- **THEN** the packed `package.json` does not include a direct dependency on `ui-grab`

### Requirement: CI must reject manifest drift deterministically

Repository CI MUST install dependencies with a frozen lockfile so manifest drift fails before build and test steps.

#### Scenario: CI install uses the committed lockfile as source of truth

- **WHEN** the CI workflow installs dependencies
- **THEN** it runs `pnpm install --frozen-lockfile`
- **AND** lockfile drift fails the workflow immediately
