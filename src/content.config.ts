import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * NEMOVITOSTI
 * Každá nemovitost = složka src/content/nemovitosti/<slug>/ s index.md a obrázky.
 * Obrázky se odkazují relativně (./01.jpg) a Astro je při buildu převede na WebP.
 */
const nemovitosti = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/nemovitosti' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(90),
      /** Krátký podtitul do karty, např. "Byt 3+kk s lodžií, 2. patro" */
      subtitle: z.string().max(120).optional(),
      status: z.enum(['aktivni', 'rezervovano', 'prodano', 'pronajato']).default('aktivni'),
      nabidka: z.enum(['prodej', 'pronajem']).default('prodej'),
      typ: z.enum(['byt', 'dum', 'pozemek', 'komercni', 'rekreacni', 'ostatni']),
      /** Cena v Kč. Null = "cena na vyžádání" / "informace u makléře". */
      cena: z.number().int().nonnegative().nullable().default(null),
      cenaPoznamka: z.string().max(80).optional(), // např. "včetně provize a právního servisu"
      cenaZaMesic: z.boolean().default(false), // pronájem
      lokalita: z.object({
        obec: z.string(),
        castObce: z.string().optional(),
        okres: z.string(),
        kraj: z.string(),
        ulice: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
      }),
      dispozice: z.string().optional(), // "3+kk"
      plocha: z.number().positive().optional(), // užitná m²
      plochaPozemku: z.number().positive().optional(), // m²
      podlazi: z.number().int().optional(),
      pocetPodlazi: z.number().int().optional(),
      stav: z.string().optional(), // "po rekonstrukci", "novostavba", "dobrý"
      vlastnictvi: z.enum(['osobni', 'druzstevni', 'statni', 'jine']).optional(),
      konstrukce: z.string().optional(), // "cihlová", "panelová", "dřevostavba"
      energetickaTrida: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).optional(),
      vybaveni: z.array(z.string()).default([]), // "balkon", "sklep", "garáž"…
      /** Další volné parametry do tabulky (label/value) */
      parametry: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
      obrazky: z.array(image()).min(1),
      obrazkyAlt: z.array(z.string()).optional(),
      pudorys: image().optional(),
      video: z.url().optional(), // YouTube/Vimeo
      prohlidka3d: z.url().optional(), // Matterport apod.
      datum: z.coerce.date(),
      featured: z.boolean().default(false),
      /** ID inzerátu pro budoucí XML feed / párování s CRM */
      externiId: z.string().optional(),
    }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      perex: z.string().max(220),
      datum: z.coerce.date(),
      kategorie: z.enum(['analyza', 'rady', 'novinky']).default('analyza'),
      lokalita: z.string().optional(), // "Vyškov", "Brno", "Praha"
      cover: image().optional(),
      tags: z.array(z.string()).default([]),
    }),
});

const reference = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/reference' }),
  schema: z.object({
    jmeno: z.string(),
    misto: z.string(), // "Vyškov", "Rousínov"
    typ: z.string().optional(), // "prodej rodinného domu"
    hodnoceni: z.number().min(1).max(5).default(5),
    datum: z.coerce.date(),
    zdroj: z.enum(['google', 'email', 'osobne']).default('osobne'),
  }),
});

export const collections = { nemovitosti, blog, reference };
