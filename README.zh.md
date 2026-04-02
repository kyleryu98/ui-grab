# ui-grab

<p align="center">面向编码代理的开源 UI 上下文拾取工具。</p>
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

### 安装

```bash
npx ui-grab@latest init
pnpm add -D ui-grab

# Optional MCP bridge
pnpm add -D ui-grab-mcp
```


### 为什么选择 UI Grab

- 直接从浏览器复制文件、组件和 HTML 上下文
- 保留原始 React Grab 的提示框 UI 和评论历史流程
- 在 comment mode 中内置 `Shift + 点击` 多选
- 多元素提交后仍保留分组提示历史
- 保持 `ui-grab`、`ui-grab/core`、`ui-grab/primitives` 与 `ui-grab/styles.css` 公开入口

### 使用方式

1. 在浮动工具栏中启用选择工具。
2. 悬停元素并按 `Cmd+C` 或 `Ctrl+C` 复制单个元素。
3. 按住 `Shift` 并点击多个元素，建立分组选择。
4. 松开 `Shift`，在原始 textarea 中输入提示并提交。

### 手动接入

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
    <Html lang="zh-CN">
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

### 包接口

- 运行时：`ui-grab`
- Core API：`ui-grab/core`
- Primitives：`ui-grab/primitives`
- 样式：`ui-grab/styles.css`
- CLI：`ui-grab`
- 代理集成目前保持与上游兼容，MCP 可通过 `ui-grab add mcp` 连接

### 支持

- 仓库：[Yongtaek-Ryu/ui-grab](https://github.com/Yongtaek-Ryu/ui-grab)
- 问题反馈：[GitHub Issues](https://github.com/Yongtaek-Ryu/ui-grab/issues)
- 上游参考：[aidenybai/react-grab](https://github.com/aidenybai/react-grab)
- 本仓库是独立分叉，并非由原 React Grab 团队维护。

### 许可证

UI Grab 采用 MIT 许可证发布。重新分发分叉代码时，请保留原始版权声明和许可证文本。
