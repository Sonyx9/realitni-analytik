/**
 * Předzpracování fotografií nemovitostí.
 *
 * Použití:  npm run images:optimize            (projde všechny složky v src/content/nemovitosti)
 *           npm run images:optimize -- <slug>  (jen jednu nemovitost)
 *
 * Co dělá: každý JPG/PNG/HEIC/WebP zmenší na max. 2000 px po delší straně, převede na WebP
 * a iterativně snižuje kvalitu, dokud soubor není pod MAX_KB (výchozí 500 kB).
 * Původní soubor nahradí souborem .webp a upraví odkazy v index.md (01.jpg -> 01.webp).
 * Astro pak při buildu z těchto WebP generuje responzivní varianty (srcset), takže na webu
 * se nikdy nenačte větší soubor, než je potřeba.
 *
 * Proč to dělat před commitem: fotky od fotografa mívají 5–15 MB; do repozitáře patří jen
 * optimalizované originály, build je pak rychlý a repo malé.
 */
import sharp from 'sharp';
import { readdir, stat, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';

const ROOT = 'src/content/nemovitosti';
const MAX_KB = Number(process.env.MAX_KB ?? 500);
const MAX_EDGE = Number(process.env.MAX_EDGE ?? 2000);
const only = process.argv[2];

const exts = new Set(['.jpg', '.jpeg', '.png', '.heic', '.tif', '.tiff', '.webp']);

async function optimizeFile(file) {
  const src = sharp(file, { failOn: 'none' }).rotate(); // rotate() aplikuje EXIF orientaci
  const meta = await src.metadata();
  const out = file.replace(/\.[^.]+$/, '.webp');
  let quality = 82;
  let buf;
  for (;;) {
    buf = await sharp(file, { failOn: 'none' })
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality, effort: 5 })
      .toBuffer();
    if (buf.length <= MAX_KB * 1024 || quality <= 40) break;
    quality -= 6;
  }
  await writeFile(out, buf);
  if (out !== file) await unlink(file);
  const before = (await stat(file).catch(() => null))?.size ?? meta.size ?? 0;
  console.log(`${path.relative(ROOT, out)}  ${meta.width}×${meta.height} → q${quality}, ${(buf.length / 1024).toFixed(0)} kB`);
  return { from: path.basename(file), to: path.basename(out) };
}

async function processDir(dir) {
  const files = (await readdir(dir)).filter((f) => exts.has(path.extname(f).toLowerCase()));
  const renames = [];
  for (const f of files) {
    const full = path.join(dir, f);
    const size = (await stat(full)).size;
    // už optimalizované WebP pod limitem přeskočíme
    if (path.extname(f).toLowerCase() === '.webp' && size <= MAX_KB * 1024) continue;
    renames.push(await optimizeFile(full));
  }
  // přepsat odkazy v index.md
  const md = path.join(dir, 'index.md');
  try {
    let text = await readFile(md, 'utf8');
    for (const r of renames) text = text.split(`./${r.from}`).join(`./${r.to}`);
    await writeFile(md, text);
  } catch { /* složka bez index.md */ }
}

const dirs = only ? [only] : (await readdir(ROOT, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
for (const d of dirs) await processDir(path.join(ROOT, d));
console.log('Hotovo.');
