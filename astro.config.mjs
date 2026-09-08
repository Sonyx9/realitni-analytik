// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://realitni-analytik.cz',
  trailingSlash: 'always',
  redirects: {
    '/analyzy': '/blog',
    '/analyzy/[slug]': '/blog/[slug]',
  },
  integrations: [sitemap()],
  image: {
    // sharp je výchozí služba; formáty a šířky řídíme v komponentách
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
