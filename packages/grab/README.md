# ui-grab

UI context picker for coding agents with built-in `Shift + click` multi-select.

<p align="center">
  <a href="https://www.npmjs.com/package/ui-grab"><img alt="npm version" src="https://img.shields.io/npm/v/ui-grab?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/ui-grab"><img alt="npm package" src="https://img.shields.io/badge/npm-ui--grab-cb3837?style=flat-square" /></a>
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-97ca00?style=flat-square" /></a>
</p>

---

Project documentation is maintained in English only.

`ui-grab` is an independent fork of the MIT-licensed `react-grab` project. It keeps the upstream prompt UI and comment history flow, adds built-in `Shift + click` multi-select, and ships a separate MCP bridge so browser context picking can stay lightweight by default.

## Packages

- `ui-grab`: runtime, CLI, and public exports for `ui-grab/core`, `ui-grab/primitives`, and `ui-grab/styles.css`
- `ui-grab-mcp`: optional MCP bridge for editor and agent integrations

Published package names use hyphens: `ui-grab` and `ui-grab-mcp`.

## Install

```bash
npx ui-grab@latest init
pnpm add -D ui-grab

# npm
npm install -D ui-grab

# Optional MCP bridge
pnpm add -D ui-grab-mcp
npm install -D ui-grab-mcp
```

Do not use `uigrab` or `uigrab-mcp` without hyphens. The published package names are `ui-grab` and `ui-grab-mcp`.

## Quick Start

1. Run `npx ui-grab@latest init` inside your project.
2. Start your app in development mode.
3. Enable the floating toolbar.
4. Hover an element and press `Cmd+C` or `Ctrl+C` to copy a single element.
5. Hold `Shift` and click multiple elements to build a grouped selection.
6. Release `Shift`, type into the prompt textarea, and submit.

## Optional MCP Bridge

Install the bridge only if you want agent tooling to consume UI Grab payloads directly.

```bash
pnpm add -D ui-grab-mcp
npx ui-grab@latest add mcp
```

## Do I need `ui-grab-mcp`?

Most projects do not.

- If you only want the in-browser picker, install `ui-grab` and stop there.
- If you want Codex, Cursor, Claude Code, OpenCode, or another MCP-capable agent to read the latest picked UI context, enable the MCP bridge.
- `ui-grab add mcp` writes agent config files that run `ui-grab-mcp` over `npx`.
- A project-local `ui-grab-mcp` install is optional. It is useful when you want to pin the exact MCP version inside a repo or run the server locally yourself.

If you already installed `ui-grab` manually with `npm install -D ui-grab`, `npx ui-grab@latest init` will still configure your project.

## Manual Setup

### Next.js (App Router)

```tsx
import Script from "next/script";

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="https://unpkg.com/ui-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body>{props.children}</body>
    </html>
  );
}
```

### Next.js (Pages Router)

```tsx
import Script from "next/script";
import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="https://unpkg.com/ui-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

### Vite

```tsx
if (import.meta.env.DEV) {
  import("ui-grab");
}
```

### Webpack

```tsx
if (process.env.NODE_ENV === "development") {
  import("ui-grab");
}
```

## Package Surface

- Runtime entry: `ui-grab`
- Core API: `ui-grab/core`
- Primitives: `ui-grab/primitives`
- Stylesheet: `ui-grab/styles.css`
- CLI: `ui-grab`
- MCP bridge: `ui-grab-mcp`

## Verification

- Published packages: [`ui-grab`](https://www.npmjs.com/package/ui-grab), [`ui-grab-mcp`](https://www.npmjs.com/package/ui-grab-mcp)
- Recommended local checks:

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm test
npm publish ./packages/grab --dry-run --access public
npm publish ./packages/mcp --dry-run --access public
```

## Support

- Repository: [Yongtaek-Ryu/ui-grab](https://github.com/Yongtaek-Ryu/ui-grab)
- Issues: [GitHub Issues](https://github.com/Yongtaek-Ryu/ui-grab/issues)
- Upstream reference: [aidenybai/react-grab](https://github.com/aidenybai/react-grab)

## License

UI Grab is distributed under the MIT license. Keep the original copyright notice and license text when redistributing forked code.
