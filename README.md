# Realitní analytik – web (Astro + Tailwind)

Statický web pro realitni-analytik.cz. Nemovitosti, analýzy a reference se spravují jako Markdown soubory
v `src/content/`, obrázky se při buildu převádějí na WebP. Podrobné zadání je v dokumentu
`zadani-pro-programatora.docx` (kořen projektu / složka projektu).

## Spuštění

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # výstup do dist/
npm run preview
```

## Přidání nemovitosti

1. Vytvořte složku `src/content/nemovitosti/<slug>/` (slug = URL, malá písmena, pomlčky).
2. Nahrajte fotografie (`01.jpg`, `02.jpg`, …) a spusťte `npm run images:optimize -- <slug>`
   – fotky se zmenší, převedou na WebP (≤ 500 kB) a odkazy v `index.md` se upraví.
3. Vyplňte `index.md` podle vzoru (schéma polí je v `src/content.config.ts`, každé pole má komentář).
4. `npm run build` – nemovitost se objeví ve výpisu, na homepage (pokud `featured: true`),
   v sitemapě a v XML exportu `/feed/nemovitosti.xml`.

Stavy: `aktivni` → `rezervovano` → `prodano` / `pronajato`. Prodané nemovitosti zůstávají na webu
jako reference (sekce „Nedávno prodáno“), detail má `noindex`.

## Struktura

- `src/pages/` – stránky (routy = názvy souborů)
- `src/components/` – komponenty (formuláře, karta nemovitosti, kroky, FAQ, graf…)
- `src/layouts/Base.astro` – HTML kostra, SEO meta, JSON-LD, cookie lišta
- `src/data/site.ts` – kontaktní údaje, navigace (TODO položky doplní klient)
- `src/styles/global.css` – design tokeny (barvy, písma) a základní komponenty
- `scripts/optimize-images.mjs` – optimalizace fotek
- `scripts/make-placeholders.mjs` – generuje ukázkové obrázky (jen pro demo, před nasazením smazat)

## Formuláře

Formuláře posílají `POST` na `site.formEndpoint` (`/api/lead`). Endpoint není součástí Astro buildu –
implementace (Cloudflare Worker / Netlify Function / Formspree) je popsána v zadání. Každý formulář
posílá pole `form` (`oceneni | zajem | kontakt | koupe`) + honeypot `website`.
