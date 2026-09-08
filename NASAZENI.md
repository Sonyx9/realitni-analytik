# Nasazení a provoz

Web je statický (Astro → `dist/`) plus jedna serverová funkce pro formuláře
(`functions/api/lead.ts`). Obojí hostuje **Cloudflare Pages** – funkce se nasadí sama
spolu s webem, nic dalšího se nespouští.

---

## 1. Git

```bash
cd realitni-analytik
git remote add origin git@github.com:<ucet>/realitni-analytik.git
git push -u origin main
```

Repozitář je inicializovaný. `node_modules/`, `dist/`, `.astro/` a `.dev.vars`
jsou v `.gitignore` – do gitu jde jen zdroják, obsah a fotky.

## 2. Lokální spuštění

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # výstup do dist/
```

Node 22 (`.nvmrc`).

### Místní test formulářů

`astro dev` obsluhuje jen stránky, ne Cloudflare funkce. Formuláře se testují přes Wrangler
nad hotovým buildem:

```bash
cp .dev.vars.example .dev.vars   # vyplnit klíče, do gitu to nejde
npm run build
npx wrangler pages dev dist      # http://localhost:8788
```

Bez vyplněného `TURNSTILE_SECRET` se ověření robota přeskočí, bez `RESEND_API_KEY`
endpoint vrátí 502 (e-mail je jediný krok, který nesmí tiše selhat).

## 3. Náhled na GitHub Pages (jen pro připomínkování)

Po každém pushi do `main` se web postaví a vystaví na
**https://sonyx9.github.io/realitni-analytik/** (workflow `.github/workflows/nahled.yml`).
Slouží k tomu, aby klient viděl, jak web vypadá, než se pořídí doména a hosting.

Náhled běží na podcestě, ne v kořeni domény, proto build dostává adresu a podcestu
v proměnných `SITE_URL` a `BASE_PATH` a odkazy zapsané ve zdrojácích natvrdo
dorovná `scripts/base-prefix.mjs`. Lokálně se totéž vyzkouší takto:

```bash
SITE_URL=https://sonyx9.github.io BASE_PATH=/realitni-analytik npm run build:nahled
npx serve dist   # nebo jiný statický server
```

**Co na náhledu nefunguje:** odesílání formulářů. `/api/lead` je serverová funkce
Cloudflare, GitHub Pages umí jen statické soubory – formulář se vyplnit dá, ale
odeslání skončí chybovou hláškou. Ostrý web tohle nemá.

Až poběží Cloudflare Pages, náhled buď nechte jako testovací prostředí, nebo
workflow `nahled.yml` smažte.

## 4. Cloudflare Pages

**Workers & Pages → Create → Pages → Connect to Git → vybrat repozitář**

| Nastavení | Hodnota |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | (prázdné) |

### Proměnné prostředí

*Settings → Environment variables* – vyplnit pro **Production i Preview**
(seznam a popis je v `.dev.vars.example`):

| Proměnná | Povinná | K čemu |
|---|---|---|
| `NODE_VERSION` | ano | `22` |
| `MAIL_TO` | ano | kam chodí leady (e-mail makléře) |
| `MAIL_CC` | ne | kopie pro agenturu |
| `MAIL_FROM` | ano | odesílatel na ověřené doméně |
| `RESEND_API_KEY` | ano | odesílání e-mailů |
| `TURNSTILE_SECRET` | doporučeno | ověření, že formulář neodeslal robot |
| `SHEETS_WEBHOOK_URL` | ne | zápis leadu do tabulky |

Klíče vždy ukládejte jako **Secret** (šifrované), ne jako plain text.

### KV pro rate limit

*Settings → Functions → KV namespace bindings* → nový namespace `leads`,
binding **`LEADS_KV`**. Bez něj limit (5 odeslání z IP za 10 minut) funguje jen
v rámci jedné instance funkce – proti běžnému spamu to stačí, ale s KV je to spolehlivé.

## 5. Služby, které se nastavují jednou

### Resend (e-maily)

1. [resend.com](https://resend.com) → *Domains* → přidat `realitni-analytik.cz`.
2. Do DNS domény vložit vypsané záznamy (SPF, DKIM, případně DMARC) a počkat na ověření.
3. *API Keys* → nový klíč s oprávněním **Sending access** → do `RESEND_API_KEY`.
4. `MAIL_FROM` musí být na ověřené doméně, jinak Resend odesílání odmítne.

### Turnstile (ochrana formulářů)

1. Cloudflare → *Turnstile* → **Add site**, doména `realitni-analytik.cz`
   (a `*.pages.dev` pro staging), widget mode **Managed**.
2. **Site key** (veřejný) → `src/data/site.ts` → `turnstileSiteKey`.
3. **Secret key** → proměnná `TURNSTILE_SECRET`.

Dokud je `turnstileSiteKey` prázdný, widget se nevykreslí a server ověření přeskočí –
formuláře pak chrání honeypot a rate limit.

### Google Sheets (evidence leadů)

1. Nová tabulka → *Rozšíření → Apps Script*, vložit:

```js
function doPost(e) {
  const list = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const data = JSON.parse(e.postData.contents);
  if (list.getLastRow() === 0) list.appendRow(Object.keys(data));
  const hlavicka = list.getRange(1, 1, 1, list.getLastColumn()).getValues()[0];
  list.appendRow(hlavicka.map((k) => data[k] ?? ''));
  return ContentService.createTextOutput('ok');
}
```

2. *Nasadit → Nové nasazení → Webová aplikace*, spouštět jako **já**,
   přístup **kdokoli**. Vygenerovanou URL vložit do `SHEETS_WEBHOOK_URL`.

Zápis do tabulky je doplňkový – když selže, lead stejně odejde e-mailem a chyba
se jen zaloguje (Cloudflare → Workers & Pages → projekt → *Functions* → Real-time logs).

### Google Tag Manager

ID kontejneru se vyplňuje v `src/data/site.ts` → `gtmId`. Dokud je prázdné, GTM se
nenačte vůbec. V GTM pak namapovat události z dataLayeru (seznam je v README)
na konverze v GA4, Google Ads a Skliku.

## 6. Doména a přesměrování

- DNS přepnout **až po kontrole staging verze** na `*.pages.dev`.
- 301 přesměrování ze starých adres je v `public/_redirects` – nasadí se samo s webem.
- Poslední pravidlo („vše ostatní → `/`“) je v souboru **záměrně zakomentované**:
  vypnulo by stránku 404 pro celý web a Search Console by to hlásila jako soft 404.
  Doporučení: nechat vypnuté, po měsíci provozu se podívat do Search Console →
  *Stránky → Nenalezeno* a reálné staré adresy dopsat jmenovitě.
- Cache a bezpečnostní hlavičky jsou v `public/_headers`.

## 7. Checklist před ostrým spuštěním

**Údaje a texty**

- [ ] `src/data/site.ts` – telefon, e-mail, IČO, adresa, sociální sítě, Google recenze
- [ ] `src/data/site.ts` – `logo` a `logoLight` (červené logo klienta jako SVG)
- [ ] `src/data/site.ts` – `gtmId` a `turnstileSiteKey`
- [ ] právní texty: ochrana osobních údajů, cookies, informace pro spotřebitele
      (na `/cookies/` je připravený technický soupis úložišť a třetích stran – ten v textu nechte)
- [ ] po dodání právních textů smazat `noindex` na těch třech stránkách a vyškrtnout je
      ze seznamu `NOINDEX` v `astro.config.mjs` – povinné informace patří do indexu
- [ ] `/financovani/` a *Informace pro spotřebitele*: **kdo zprostředkovává úvěr**
      a pod jakým oprávněním ČNB (viz kapitola 13 zadání – bez toho stránku nespouštět)
- [ ] patička: pojišťovna profesní odpovědnosti, spolupracující advokátní kancelář
- [ ] `/o-nas/` – vzdělání, certifikace, pojištění

**Obsah**

- [ ] nejméně 4 skutečné nemovitosti, 5 referencí, 3 články – jinak sekci skrýt (ne smazat)
- [ ] fotky od fotografa místo ukázkových z Unsplash (`FOTKY-ZDROJE.md`)
- [ ] hero: výřez makléře bez pozadí → `src/assets/hero-makler-cut.png`
- [ ] loga portálů na úvodu (zatím text) → mono SVG
- [ ] smazat `scripts/make-placeholders.mjs`, `scripts/make-placeholders-v2.mjs`
      a ukázkový obsah

**Technika**

- [ ] `npm run build && npm run check:odkazy && npm run check:texty` projde bez chyby
- [ ] v `.github/workflows/kontrola.yml` smazat `continue-on-error` u kontroly textů
- [ ] otestovat všech 5 formulářů: e-mail makléři, potvrzení klientovi, řádek v tabulce
- [ ] DevTools → Network: před souhlasem s cookies žádný požadavek na googletagmanager.com
- [ ] Lighthouse (mobil) ≥ 90 na `/`, `/nemovitosti/`, detailu a `/oceneni-nemovitosti-zdarma/`
- [ ] Rich Results Test: RealEstateAgent, RealEstateListing, FAQPage, BreadcrumbList
- [ ] Search Console + Bing Webmaster: ověřit doménu, odeslat sitemapu
- [ ] GA4 a Google Ads konverze napojené na události z dataLayeru
