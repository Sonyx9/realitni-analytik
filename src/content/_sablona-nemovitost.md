---
# ŠABLONA NOVÉ NEMOVITOSTI
#
# Postup:
#   1. Zkopírujte tento soubor do src/content/nemovitosti/<slug>/index.md
#      (slug = adresa stránky: malá písmena bez diakritiky a s pomlčkami,
#       např. "byt-3kk-vyskov-sidliste-osvobozeni")
#   2. Do stejné složky nahrajte fotky a spusťte: npm run images:optimize -- <slug>
#   3. Vyplňte pole níž. Řádky začínající # jsou poznámky, ty smažte nebo nechte být.
#
# Soubor začíná podtržítkem, takže ho web ignoruje – nikde se nezobrazí.
#
# POVINNÁ POLE: title, typ, cena, lokalita (obec, okres, kraj), obrazky, datum.
# Když něco chybí nebo je špatně, build se zastaví a napíše které pole – to je záměr,
# na web se tak nedostane rozbitý inzerát.

# --- Popisky ------------------------------------------------------------------
# H1 stránky a titulek v Googlu. Do 90 znaků. Vzor: druh, dispozice, plocha, obec – část obce.
title: "Prodej bytu 3+kk, 74 m², Vyškov – Sídliště Osvobození"

# Titulek na kartě ve výpisu. Do 120 znaků. Nepovinné, ale doporučené – prodává nabídku.
subtitle: "Světlý byt po rekonstrukci s lodžií a sklepem"

# --- Stav a druh nabídky ------------------------------------------------------
# aktivni | rezervovano | prodano | pronajato
# Prodané zůstávají na webu jako reference (sekce „Nedávno prodáno“), detail dostane noindex.
status: aktivni

# prodej | pronajem
nabidka: prodej

# byt | dum | pozemek | komercni | rekreacni | ostatni   (řídí filtr ve výpisu)
typ: byt

# --- Cena ---------------------------------------------------------------------
# Celé číslo v korunách, bez mezer a bez "Kč". Formátování řeší web.
# Nechcete cenu zveřejnit? Napište:  cena: null  a do cenaPoznamka text, který se zobrazí místo ní.
cena: 4890000
cenaPoznamka: "včetně provize a právního servisu"
# U pronájmu odkomentujte – k ceně se doplní „/ měsíc“:
# cenaZaMesic: true

# --- Kde to je ----------------------------------------------------------------
# Ulici uvádějte jen tehdy, když souhlasí majitel. GPS zaokrouhlujeme na mapě na ~100 m.
lokalita:
  obec: Vyškov
  castObce: Sídliště Osvobození
  okres: Vyškov
  kraj: Jihomoravský kraj      # zároveň filtr „Oblast“ ve výpisu – pište stejně jako u ostatních
  # ulice: "Dědická 12"
  lat: 49.2775
  lng: 16.9989

# --- Parametry (vyplňte jen to, co dává smysl; prázdná pole se nezobrazí) ------
dispozice: "3+kk"
plocha: 74                     # užitná plocha v m²
# plochaPozemku: 812           # u domů a pozemků
podlazi: 3
pocetPodlazi: 4
stav: "po kompletní rekonstrukci (2021)"
vlastnictvi: osobni            # osobni | druzstevni | statni | jine
konstrukce: "cihlová"
energetickaTrida: C            # A–G podle průkazu energetické náročnosti

# Štítky pod popisem. Klidně i deset položek.
vybaveni: ["lodžie", "sklep", "výtah", "parkování před domem", "kuchyňská linka se spotřebiči"]

# Libovolné další řádky tabulky parametrů.
parametry:
  - { label: "Topení", value: "dálkové" }
  - { label: "Voda", value: "veřejný vodovod" }
  - { label: "Měsíční náklady", value: "cca 4 200 Kč (fond oprav + zálohy)" }

# --- Fotografie ---------------------------------------------------------------
# Pořadí je závazné: první fotka je hlavní (karta ve výpisu, náhled při sdílení).
# Názvy musí přesně odpovídat souborům ve složce – po npm run images:optimize jsou to .webp.
obrazky: ["./01.webp", "./02.webp", "./03.webp", "./04.webp"]

# Popisky fotek pro čtečky a Google, ve stejném pořadí. Nepovinné, ale pomáhá SEO.
# obrazkyAlt: ["Obývací pokoj s výhledem na západ", "Kuchyňská linka", "Koupelna", "Lodžie"]

# pudorys: "./pudorys.webp"
# video: "https://www.youtube.com/watch?v=..."      # videoprohlídka
# prohlidka3d: "https://my.matterport.com/show/..." # 3D prohlídka

# --- Ostatní ------------------------------------------------------------------
datum: 2026-08-28              # řadí výpis „od nejnovější“; formát RRRR-MM-DD
featured: false                # true = přednost na úvodní stránce
externiId: "RA-2026-014"       # vaše ID inzerátu (jde do XML exportu)
---

Sem přijde popis nemovitosti. První odstavec je nejdůležitější – čte ho každý. Napište, co je
na nemovitosti podstatné a co člověka z fotek nenapadne: proč je dispozice praktická, kam míří
okna, co se v posledních letech opravovalo.

Funguje **tučné písmo**, odrážky i mezinadpisy přes `##`.

## Co je dobré vědět

Odstavec pro věci, na které se lidé stejně zeptají na prohlídce: stav domu a fondu oprav,
parkování, dostupnost školy a obchodů, hluk, sousedé, zatížení nemovitosti.
Poctivá informace tady ušetří tři telefonáty.

## Proč tato cena

Tenhle odstavec nechte u každé nemovitosti – je to podpis značky a odlišuje nás od ostatních
inzerátů. Napište, z čeho cena vychází: realizované prodeje srovnatelných nemovitostí
v okolí za posledních 12 měsíců, ne nabídkové ceny z inzerce.
