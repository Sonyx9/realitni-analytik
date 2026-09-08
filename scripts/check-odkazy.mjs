/**
 * Kontrola odkazů ve vygenerovaném webu (akceptační kritérium 1 zadání).
 *
 *   npm run build && npm run check:odkazy
 *
 * Web je statický, takže „vrací 200“ znamená „ve složce dist/ existuje odpovídající soubor“.
 * Kontroluje se:
 *  1. každá adresa v sitemapě má v dist/ svůj soubor,
 *  2. každý vnitřní odkaz v HTML míří na existující stránku, soubor nebo kotvu,
 *  3. odkazy na stránky dodržují koncové lomítko (trailingSlash: 'always').
 *
 * Externí odkazy (jiná doména, tel:, mailto:) se nekontrolují – ty nemáme pod kontrolou.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const DIST = 'dist';
const chyby = [];

async function souboryHtml(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await souboryHtml(full, out);
    else if (e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const existuje = async (p) => Boolean(await stat(p).catch(() => null));

/** Cesta na webu → soubor v dist/. `/nemovitosti/` → dist/nemovitosti/index.html */
async function ciliExistuje(cesta) {
  const cista = decodeURIComponent(cesta.split('#')[0].split('?')[0]);
  if (cista === '/') return existuje(path.join(DIST, 'index.html'));
  const bezLomitka = cista.replace(/\/$/, '');
  const kandidati = [
    path.join(DIST, bezLomitka, 'index.html'),
    path.join(DIST, bezLomitka),
    path.join(DIST, `${bezLomitka}.html`),
  ];
  for (const k of kandidati) if (await existuje(k)) return true;
  return false;
}

// --- 1. sitemapa ---
const sitemapy = (await readdir(DIST)).filter((f) => /^sitemap.*\.xml$/.test(f));
let vSitemape = 0;
for (const s of sitemapy) {
  const xml = await readFile(path.join(DIST, s), 'utf8');
  for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    if (/sitemap.*\.xml$/.test(loc)) continue; // odkaz z indexu na dílčí sitemapu
    vSitemape++;
    const cesta = new URL(loc).pathname;
    if (!(await ciliExistuje(cesta))) chyby.push(`sitemapa ${s}: ${cesta} – v dist/ chybí soubor`);
  }
}

// --- 2. + 3. vnitřní odkazy v HTML ---
const soubory = await souboryHtml(DIST);
let odkazu = 0;
for (const f of soubory) {
  const html = await readFile(f, 'utf8');
  const stranka = `/${path.relative(DIST, f).replace(/index\.html$/, '').replace(/\\/g, '/')}`;

  for (const [, href] of html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
    if (!href.startsWith('/') || href.startsWith('//')) continue; // externí, tel:, mailto:, #kotva
    odkazu++;

    const cesta = href.split('#')[0].split('?')[0];
    if (!cesta) continue;

    const jeSoubor = /\.[a-z0-9]{2,5}$/i.test(cesta);
    if (!jeSoubor && !cesta.endsWith('/')) {
      chyby.push(`${stranka}: odkaz ${href} nemá koncové lomítko (trailingSlash: 'always')`);
    }
    if (!(await ciliExistuje(cesta))) {
      chyby.push(`${stranka}: odkaz ${href} nikam nevede`);
    }
  }
}

if (chyby.length) {
  console.error(`\n✖ Rozbité odkazy (${chyby.length}):\n`);
  for (const c of [...new Set(chyby)]) console.error(`   ${c}`);
  console.error('');
  process.exit(1);
}

console.log(`✓ Sitemapa (${vSitemape} adres) i vnitřní odkazy (${odkazu}) vedou na existující stránky.`);
