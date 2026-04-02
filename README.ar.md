<p align="center">أداة مفتوحة المصدر لاختيار سياق الواجهة لوكلاء البرمجة.</p>
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

### التثبيت

```bash
npx ui-grab@latest init
pnpm add -D ui-grab

pnpm install
pnpm build
pnpm --filter ui-grab pack
```

> [!NOTE]
> `ui-grab` هو اسم الحزمة العامة لهذا الـ fork. المستودع جاهز للنشر، لكن أول إصدار npm عام ما زال يحتاج إلى مصادقة npm من حساب المشرف.

### لماذا UI Grab

- انسخ سياق الملفات والمكونات وHTML مباشرة من المتصفح
- احتفظ بواجهة React Grab الأصلية وسجل التعليقات
- استخدم التحديد المتعدد المدمج عبر `Shift + click` في وضع التعليقات
- احتفظ بسجل المطالبات المجمعة بعد إرسال عدة عناصر
- حافظ على الواجهات العامة `ui-grab` و `ui-grab/core` و `ui-grab/primitives` و `ui-grab/styles.css`

### الاستخدام

1. فعّل أداة التحديد من شريط الأدوات العائم.
2. مرر فوق العنصر واضغط `Cmd+C` أو `Ctrl+C` لنسخ عنصر واحد.
3. اضغط مع الاستمرار على `Shift` وانقر على عدة عناصر لبناء تحديد مجمّع.
4. اترك `Shift` ثم اكتب في مربع النص الأصلي وأرسل.

### الإعداد اليدوي

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

### واجهات الحزمة

- Runtime: `ui-grab`
- Core API: `ui-grab/core`
- Primitives: `ui-grab/primitives`
- Styles: `ui-grab/styles.css`
- CLI: `ui-grab`

### الدعم

- المستودع: [Yongtaek-Ryu/ui-grab](https://github.com/Yongtaek-Ryu/ui-grab)
- المشكلات: [GitHub Issues](https://github.com/Yongtaek-Ryu/ui-grab/issues)
- المرجع الأصلي: [aidenybai/react-grab](https://github.com/aidenybai/react-grab)

### الترخيص

يتم توزيع UI Grab بموجب ترخيص MIT. احتفظ بإشعار حقوق النشر الأصلي ونص الترخيص عند إعادة توزيع الكود المتفرع.
