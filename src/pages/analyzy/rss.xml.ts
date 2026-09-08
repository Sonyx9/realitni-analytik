import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '@/data/site';

export const GET: APIRoute = async ({ site: siteUrl }) => {
  const posts = (await getCollection('analyzy')).sort((a, b) => b.data.datum.getTime() - a.data.datum.getTime());
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const items = posts
    .map((p) => `<item><title>${esc(p.data.title)}</title><link>${siteUrl}analyzy/${p.id}/</link><guid>${siteUrl}analyzy/${p.id}/</guid><pubDate>${p.data.datum.toUTCString()}</pubDate><description>${esc(p.data.perex)}</description></item>`)
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(site.name)} – analýzy trhu</title><link>${siteUrl}analyzy/</link><description>Analýzy realitního trhu Vyškov, Brno, Praha</description><language>cs</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
