/**
 * Kontrola, že se do produkčního buildu nedostaly rozpracované texty
 * (akceptační kritérium 11 zadání). Spouští se nad hotovou složkou dist/:
 *
 *   npm run build && npm run check:texty
 *
 * Dokud web běží na ukázkovém obsahu, kontrola bude hlásit nálezy – to je v pořádku.
 * Před ostrým spuštěním musí projít bez chyby (v GitHub Actions se pak zapne jako blokující).
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const DIST = 'dist';
const VZORY = [
  { re: /\bTODO\b/gi, popis: 'nedodělaný text (TODO)' },
  { re: /lorem ipsum/gi, popis: 'výplňový text (lorem ipsum)' },
  { re: /ukázkov[áéýíou]\w*/gi, popis: 'zmínka o ukázkovém obsahu' },
  { re: /\bXXXX+\b/g, popis: 'nevyplněný zástupný kód' },
  { re: /\+420 000 000 000|00000000/g, popis: 'nevyplněný telefon nebo IČO' },
];

const nalezy = [];

async function projdi(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      await projdi(full);
      continue;
    }
    if (!/\.(html|xml|txt)$/.test(e.name)) continue;

    const text = await readFile(full, 'utf8');
    for (const { re, popis } of VZORY) {
      const m = text.match(re);
      if (m) nalezy.push(`${full} – ${popis}: ${[...new Set(m)].slice(0, 3).join(', ')}`);
    }
  }
}

try {
  await projdi(DIST);
} catch {
  console.error(`✖ Složka ${DIST}/ neexistuje – nejdřív spusťte npm run build.`);
  process.exit(1);
}

if (nalezy.length) {
  console.error(`\n✖ V produkčním buildu jsou rozpracované texty (${nalezy.length}):\n`);
  for (const n of nalezy) console.error(`   ${n}`);
  console.error('\n   Doplňte skutečné texty a údaje (src/data/site.ts, právní stránky, obsah).\n');
  process.exit(1);
}

console.log('✓ V buildu nejsou žádné rozpracované texty.');
