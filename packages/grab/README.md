<p align="center">
  <a href="https://github.com/Yongtaek-Ryu/ui-grab">
    <img src="https://raw.githubusercontent.com/Yongtaek-Ryu/ui-grab/main/assets/logo.png" alt="UI Grab logo" width="96">
  </a>
</p>
<p align="center">The open-source UI context picker for coding agents.</p>
<p align="center">
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Yongtaek-Ryu/ui-grab/ci.yml?style=flat-square&branch=main" /></a>
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/Yongtaek-Ryu/ui-grab?style=flat-square" /></a>
  <a href="https://github.com/Yongtaek-Ryu/ui-grab"><img alt="GitHub stars" src="https://img.shields.io/github/stars/Yongtaek-Ryu/ui-grab?style=flat-square" /></a>
</p>

<p align="center">
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.md">English</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.zh.md">简体中文</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.zht.md">繁體中文</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.ko.md">한국어</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.de.md">Deutsch</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.es.md">Español</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.fr.md">Français</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.it.md">Italiano</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.da.md">Dansk</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.ja.md">日本語</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.pl.md">Polski</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.ru.md">Русский</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.bs.md">Bosanski</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.ar.md">العربية</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.no.md">Norsk</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.br.md">Português (Brasil)</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.th.md">ไทย</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.tr.md">Türkçe</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.uk.md">Українська</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.bn.md">বাংলা</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.gr.md">Ελληνικά</a> |
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/README.vi.md">Tiếng Việt</a>
</p>

![UI Grab banner](https://raw.githubusercontent.com/Yongtaek-Ryu/ui-grab/main/assets/banner.png)

---

### Installation

```bash
# Main package
npx ui-grab@latest init
pnpm add -D ui-grab

# Optional MCP bridge
pnpm add -D ui-grab-mcp
```

> [!NOTE]
> `ui-grab` is the runtime and CLI package for this fork. `ui-grab-mcp` is a separate optional package for agent integrations.

### Why UI Grab

- Copy file, component, and HTML context directly from the browser
- Keep the original React Grab prompt UI and comment history flow
- Use built-in `Shift + click` multi-select in comment mode
- Preserve grouped prompt history after submitting multi-element selections
- Keep a public package surface compatible with `ui-grab`, `ui-grab/core`, `ui-grab/primitives`, and `ui-grab/styles.css`
- Keep MCP support optional through a separate `ui-grab-mcp` package

### Usage

1. Activate the selection tool from the floating toolbar.
2. Hover an element and press `Cmd+C` or `Ctrl+C` to copy a single element.
3. Hold `Shift` and click multiple elements to build a grouped selection.
4. Release `Shift`, type into the original textarea, and submit.

### Manual Setup

#### Next.js (App Router)

```tsx
import Script from "next/script";

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/ui-grab/dist/index.global.js"
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

#### Next.js (Pages Router)

```tsx
import Script from "next/script";
import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/ui-grab/dist/index.global.js"
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

#### Vite

```tsx
if (import.meta.env.DEV) {
  import("ui-grab");
}
```

#### Webpack

```tsx
if (process.env.NODE_ENV === "development") {
  import("ui-grab");
}
```

### Package Surface

- Runtime: `ui-grab`
- Core API: `ui-grab/core`
- Primitives: `ui-grab/primitives`
- Styles: `ui-grab/styles.css`
- CLI: `ui-grab`
- MCP bridge: `ui-grab-mcp`

### Repository Scope

- Published to npm: `ui-grab`, `ui-grab-mcp`
- Kept only in the GitHub repository: multilingual READMEs, `assets/`, `CONTRIBUTING.md`, and `.github/workflows/ci.yml`
- Removed from this fork: OpenSpec history, website files, extra playground packages, and GitHub prompt/skill scaffolding

### Support

- Repository: [Yongtaek-Ryu/ui-grab](https://github.com/Yongtaek-Ryu/ui-grab)
- Issues: [GitHub Issues](https://github.com/Yongtaek-Ryu/ui-grab/issues)
- Upstream reference: [aidenybai/react-grab](https://github.com/aidenybai/react-grab)
- This repository is an independent fork and is not maintained by the original React Grab team.

### License

UI Grab is distributed under the MIT license. Keep the original copyright notice and license text when redistributing forked code.
