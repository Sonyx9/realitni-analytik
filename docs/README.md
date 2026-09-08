# Snímky obrazovky do příručky

Návod v [README.md](../README.md) je psaný tak, aby fungoval i bez obrázků. Při zaškolení
(blok F zadání) se k němu doplní snímky **z repozitáře klienta**, ne z demoverze – jinak
se v nich makléř nepozná.

Co nafotit a kam to patří:

| Soubor | Co má být na snímku | Vloží se do README k části |
|---|---|---|
| `01-clone.png` | GitHub Desktop → File → Clone repository, vybraný repozitář | Co budete potřebovat |
| `02-slozka.png` | Finder / Průzkumník ve složce `src/content/nemovitosti/` s novou složkou | Založte složku |
| `03-fotky.png` | Fotky `01.jpg`–`04.jpg` v nové složce | Nahrajte fotografie |
| `04-terminal.png` | Terminál s během `npm run images:optimize -- <slug>` a výpisem zmenšení | Zmenšete fotky |
| `05-index-md.png` | Otevřený `index.md` s vyplněným frontmatterem | Vyplňte popis |
| `06-commit.png` | GitHub Desktop se seznamem změn a tlačítkem Commit to main | Odešlete změny |
| `07-build.png` | Cloudflare Pages → Deployments s právě proběhlým buildem | Odešlete změny |
| `08-chyba.png` | E-mail z GitHub Actions o spadlém buildu s hláškou o chybějícím poli | Když se něco pokazí |

Snímky ukládejte sem do `docs/` ve formátu PNG, šířka do 1 600 px, a odkazujte je
v README relativně: `![Popis](docs/01-clone.png)`.
