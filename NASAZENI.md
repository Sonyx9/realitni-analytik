# Nasazení – postup

## 1. Git (jednorázově, na Macu)

```bash
cd "realitni-analytik"
git remote add origin git@github.com:<ucet>/realitni-analytik.git   # nebo HTTPS URL repa
git push -u origin main
```

Repozitář je už inicializovaný (`git init`, první commit hotový). Stačí přidat remote a pushnout.
`node_modules/`, `dist/` a `.astro/` jsou v `.gitignore` – do gitu jde jen zdroják, obsah a fotky.

## 2. Lokální spuštění

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # výstup do dist/
```

Node 22 (soubor `.nvmrc`).

## 3. Hosting (až budou zapracované poznámky)

Doporučeno **Cloudflare Pages** (zdarma, staging URL `*.pages.dev`, později `/api/lead` jako Pages Function – viz zadání kap. 8):

- Workers & Pages → Create → Pages → Connect to Git → vybrat repo
- Framework preset: **Astro**, build command `npm run build`, output directory `dist`
- Environment variable `NODE_VERSION = 22`
- Po nasazení ověřit `/sitemap-index.xml`, `/robots.txt`, `/feed/nemovitosti.xml`

Alternativa Netlify: totéž, build `npm run build`, publish `dist`; formuláře jde dočasně přepnout na Netlify Forms (atribut `data-netlify="true"` na `<form>`).

## 4. Před ostrým spuštěním (checklist)

- [ ] `src/data/site.ts` – telefon, e-mail, IČO, adresa, odkazy na Sreality / sociální sítě, Google recenze
- [ ] `src/components/CookieBar.astro` – skutečné GTM ID
- [ ] nahradit ukázkové nemovitosti v `src/content/nemovitosti/` skutečnými (fotky přes `npm run images:optimize`)
- [ ] nahradit fotografie z Unsplash (seznam `FOTKY-ZDROJE.md`) fotkami od fotografa
- [ ] doplnit právní texty (ochrana osobních údajů, cookies, informace pro spotřebitele)
- [ ] napojit `/api/lead` (Pages Function + Turnstile + e-mail) – kap. 8 zadání
- [ ] nastavit 301 přesměrování ze starých URL (kap. 3 zadání) – soubor `public/_redirects`
- [ ] DNS: doménu `realitni-analytik.cz` přepnout až po kontrole staging verze
