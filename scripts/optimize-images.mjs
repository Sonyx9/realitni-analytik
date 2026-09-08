/**
 * Předzpracování fotografií nemovitostí.
 *
 * Použití:  npm run images:optimize            (projde všechny složky v src/content/nemovitosti)
 *           npm run images:optimize -- <slug>  (jen jednu nemovitost)
 *           npm run images:optimize -- --force (znovu zpracuje i to, co je v manifestu)
 *
 * Co dělá: každý JPG/PNG/HEIC/WebP zmenší na max. 2000 px po delší straně, převede na WebP
 * a iterativně snižuje kvalitu, dokud soubor není pod MAX_KB (výchozí 500 kB).
 * Původní soubor nahradí souborem .webp a upraví odkazy v index.md (01.jpg -> 01.webp).
 * Astro pak při buildu z těchto WebP generuje responzivní varianty (srcset), takže na webu
 * se nikdy nenačte větší soubor, než je potřeba.
 *
 * Proč to dělat před commitem: fotky od fotografa mívají 5–15 MB; do repozitáře patří jen
 * optimalizované originály, build je pak rychlý a repo malé.
 *
 * Manifest (.optimized.json): u každé hotové fotky si pamatujeme otisk (SHA-256) jejího obsahu.
 * Při dalším spuštění se soubor se známým otiskem přeskočí, takže opakované spuštění skriptu
 * fotky znovu nepřekóduje – jinak by každý průchod ubral kus kvality.
 */
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readdir, stat, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';

const ROOT = 'src/content/nemovitosti';
const MANIFEST = path.join(ROOT, '.optimized.json');
const MAX_KB = Number(process.env.MAX_KB ?? 500);
const MAX_EDGE = Number(process.env.MAX_EDGE ?? 2000);

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.find((a) => !a.startsWith('--'));

const exts = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif', '.tif', '.tiff', '.webp']);

const sha = (buf) => createHash('sha256').update(buf).digest('hex');

async function loadManifest() {
  try {
    return JSON.parse(await readFile(MANIFEST, 'utf8'));
  } catch {
    return {};
  }
}

async function optimizeFile(file, buf) {
  let meta;
  try {
    meta = await sharp(buf, { failOn: 'none' }).metadata();
  } catch (err) {
    // HEIC potřebuje sharp s libheif; na některých systémech chybí – viz README.
    if (path.extname(file).toLowerCase().startsWith('.hei')) {
      throw new Error(
        `${path.basename(file)}: tuhle knihovnu sharp neumí přečíst formát HEIC.\n` +
          `   Převeďte fotku v telefonu na JPG (iPhone: Nastavení → Fotoaparát → Formáty → Nejkompatibilnější)\n` +
          `   nebo v Náhledu na Macu (Soubor → Exportovat → JPEG). Původní chyba: ${err.message}`
      );
    }
    throw err;
  }

  const out = file.replace(/\.[^.]+$/, '.webp');
  let quality = 82;
  let outBuf;
  for (;;) {
    outBuf = await sharp(buf, { failOn: 'none' })
      .rotate() // aplikuje EXIF orientaci
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality, effort: 5 })
      .toBuffer();
    if (outBuf.length <= MAX_KB * 1024 || quality <= 40) break;
    quality -= 6;
  }

  await writeFile(out, outBuf);
  if (out !== file) await unlink(file);

  const zmena = `${(buf.length / 1024).toFixed(0)} → ${(outBuf.length / 1024).toFixed(0)} kB`;
  console.log(`  ${path.basename(out)}  ${meta.width}×${meta.height}  q${quality}  ${zmena}`);
  if (outBuf.length > MAX_KB * 1024) {
    console.warn(`  ⚠ ${path.basename(out)} má i při kvalitě 40 přes ${MAX_KB} kB – zkuste fotku oříznout.`);
  }

  return { from: path.basename(file), to: path.basename(out), hash: sha(outBuf) };
}

async function processDir(dir, manifest) {
  let files;
  try {
    files = (await readdir(dir)).filter((f) => exts.has(path.extname(f).toLowerCase())).sort();
  } catch {
    console.error(`Složka ${dir} neexistuje.`);
    process.exitCode = 1;
    return;
  }

  const slug = path.basename(dir);
  const renames = [];
  let skipped = 0;

  for (const f of files) {
    const full = path.join(dir, f);
    const buf = await readFile(full);
    const key = `${slug}/${f}`;

    // Soubor, který jsme už jednou zpracovali a od té doby se nezměnil, necháme být.
    if (!force && manifest[key] === sha(buf)) {
      skipped++;
      continue;
    }

    // WebP, které už limity splňuje (např. přišlo hotové odjinud), taky nepřekódováváme –
    // jen si ho zapíšeme do manifestu, ať ho příště poznáme rovnou.
    if (!force && path.extname(f).toLowerCase() === '.webp' && buf.length <= MAX_KB * 1024) {
      const { width = 0, height = 0 } = await sharp(buf, { failOn: 'none' }).metadata();
      if (Math.max(width, height) <= MAX_EDGE) {
        manifest[key] = sha(buf);
        skipped++;
        continue;
      }
    }

    const r = await optimizeFile(full, buf);
    delete manifest[key];
    manifest[`${slug}/${r.to}`] = r.hash;
    if (r.from !== r.to) renames.push(r);
  }

  if (renames.length) {
    const md = path.join(dir, 'index.md');
    try {
      let text = await readFile(md, 'utf8');
      for (const r of renames) text = text.split(`./${r.from}`).join(`./${r.to}`);
      await writeFile(md, text);
    } catch {
      /* složka bez index.md – jen fotky */
    }
  }

  if (skipped) console.log(`  (${skipped}× beze změny)`);
}

const manifest = await loadManifest();
const dirs = only
  ? [only]
  : (await readdir(ROOT, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);

for (const d of dirs) {
  console.log(`${d}:`);
  await processDir(path.join(ROOT, d), manifest);
}

// Z manifestu vyhodíme záznamy o souborech, které už v repozitáři nejsou.
for (const key of Object.keys(manifest)) {
  const exists = await stat(path.join(ROOT, key)).catch(() => null);
  if (!exists) delete manifest[key];
}
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

console.log('Hotovo.');
