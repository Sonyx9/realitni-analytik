/**
 * Doplní podcestu do odkazů, které jsou ve zdrojácích napsané natvrdo.
 *
 * Používá se JEN pro náhled na GitHub Pages, který běží na podcestě
 * (https://sonyx9.github.io/realitni-analytik/). Ostrý web na vlastní doméně
 * běží v kořeni, tam se skript nespouští a zdrojáky zůstávají čisté.
 *
 * Astro samo podcestu doplní do svých vlastních adres (CSS, obrázky, skripty).
 * Nedoplní ji do odkazů zapsaných ručně, třeba href="/nemovitosti/" – a právě ty
 * tenhle skript dorovná. Co už podcestu má, nechá být.
 *
 * Použití:  BASE_PATH=/realitni-analytik node scripts/base-prefix.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DIST = 'dist';
const BASE = (process.env.BASE_PATH || '').replace(/\/$/, '');

if (!BASE) {
  console.log('BASE_PATH není nastavená – není co doplňovat.');
  process.exit(0);
}

/** Atributy, ve kterých se může objevit adresa na tomto webu. */
const ATTRS = /\b(href|src|action|data-src|poster)="(\/[^"]*)"/g;
/** srcset je seznam „adresa šířka, adresa šířka“. */
const SRCSET = /\bsrcset="([^"]*)"/g;

const uprav = (url) => (url.startsWith(`${BASE}/`) || url === BASE || url.startsWith('//') ? url : BASE + url);

async function soubory(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await soubory(full, out);
    else if (/\.(html|xml)$/.test(e.name)) out.push(full);
  }
  return out;
}

let zmeneno = 0;
let odkazu = 0;

for (const f of await soubory(DIST)) {
  const puvodni = await readFile(f, 'utf8');

  let text = puvodni.replace(ATTRS, (cely, attr, url) => {
    const novy = uprav(url);
    if (novy !== url) odkazu++;
    return `${attr}="${novy}"`;
  });

  text = text.replace(SRCSET, (cely, hodnota) => {
    const novy = hodnota
      .split(',')
      .map((kus) => {
        const [url, ...zbytek] = kus.trim().split(/\s+/);
        if (!url.startsWith('/')) return kus.trim();
        const u = uprav(url);
        if (u !== url) odkazu++;
        return [u, ...zbytek].join(' ');
      })
      .join(', ');
    return `srcset="${novy}"`;
  });

  if (text !== puvodni) {
    await writeFile(f, text);
    zmeneno++;
  }
}

console.log(`✓ Podcesta ${BASE} doplněna do ${odkazu} adres v ${zmeneno} souborech.`);
