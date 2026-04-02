<p align="center">
  <a href="https://github.com/Yongtaek-Ryu/ui-grab">
    <img src="https://raw.githubusercontent.com/Yongtaek-Ryu/ui-grab/main/assets/logo.png" alt="UI Grab logo" width="96">
  </a>
</p>
<p align="center">Εργαλείο ανοιχτού κώδικα για επιλογή UI context για coding agents.</p>
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

### Εγκατάσταση

```bash
npx ui-grab@latest init
pnpm add -D ui-grab

pnpm install
pnpm build
pnpm --filter ui-grab pack
```

> [!NOTE]
> Το `ui-grab` είναι το δημόσιο όνομα πακέτου αυτού του fork. Το αποθετήριο είναι έτοιμο για δημοσίευση, αλλά η πρώτη δημόσια έκδοση στο npm εξακολουθεί να απαιτεί npm authentication από τον λογαριασμό του maintainer.

### Γιατί UI Grab

- Αντιγράψτε context αρχείων, components και HTML απευθείας από τον browser
- Διατηρήστε το αρχικό React Grab prompt UI και το ιστορικό σχολίων
- Χρησιμοποιήστε ενσωματωμένο `Shift + click` multi-select στο comment mode
- Διατηρήστε ομαδοποιημένο prompt history μετά την αποστολή πολλών στοιχείων
- Διατηρήστε τα δημόσια entrypoints `ui-grab`, `ui-grab/core`, `ui-grab/primitives` και `ui-grab/styles.css`

### Χρήση

1. Ενεργοποιήστε το εργαλείο επιλογής από την αιωρούμενη γραμμή εργαλείων.
2. Περάστε τον δείκτη πάνω από ένα στοιχείο και πατήστε `Cmd+C` ή `Ctrl+C` για να αντιγράψετε ένα μόνο στοιχείο.
3. Κρατήστε πατημένο το `Shift` και κάντε κλικ σε πολλά στοιχεία για να δημιουργήσετε ομαδοποιημένη επιλογή.
4. Αφήστε το `Shift`, γράψτε στο αρχικό textarea και στείλτε.

### Χειροκίνητη ρύθμιση

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

### Επιφάνεια πακέτου

- Runtime: `ui-grab`
- Core API: `ui-grab/core`
- Primitives: `ui-grab/primitives`
- Styles: `ui-grab/styles.css`
- CLI: `ui-grab`

### Υποστήριξη

- Αποθετήριο: [Yongtaek-Ryu/ui-grab](https://github.com/Yongtaek-Ryu/ui-grab)
- Issues: [GitHub Issues](https://github.com/Yongtaek-Ryu/ui-grab/issues)
- Αναφορά upstream: [aidenybai/react-grab](https://github.com/aidenybai/react-grab)

### Άδεια

Το UI Grab διανέμεται με άδεια MIT. Κρατήστε το αρχικό copyright notice και το κείμενο της άδειας όταν αναδιανέμετε κώδικα του fork.
