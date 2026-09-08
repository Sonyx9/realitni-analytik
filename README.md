# Realitní analytik – web

Statický web pro **realitni-analytik.cz**. Postavený v Astru, nasazený na Cloudflare Pages.
Nemovitosti, články a reference se spravují jako soubory v `src/content/` – žádná databáze,
žádné přihlašování do administrace. Každá změna v repozitáři spustí build a web se sám přepíše.

Dokument je rozdělený na dvě části:

- **[Část A – pro makléře](#část-a--pro-makléře)** – jak přidat nemovitost, změnit stav, napsat článek. Bez programování.
- **[Část B – pro programátora](#část-b--pro-programátora)** – jak web běží, jak se buildí, kde je co.

Zadání projektu je v dokumentu `02-zadani-pro-programatora.docx` ve složce projektu.
Nasazení a nastavení hostingu popisuje [NASAZENI.md](NASAZENI.md).

---

# Část A – pro makléře

## Co budete potřebovat (jednorázově)

1. **Účet na GitHubu** – pošlete e-mail, dostanete pozvánku do repozitáře.
2. **GitHub Desktop** ([desktop.github.com](https://desktop.github.com)) – program, přes který
   se do repozitáře nahrávají fotky. Po instalaci: *File → Clone repository* → vybrat
   `realitni-analytik` → *Clone*. Tím se vám na disk stáhne složka s celým webem.

> Drobné textové úpravy (překlep, změna ceny, „prodáno“) zvládnete i přímo na webu GitHubu –
> bez instalace čehokoli. Fotky se ale nahrávají líp přes GitHub Desktop.

*Sem při zaškolení doplníme snímky obrazovky – viz [docs/README.md](docs/README.md).*

## Přidání nové nemovitosti

Zabere to zhruba 10 minut. Postup je pokaždé stejný.

### 1. Založte složku

Ve složce webu otevřete `src/content/nemovitosti/` a vytvořte novou složku.
**Název složky je zároveň adresa stránky**, takže malá písmena, bez diakritiky a s pomlčkami:

```
byt-3kk-vyskov-sidliste-osvobozeni
```

→ výsledná adresa bude `realitni-analytik.cz/nemovitosti/byt-3kk-vyskov-sidliste-osvobozeni/`

### 2. Nahrajte fotografie

Do nové složky nakopírujte fotky a pojmenujte je čísly podle pořadí, v jakém se mají zobrazit:
`01.jpg`, `02.jpg`, `03.jpg`… **První fotka je hlavní** – ukáže se na kartě ve výpisu
a jako náhled při sdílení na Facebooku.

Fotky mají být na šířku v poměru 3:2 a nejméně 2 000 px široké. Rovnou z fotoaparátu jsou
v pořádku, zmenší se v dalším kroku.

> **iPhone:** fotky ve formátu HEIC neumí každý počítač zpracovat. Přepněte si
> *Nastavení → Fotoaparát → Formáty → **Nejkompatibilnější*** a fotoaparát bude ukládat JPG.
> Už hotové HEIC otevřete na Macu v Náhledu a dejte *Soubor → Exportovat → JPEG*.

### 3. Zmenšete fotky

V programu Terminál (nebo v GitHub Desktopu přes *Repository → Open in Terminal*) napište:

```bash
npm run images:optimize -- byt-3kk-vyskov-sidliste-osvobozeni
```

Skript fotky zmenší, převede do úsporného formátu WebP a přepíše na ně odkazy.
Z 8 MB fotky z foťáku je najednou 300 kB, na webu se přitom nepozná rozdíl.
Opakované spuštění nevadí – co je hotové, nechá být.

### 4. Vyplňte popis nemovitosti

Zkopírujte soubor `src/content/_sablona-nemovitost.md` do nové složky a přejmenujte na
**`index.md`**. Šablona má u každého pole poznámku, co do něj patří. Povinné je:
`title`, `typ`, `cena`, `lokalita` (obec, okres, kraj), `obrazky` a `datum`.

Na co si dát pozor:

| Pole | Pozor na |
|---|---|
| `cena` | Celé číslo bez mezer a bez „Kč“: `4890000`. Cena na vyžádání = `cena: null` |
| `kraj` | Píše se do filtru „Oblast“ – pište ho pokaždé stejně („Jihomoravský kraj“) |
| `obrazky` | Názvy musí přesně sedět se soubory ve složce, po zmenšení končí na `.webp` |
| `datum` | Formát `2026-08-28`. Řadí výpis „od nejnovější“ |
| `featured` | `true` = přednost na úvodní stránce |

Poslední odstavec popisu **„Proč tato cena“** nechte u každé nemovitosti – to je to,
čím se lišíme od ostatních inzerátů.

### 5. Odešlete změny

V GitHub Desktopu uvidíte seznam nových souborů. Dole vlevo napište krátký popis
(např. „Nový byt 3+kk Vyškov“), klikněte na **Commit to main** a pak na **Push origin**.

Za 2–3 minuty je nemovitost na webu: ve výpisu, na úvodní stránce, v sitemapě
i v XML exportu nabídky.

> **Když se něco pokazí:** build se zastaví a přijde e-mail z GitHubu. Web přitom dál běží
> v poslední funkční verzi – rozbitý inzerát se na něj nedostane. V e-mailu je napsané,
> které pole chybí nebo je špatně vyplněné.

## Změna stavu: rezervováno, prodáno

Otevřete `index.md` dané nemovitosti a změňte jediný řádek:

```yaml
status: aktivni      →      status: rezervovano      →      status: prodano
```

Co se stane:

| Stav | Ve výpisu | Na detailu |
|---|---|---|
| `aktivni` | běžná karta | formulář „Mám zájem o prohlídku“ |
| `rezervovano` | karta se štítkem Rezervováno | formulář zůstává |
| `prodano` / `pronajato` | přesune se do „Nedávno prodáno“ | přeškrtnutá cena, místo formuláře odkaz na poptávku, stránka se skryje před Googlem |

Prodané nemovitosti **nemažte** – dělají referenci a ukazují, co se vám povedlo prodat.

## Nový článek na blog

1. Vytvořte soubor `src/content/blog/nazev-clanku.md` (název souboru = adresa článku).
2. Nahoru mezi `---` vyplňte:

```yaml
---
title: "Ceny bytů ve Vyškově 2026"
perex: "Krátké shrnutí do 220 znaků – ukáže se ve výpisu a v Googlu."
datum: 2026-09-01
kategorie: analyza        # analyza | rady | novinky
lokalita: "Vyškov"        # nepovinné
tags: ["ceny", "byty"]    # nepovinné
---
```

3. Pod druhou trojtečku napište text. `##` dělá mezinadpis, `**tučně**` zvýrazní,
   odrážky se dělají pomlčkou na začátku řádku.

Kategorie řídí, kde se článek objeví: `/blog/kategorie/analyza/`, `/rady/`, `/novinky/`.

## Nová reference

Soubor `src/content/reference/prijmeni-misto.md`:

```yaml
---
jmeno: "Novákovi"
misto: "Vyškov"
typ: "prodej bytu 3+kk"
hodnoceni: 5
datum: 2026-07-15
zdroj: google        # google | email | osobne
---
Text hodnocení klienta.
```

## Kam se ukládají poptávky z formulářů

Každý odeslaný formulář vám přijde **e-mailem do minuty** (odpovědět můžete rovnou –
adresa klienta je v Reply-To) a zároveň se zapíše **jako řádek do tabulky**, aby se nic neztratilo.
Klient dostane krátké potvrzení, že se ozveme do 2 pracovních dnů.

---

# Část B – pro programátora

## Spuštění

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # výstup do dist/
npm run preview
```

Node 22 (`.nvmrc`). Formulářový endpoint je Cloudflare Pages Function, `astro dev` ho neobsluhuje –
pro test formulářů viz [NASAZENI.md](NASAZENI.md#místní-test-formulářů).

## Skripty

| Příkaz | Co dělá |
|---|---|
| `npm run build` | Build. Sám si nejdřív pustí `check:obrazky` (`prebuild`) |
| `npm run check` | Typová kontrola stránek a komponent (`astro check`) |
| `npm run check:funkce` | Typová kontrola Cloudflare funkcí (`functions/`) |
| `npm run check:obrazky` | Fotky v obsahu jsou WebP a do 500 kB |
| `npm run check:odkazy` | Adresy ze sitemapy a vnitřní odkazy vedou na existující stránky (nad `dist/`) |
| `npm run check:texty` | V buildu nejsou TODO / lorem / zástupné údaje (nad `dist/`) |
| `npm run images:optimize [-- <slug>] [--force]` | Zmenšení a převod fotek na WebP |

`.github/workflows/kontrola.yml` pouští při každém pull requestu build a všechny kontroly.
Kontrola textů je zatím `continue-on-error: true`, protože web běží na ukázkovém obsahu –
**před ostrým spuštěním ten řádek smažte**, ať blokuje merge.

## Struktura

```
src/
  pages/          stránky (název souboru = adresa)
  components/     komponenty – formuláře, karta nemovitosti, mapa, embedy, cookie lišta
  layouts/        Base.astro – hlavička HTML, SEO meta, JSON-LD, cookie lišta, měření
  content/        OBSAH: nemovitosti/, blog/, reference/ + _sablona-nemovitost.md
  data/site.ts    kontakty, navigace, služby, GTM ID, Turnstile site key
  lib/format.ts   formátování ceny, ploch, řazení výpisu
  lib/forms.ts    klientská logika formulářů (UTM, Turnstile, odeslání)
  styles/         global.css – design tokeny (@theme) a komponentní třídy
functions/
  api/lead.ts     endpoint formulářů (Cloudflare Pages Function)
  _lib/lead.ts    validace, texty e-mailů, rate limit
scripts/          optimalizace fotek a kontroly
public/
  _redirects      301 ze starých adres
  _headers        cache a bezpečnostní hlavičky
```

## Datový model

Schéma nemovitostí, článků a referencí je v `src/content.config.ts` (Zod).
**Je závazné** – když frontmatter nesedí, build spadne. To je záměr: chrání web
před rozbitým inzerátem. Popis polí je v `src/content/_sablona-nemovitost.md`.

## Design

Barvy, písma a poloměry jsou tokeny v `src/styles/global.css` (`@theme`), třídy jako
`.btn-ghost`, `.eyebrow`, `.chip`, `.field` tamtéž. **Barvy ani písma neměňte bez konzultace** –
kapitola 4 zadání popisuje, co musí zůstat zachované. Velikosti titulků řídí `clamp()`,
nepřepisujte je inline.

## Formuláře

Pět formulářů, všechny posílají POST na `site.formEndpoint`:

| `form` | Kde | Událost do dataLayeru |
|---|---|---|
| `oceneni` | `/oceneni-nemovitosti-zdarma/` (3 kroky) | `lead_oceneni` |
| `zajem` | detail nemovitosti | `lead_zajem` |
| `kontakt` | `/kontakt/` | `lead_kontakt` |
| `koupe` | `/chci-koupit/` | `lead_koupe` |
| `hypoteka` | `/financovani/` | `lead_hypoteka` |

Kompaktní lišta pod hero na úvodu není samostatný formulář – posílá GET na stránku ocenění
a plný formulář se z parametrů předvyplní.

Společnou klientskou část (UTM z `sessionStorage`, lazy Turnstile, odeslání, chybová hláška)
řeší `src/lib/forms.ts`; nový formulář stačí předat funkci `attachLeadForm()`.

## Měření

`dataLayer` plní: `lead_*` při odeslání, `lead_thankyou` s `lead_type` na poděkování,
`call_click` (klik na telefon), `filter_change` (filtr ve výpisu), `gallery_open` (lightbox),
`map_show` / `map_click`, `embed_play`, `share_click`.

GTM se načte **až po souhlasu** s cookies; Consent Mode v2 je předtím nastavený na `denied`
(`src/components/CookieBar.astro`). ID kontejneru se vyplňuje v `src/data/site.ts` (`gtmId`) –
prázdná hodnota znamená, že se GTM nenačte vůbec.

Mapa, YouTube i 3D prohlídka se načítají až po kliknutí, takže bez souhlasu neodejde
požadavek na cizí doménu.
