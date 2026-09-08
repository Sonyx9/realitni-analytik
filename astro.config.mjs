// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

const NEMOVITOSTI_DIR = 'src/content/nemovitosti';

/**
 * Slugy prodaných a pronajatých nemovitostí. Jejich detaily zůstávají na webu jako reference,
 * ale mají `noindex`, takže nepatří ani do sitemapy. Čteme přímo frontmatter – konfigurace
 * běží dřív než kolekce obsahu, takže getCollection() tu k dispozici není.
 */
function neaktivniSlugy() {
  try {
    return readdirSync(NEMOVITOSTI_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .filter((d) => {
        const md = readFileSync(`${NEMOVITOSTI_DIR}/${d.name}/index.md`, 'utf8');
        return /^status:\s*['"]?(prodano|pronajato)['"]?\s*$/m.test(md);
      })
      .map((d) => d.name);
  } catch {
    return [];
  }
}

const neaktivni = new Set(neaktivniSlugy());

/** Stránky s `noindex` v HTML – viz filtr sitemapy níž. */
const NOINDEX = new Set([
  '/dekujeme/',
  '/ochrana-osobnich-udaju/',
  '/cookies/',
  '/informace-pro-spotrebitele/',
]);

// https://astro.build/config
export default defineConfig({
  site: 'https://realitni-analytik.cz',
  trailingSlash: 'always',
  redirects: {
    '/analyzy': '/blog',
    '/analyzy/[slug]': '/blog/[slug]',
  },
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        // Stránky, které mají v HTML noindex, nepatří ani do sitemapy – jinak si to protiřečí.
        // POZOR: až dodá klient právní texty, smažte `noindex` na těch třech stránkách
        // (patří do indexu, jsou to povinné informace) a zároveň je vyškrtněte odsud.
        if (NOINDEX.has(path)) return false;
        const m = path.match(/^\/nemovitosti\/([^/]+)\/$/);
        return !(m && neaktivni.has(m[1]));
      },
    }),
  ],
  image: {
    // sharp je výchozí služba; formáty a šířky řídíme v komponentách
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
