// Vygeneruje ukázkové (placeholder) fotografie pro demo obsah. Před nasazením smazat.
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const palettes = [
  ['#c9c2b6', '#8f8778'], ['#b9c2c9', '#6f7c88'], ['#cfc7b8', '#9a8b6f'],
  ['#c5cbc4', '#7c877a'], ['#d1c9c0', '#8c7f76'], ['#bfc6cc', '#6b7680'],
];
function svg(w, h, [a, b], label, i) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <g opacity="0.18" fill="none" stroke="#ffffff" stroke-width="6">
    <rect x="${w*0.18}" y="${h*0.42}" width="${w*0.64}" height="${h*0.42}"/>
    <path d="M ${w*0.14} ${h*0.44} L ${w*0.5} ${h*0.16} L ${w*0.86} ${h*0.44}"/>
    <rect x="${w*0.44}" y="${h*0.6}" width="${w*0.12}" height="${h*0.24}"/>
  </g>
  <text x="${w/2}" y="${h*0.93}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(h*0.035)}" fill="#ffffff" opacity="0.85">${label} ${i}</text>
</svg>`;
}
const props = ['byt-3kk-vyskov-sidliste-osvobozeni','rodinny-dum-rousinov','stavebni-pozemek-drnovice','byt-2kk-brno-kralovo-pole','chalupa-ruprechtov','byt-4kk-praha-vinohrady'];
for (const [pi, slug] of props.entries()) {
  const dir = `src/content/nemovitosti/${slug}`;
  await mkdir(dir, { recursive: true });
  for (let i = 1; i <= 5; i++) {
    const pal = palettes[(pi + i) % palettes.length];
    const buf = Buffer.from(svg(1800, 1200, pal, 'Ukázková fotografie', i));
    await sharp(buf).jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile(`${dir}/0${i}.jpg`);
  }
}
// portrét makléře (placeholder)
const portrait = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500"><rect width="1200" height="1500" fill="#b9b3a8"/><circle cx="600" cy="560" r="230" fill="#e8e3da"/><path d="M200 1500 C 200 1050 1000 1050 1000 1500 Z" fill="#e8e3da"/><text x="600" y="1420" text-anchor="middle" font-family="Helvetica, Arial" font-size="44" fill="#6b655c">Fotografie makléře (placeholder)</text></svg>`;
await sharp(Buffer.from(portrait)).jpeg({ quality: 90 }).toFile('public/images/petr-drimal.jpg');
// OG default
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#1f2933"/><text x="80" y="300" font-family="Georgia, serif" font-size="72" fill="#ffffff">Realitní analytik</text><text x="80" y="370" font-family="Helvetica, Arial" font-size="32" fill="#c7ccd1">Prodej nemovitostí podložený daty · Vyškov · Brno · Praha</text><rect x="80" y="420" width="120" height="8" fill="#6b1e2f"/></svg>`;
await sharp(Buffer.from(og)).jpeg({ quality: 88 }).toFile('public/og-default.jpg');
console.log('placeholders done');
