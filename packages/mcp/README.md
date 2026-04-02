# ui-grab-mcp

Optional MCP bridge for [ui-grab](https://github.com/Yongtaek-Ryu/ui-grab).

## Install

```bash
pnpm add -D ui-grab-mcp
npm install -D ui-grab-mcp
```

## Use with the UI Grab CLI

```bash
npx ui-grab@latest add mcp
```

`ui-grab add mcp` configures supported agents to run `ui-grab-mcp` via `npx`. That means a project-local install is optional unless you want to pin the version inside a repository or run the MCP server directly from `node_modules/.bin`.

## Exports

- `ui-grab-mcp/client`
- `ui-grab-mcp/server`

## Notes

- `ui-grab-mcp` is published separately so projects that only need the browser picker can install `ui-grab` by itself.
- Match `ui-grab-mcp` with the same `ui-grab` version when possible.
