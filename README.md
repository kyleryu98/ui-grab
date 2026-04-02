# UI Grab

UI Grab is a maintained fork of React Grab with built-in Shift multi-select for prompt mode.

This fork keeps the original prompt UI and comment history flow, but changes one important interaction:

- Activate selection from the toolbar
- Hold `Shift`
- Click multiple elements
- Release `Shift`
- The original prompt opens on the last selected element with the full grouped selection preserved

The project remains MIT-compatible and keeps upstream package compatibility for now. Until you publish it under your own scope, imports and runtime usage stay `react-grab`-compatible.

## English

### What is different from upstream

- Built-in `Shift + click` multi-selection in comment mode
- The prompt does not open on the first click
- The original React Grab textarea is preserved
- Multi-selected elements stay visibly highlighted before prompt entry
- Submitted prompt text is stored correctly in comment history for grouped selections

### Install

If you are consuming this fork directly from GitHub, install it from your own repository URL.

```bash
pnpm add github:your-account/ui-grab
```

If you later publish it under a scoped package, replace the dependency name accordingly.

### Usage

1. Open your app in development.
2. Activate the selection tool from the floating toolbar.
3. Hold `Shift` and click multiple elements.
4. Release `Shift`.
5. Enter your prompt in the original React Grab textarea.
6. Submit to copy grouped context and save the prompt in comment history.

### Manual integration

This fork currently stays import-compatible with `react-grab`.

#### Next.js

```tsx
import Script from "next/script";

export default function RootLayout(props: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
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
  import("react-grab");
}
```

### Attribution and license

UI Grab is based on React Grab by Aiden Bai.

- Upstream project: [aidenybai/react-grab](https://github.com/aidenybai/react-grab)
- License: MIT

Keep the upstream copyright notice and MIT license text when redistributing this fork.

## 한국어

### 무엇이 달라졌나

- comment mode에서 `Shift + 클릭` 다중 선택이 기본 지원됩니다.
- 첫 번째 클릭에서 바로 프롬프트가 뜨지 않습니다.
- React Grab 기본 textarea UI를 그대로 사용합니다.
- 프롬프트를 열기 전까지 선택한 요소들이 계속 하이라이트된 상태로 유지됩니다.
- 여러 요소를 묶어 프롬프트를 제출해도 comment history에 메시지가 정상 반영됩니다.

### 설치

별도 저장소로 운영한다면 GitHub 저장소에서 직접 설치하면 됩니다.

```bash
pnpm add github:your-account/ui-grab
```

나중에 scoped package로 배포하면 그 이름으로 바꾸면 됩니다.

### 사용 방법

1. 개발 환경에서 앱을 실행합니다.
2. 플로팅 툴바에서 선택 기능을 활성화합니다.
3. `Shift`를 누른 채 여러 요소를 클릭합니다.
4. `Shift`를 떼면 마지막으로 선택한 요소 기준으로 기본 프롬프트가 열립니다.
5. 기존 React Grab 입력창에 메시지를 입력합니다.
6. 제출하면 여러 요소 컨텍스트와 프롬프트가 함께 복사되고 comment history에도 저장됩니다.

### 수동 연동

현재 이 포크는 `react-grab` import 호환을 유지합니다.

#### Next.js

```tsx
import Script from "next/script";

export default function RootLayout(props: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
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
  import("react-grab");
}
```

### 출처와 라이선스

UI Grab은 Aiden Bai의 React Grab을 기반으로 만든 포크입니다.

- 원본 저장소: [aidenybai/react-grab](https://github.com/aidenybai/react-grab)
- 라이선스: MIT

이 포크를 재배포할 때는 upstream 저작권 고지와 MIT 라이선스 문구를 유지해야 합니다.
