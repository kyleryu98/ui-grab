<p align="center">
  <a href="https://github.com/Yongtaek-Ryu/ui-grab">
    <img src="https://raw.githubusercontent.com/Yongtaek-Ryu/ui-grab/main/assets/logo.png" alt="UI Grab logo" width="96">
  </a>
</p>
<p align="center">コーディングエージェント向けのオープンソース UI コンテキストピッカー。</p>
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

### インストール

```bash
npx ui-grab@latest init
pnpm add -D ui-grab

pnpm install
pnpm build
pnpm --filter ui-grab pack
```

> [!NOTE]
> `ui-grab` はこのフォークの公開パッケージ名です。リポジトリは公開準備済みですが、最初の npm 公開にはメンテナーアカウントの npm 認証が必要です。

### UI Grab を使う理由

- ブラウザからファイル、コンポーネント、HTML コンテキストを直接コピー
- 元の React Grab のプロンプト UI とコメント履歴フローを維持
- comment mode で `Shift + クリック` の複数選択を標準搭載
- 複数要素送信後もグループ化されたプロンプト履歴を保持

### 使い方

1. フローティングツールバーから選択ツールを有効にします。
2. 要素にカーソルを合わせて `Cmd+C` または `Ctrl+C` で単一要素をコピーします。
3. `Shift` を押しながら複数要素をクリックしてグループ選択を作ります。
4. `Shift` を離し、元の textarea に入力して送信します。

### 手動セットアップ

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

#### Vite

```tsx
if (import.meta.env.DEV) {
  import("ui-grab");
}
```

### パッケージ表面

- Runtime: `ui-grab`
- Core API: `ui-grab/core`
- Primitives: `ui-grab/primitives`
- Styles: `ui-grab/styles.css`
- CLI: `ui-grab`

### サポート

- リポジトリ: [Yongtaek-Ryu/ui-grab](https://github.com/Yongtaek-Ryu/ui-grab)
- Issues: [GitHub Issues](https://github.com/Yongtaek-Ryu/ui-grab/issues)
- upstream 参照: [aidenybai/react-grab](https://github.com/aidenybai/react-grab)
- このリポジトリは独立したフォークであり、元の React Grab チームによって保守されていません。

### ライセンス

UI Grab は MIT ライセンスで配布されます。フォークしたコードを再配布する場合は、元の著作権表示とライセンステキストを保持してください。
