<p align="center">
  <a href="https://github.com/Yongtaek-Ryu/ui-grab">
    <img src="https://raw.githubusercontent.com/Yongtaek-Ryu/ui-grab/main/assets/logo.png" alt="UI Grab logo" width="96">
  </a>
</p>
<p align="center">เครื่องมือเลือกบริบท UI แบบโอเพนซอร์สสำหรับโค้ดดิ้งเอเจนต์</p>
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

### การติดตั้ง

```bash
npx ui-grab@latest init
pnpm add -D ui-grab

pnpm install
pnpm build
pnpm --filter ui-grab pack
```

> [!NOTE]
> `ui-grab` คือชื่อแพ็กเกจสาธารณะของ fork นี้ ตอนนี้รีโพพร้อมสำหรับการเผยแพร่แล้ว แต่การปล่อย npm สาธารณะครั้งแรกยังต้องใช้การยืนยันตัวตน npm ของผู้ดูแล

### ทำไมต้อง UI Grab

- คัดลอกบริบทของไฟล์ คอมโพเนนต์ และ HTML ได้ตรงจากเบราว์เซอร์
- คง UI ของ prompt และประวัติคอมเมนต์แบบดั้งเดิมของ React Grab
- ใช้การเลือกหลายองค์ประกอบด้วย `Shift + click` ใน comment mode ได้ในตัว
- เก็บประวัติ prompt แบบกลุ่มหลังส่งหลายองค์ประกอบ
- คง public entrypoints สำหรับ `ui-grab`, `ui-grab/core`, `ui-grab/primitives` และ `ui-grab/styles.css`

### การใช้งาน

1. เปิดเครื่องมือเลือกจาก floating toolbar
2. เลื่อนเมาส์เหนือองค์ประกอบแล้วกด `Cmd+C` หรือ `Ctrl+C` เพื่อคัดลอกองค์ประกอบเดียว
3. กด `Shift` ค้างแล้วคลิกหลายองค์ประกอบเพื่อสร้างการเลือกแบบกลุ่ม
4. ปล่อย `Shift` จากนั้นพิมพ์ใน textarea เดิมแล้วส่ง

### การตั้งค่าด้วยตนเอง

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

### พื้นผิวของแพ็กเกจ

- Runtime: `ui-grab`
- Core API: `ui-grab/core`
- Primitives: `ui-grab/primitives`
- Styles: `ui-grab/styles.css`
- CLI: `ui-grab`

### การสนับสนุน

- ที่เก็บโค้ด: [Yongtaek-Ryu/ui-grab](https://github.com/Yongtaek-Ryu/ui-grab)
- Issues: [GitHub Issues](https://github.com/Yongtaek-Ryu/ui-grab/issues)
- อ้างอิง upstream: [aidenybai/react-grab](https://github.com/aidenybai/react-grab)

### ใบอนุญาต

UI Grab เผยแพร่ภายใต้สัญญาอนุญาต MIT โปรดเก็บประกาศลิขสิทธิ์ต้นฉบับและข้อความสัญญาอนุญาตไว้เมื่อแจกจ่ายโค้ดที่ fork ไปต่อ.
