import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '@/data/site';

export const GET: APIRoute = async ({ site: siteUrl }) => {
  const posts = (await getCollection('blog')).sort((a, b) => b.data.datum.getTime() - a.data.datum.getTime());
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const items = posts
    .map((p) => `<item><title>${esc(p.data.title)}</title><link>${siteUrl}blog/${p.id}/</link><guid>${siteUrl}blog/${p.id}/</guid><pubDate>${p.data.datum.toUTCString()}</pubDate><description>${esc(p.data.perex)}</description></item>`)
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(site.name)} – blog</title><link>${siteUrl}blog/</link><description>Analýzy trhu, rady k prodeji a novinky – Vyškov, Brno, Praha</description><language>cs</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
