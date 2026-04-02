# ui-grab

<p align="center">為編碼代理打造的開源 UI 上下文擷取工具。</p>
<p align="center">
  <a href="https://www.npmjs.com/package/ui-grab"><img alt="npm version" src="https://img.shields.io/npm/v/ui-grab?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/ui-grab"><img alt="npm package" src="https://img.shields.io/badge/npm-ui--grab-cb3837?style=flat-square" /></a>
  <a href="https://github.com/Yongtaek-Ryu/ui-grab/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-97ca00?style=flat-square" /></a>
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

---

### 安裝

```bash
npx ui-grab@latest init
pnpm add -D ui-grab

# Optional MCP bridge
pnpm add -D ui-grab-mcp
```


### 為什麼選擇 UI Grab

- 直接從瀏覽器複製檔案、元件與 HTML 上下文
- 保留原始 React Grab 的提示輸入 UI 與留言歷史流程
- 在 comment mode 中內建 `Shift + 點擊` 多選
- 多元素提交後仍保留群組提示歷史
- 保持 `ui-grab`、`ui-grab/core`、`ui-grab/primitives` 與 `ui-grab/styles.css` 公開入口

### 使用方式

1. 在浮動工具列中啟用選取工具。
2. 將滑鼠停在元素上，按 `Cmd+C` 或 `Ctrl+C` 複製單一元素。
3. 按住 `Shift` 並點擊多個元素，建立群組選取。
4. 放開 `Shift`，在原始 textarea 中輸入提示並送出。

### 手動整合

#### Next.js (App Router)

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

#### Next.js (Pages Router)

```tsx
import Script from "next/script";
import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="zh-Hant">
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

### 套件介面

- Runtime：`ui-grab`
- Core API：`ui-grab/core`
- Primitives：`ui-grab/primitives`
- Styles：`ui-grab/styles.css`
- CLI：`ui-grab`
- 代理整合目前維持與上游相容，MCP 可透過 `ui-grab add mcp` 連接

### 支援

- 儲存庫：[Yongtaek-Ryu/ui-grab](https://github.com/Yongtaek-Ryu/ui-grab)
- 問題回報：[GitHub Issues](https://github.com/Yongtaek-Ryu/ui-grab/issues)
- 上游參考：[aidenybai/react-grab](https://github.com/aidenybai/react-grab)
- 本儲存庫是獨立分叉，並非由原 React Grab 團隊維護。

### 授權

UI Grab 以 MIT 授權發佈。重新散佈分叉程式碼時，請保留原始版權聲明與授權文字。
