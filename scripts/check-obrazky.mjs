/**
 * Kontrola fotografií v obsahu – běží automaticky před každým buildem (npm skript `prebuild`)
 * a v GitHub Actions u každého pull requestu.
 *
 * Hlídá dvě věci, které se snadno stanou a rozbijí web až v produkci:
 *  1. do složky nemovitosti se dostane JPG/PNG/HEIC přímo z fotoaparátu (build pak trvá minuty),
 *  2. soubor je větší než 500 kB (zbytečně nafouklý repozitář a pomalý build).
 *
 * Řešení obojího je stejné: spustit `npm run images:optimize`.
 */
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = 'src/content';
const MAX_KB = Number(process.env.MAX_KB ?? 500);
const OBRAZKY = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif', '.tif', '.tiff', '.gif', '.bmp', '.avif', '.webp']);

const chyby = [];

async function projdi(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      await projdi(full);
      continue;
    }
    const ext = path.extname(e.name).toLowerCase();
    if (!OBRAZKY.has(ext)) continue;

    if (ext !== '.webp') {
      chyby.push(`${full} – formát ${ext} (v obsahu smí být jen .webp)`);
      continue;
    }
    const { size } = await stat(full);
    if (size > MAX_KB * 1024) {
      chyby.push(`${full} – ${(size / 1024).toFixed(0)} kB (limit je ${MAX_KB} kB)`);
    }
  }
}

await projdi(ROOT);

if (chyby.length) {
  console.error(`\n✖ Fotografie v obsahu neprošly kontrolou (${chyby.length}):\n`);
  for (const c of chyby) console.error(`   ${c}`);
  console.error(`\n   Spusťte:  npm run images:optimize\n   Skript fotky zmenší, převede na WebP a opraví odkazy v index.md.\n`);
  process.exit(1);
}

console.log(`✓ Fotografie v obsahu jsou v pořádku (WebP, do ${MAX_KB} kB).`);
