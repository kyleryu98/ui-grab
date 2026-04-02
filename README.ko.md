<p align="center">
  <a href="https://github.com/Yongtaek-Ryu/ui-grab">
    <img src="https://raw.githubusercontent.com/Yongtaek-Ryu/ui-grab/main/assets/logo.png" alt="UI Grab logo" width="96">
  </a>
</p>
<p align="center">코딩 에이전트를 위한 오픈 소스 UI 컨텍스트 선택 도구.</p>
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

### 설치

```bash
# 이 포크의 공개 패키지 이름
npx ui-grab@latest init
pnpm add -D ui-grab

# 첫 npm 릴리스 전 로컬 소스 빌드
pnpm install
pnpm build
pnpm --filter ui-grab pack
```

> [!NOTE]
> `ui-grab`은 이 포크의 공개 패키지 이름입니다. 저장소는 이미 publish 준비가 끝났지만, 첫 공개 npm 릴리스는 유지보수 계정의 npm 인증이 필요합니다.

### UI Grab이 제공하는 것

- 브라우저에서 바로 파일, 컴포넌트, HTML 컨텍스트를 복사
- 기존 React Grab 프롬프트 UI와 comment history 흐름 유지
- comment mode에서 기본 내장된 `Shift + 클릭` 다중 선택
- 여러 요소를 묶어 제출한 뒤에도 그룹 프롬프트 기록 유지
- `ui-grab`, `ui-grab/core`, `ui-grab/primitives`, `ui-grab/styles.css` 공개 surface 유지

### 사용 방법

1. 플로팅 툴바에서 선택 기능을 활성화합니다.
2. 요소에 마우스를 올리고 `Cmd+C` 또는 `Ctrl+C`로 단일 요소를 복사합니다.
3. `Shift`를 누른 채 여러 요소를 클릭해 그룹 선택을 만듭니다.
4. `Shift`를 떼고 기본 textarea에 입력한 뒤 제출합니다.

### 수동 설정

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
    <Html lang="ko">
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

### 패키지 surface

- 런타임: `ui-grab`
- Core API: `ui-grab/core`
- Primitives: `ui-grab/primitives`
- Styles: `ui-grab/styles.css`
- CLI: `ui-grab`
- 에이전트 연동은 현재 upstream 호환 방식을 유지하며, MCP는 `ui-grab add mcp`로 연결할 수 있습니다

### 지원

- 저장소: [Yongtaek-Ryu/ui-grab](https://github.com/Yongtaek-Ryu/ui-grab)
- 이슈: [GitHub Issues](https://github.com/Yongtaek-Ryu/ui-grab/issues)
- 원본 참고: [aidenybai/react-grab](https://github.com/aidenybai/react-grab)
- 이 저장소는 독립 포크이며, 원래 React Grab 팀이 유지보수하지 않습니다.

### 라이선스

UI Grab은 MIT 라이선스로 배포됩니다. 포크된 코드를 재배포할 때는 원본 저작권 고지와 라이선스 문구를 유지하세요.
