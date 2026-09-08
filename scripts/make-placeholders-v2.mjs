// Placeholdery pro hero a kroky (v2). Před nasazením nahradit fotografiemi od fotografa.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
await mkdir('src/assets', { recursive: true });
const hero = `<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1400">
<defs>
 <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3340"/><stop offset="0.55" stop-color="#6b6a6e"/><stop offset="1" stop-color="#b89a7e"/></linearGradient>
 <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2622"/><stop offset="1" stop-color="#15130f"/></linearGradient>
</defs>
<rect width="2400" height="1400" fill="url(#sky)"/>
<rect y="900" width="2400" height="500" fill="url(#ground)"/>
<g fill="#26231f"><rect x="1250" y="560" width="900" height="360"/><rect x="1450" y="420" width="520" height="160"/></g>
<g fill="#f3c98b" opacity="0.85"><rect x="1300" y="640" width="120" height="200"/><rect x="1470" y="640" width="200" height="200"/><rect x="1720" y="640" width="120" height="200"/><rect x="1900" y="640" width="180" height="200"/><rect x="1500" y="460" width="140" height="90"/><rect x="1720" y="460" width="140" height="90"/></g>
<g fill="#1c1a17"><ellipse cx="500" cy="880" rx="420" ry="220"/><ellipse cx="200" cy="820" rx="260" ry="200"/></g>
<text x="60" y="1350" font-family="Helvetica, Arial" font-size="34" fill="#ffffff" opacity="0.6">Placeholder – hero fotografie: nemovitost za soumraku (dodá fotograf)</text>
</svg>`;
await sharp(Buffer.from(hero)).jpeg({ quality: 86 }).toFile('src/assets/hero-dusk.jpg');
const kroky = [['#7a7266','#4b463e','Ocenění: makléř s podklady'],['#8b7d6b','#5b5247','Příprava: řemeslník / malování'],['#6d7a80','#3f4a50','Prezentace: fotograf v interiéru'],['#8a8078','#4e4640','Předání klíčů']];
for (const [i,[a,b,l]] of kroky.entries()) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="1200" height="1200" fill="url(#g)"/><text x="600" y="1140" text-anchor="middle" font-family="Helvetica, Arial" font-size="34" fill="#ffffff" opacity="0.75">Placeholder – ${l}</text></svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toFile(`src/assets/krok-${i+1}.jpg`);
}
// portrét v tmavém prostředí
const portrait = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3733"/><stop offset="1" stop-color="#1f1d1a"/></linearGradient></defs><rect width="1200" height="1500" fill="url(#g)"/><circle cx="600" cy="560" r="230" fill="#d8cfc2"/><path d="M200 1500 C 200 1050 1000 1050 1000 1500 Z" fill="#cfc5b6"/><text x="600" y="1440" text-anchor="middle" font-family="Helvetica, Arial" font-size="40" fill="#ffffff" opacity="0.7">Placeholder – portrét makléře (dodá fotograf)</text></svg>`;
await sharp(Buffer.from(portrait)).jpeg({ quality: 88 }).toFile('public/images/petr-drimal.jpg');
console.log('ok');
