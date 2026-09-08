import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getImage } from 'astro:assets';

/**
 * Jednoduchý XML export nabídky (vlastní schéma). Připraveno pro budoucí napojení
 * na portály / CRM – mapování na konkrétní formát (např. Sreality import) doplní programátor
 * podle dokumentace daného portálu. Generuje se při buildu.
 */
export const GET: APIRoute = async ({ site }) => {
  const items = (await getCollection('nemovitosti')).filter((n) => n.data.status === 'aktivni' || n.data.status === 'rezervovano');
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const parts: string[] = [];
  for (const n of items) {
    const d = n.data;
    const imgs = await Promise.all(d.obrazky.map((i) => getImage({ src: i, width: 1600, format: 'webp', quality: 80 })));
    parts.push(`<nemovitost id="${esc(d.externiId ?? n.id)}">
  <url>${site}nemovitosti/${n.id}/</url>
  <nazev>${esc(d.title)}</nazev>
  <typ>${d.typ}</typ><nabidka>${d.nabidka}</nabidka><stav>${d.status}</stav>
  <cena mena="CZK"${d.cenaZaMesic ? ' obdobi="mesic"' : ''}>${d.cena ?? ''}</cena>
  <obec>${esc(d.lokalita.obec)}</obec><okres>${esc(d.lokalita.okres)}</okres><kraj>${esc(d.lokalita.kraj)}</kraj>
  ${d.lokalita.lat ? `<gps lat="${d.lokalita.lat}" lng="${d.lokalita.lng}"/>` : ''}
  ${d.dispozice ? `<dispozice>${esc(d.dispozice)}</dispozice>` : ''}${d.plocha ? `<plocha>${d.plocha}</plocha>` : ''}${d.plochaPozemku ? `<plocha_pozemku>${d.plochaPozemku}</plocha_pozemku>` : ''}
  <popis>${esc(n.body ?? '')}</popis>
  <obrazky>${imgs.map((i) => `<obrazek>${site}${i.src.replace(/^\//, '')}</obrazek>`).join('')}</obrazky>
  <aktualizovano>${d.datum.toISOString()}</aktualizovano>
</nemovitost>`);
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<nemovitosti generovano="${new Date().toISOString()}">\n${parts.join('\n')}\n</nemovitosti>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
