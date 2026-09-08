import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\nDisallow: /dekujeme/\nSitemap: ${site}sitemap-index.xml\n`, { headers: { 'Content-Type': 'text/plain' } });
