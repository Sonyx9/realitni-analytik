/**
 * Centrální údaje o webu. Vše, co je označeno TODO, doplní klient před spuštěním.
 */
export const site = {
  name: 'Realitní analytik',
  tagline: 'Prodej nemovitostí podložený daty',
  /**
   * Logo klienta (červené logo na bílém poli). Dodat jako SVG do public/images/ a vyplnit cestu –
   * Logo.astro pak místo výchozí značky vykreslí obrázek. Světlá varianta (bílá) pro tmavou patičku.
   */
  logo: '', // TODO např. '/images/logo.svg'
  logoLight: '', // TODO např. '/images/logo-white.svg'
  url: 'https://realitni-analytik.cz',
  locale: 'cs_CZ',
  broker: {
    name: 'Ing. Petr Dřímal',
    shortName: 'Petr Dřímal',
    role: 'realitní analytik a makléř',
    phone: '+420 000 000 000', // TODO doplnit
    phoneHref: 'tel:+420000000000', // TODO doplnit
    email: 'petr@realitni-analytik.cz', // TODO ověřit
    ico: '00000000', // TODO doplnit
    address: 'Vyškov-Nosálovice', // TODO doplnit ulici a PSČ
    regions: ['Vyškov a okolí', 'Brno a Jihomoravský kraj', 'Praha'],
    yearsOnMarket: 12,
    valuationsDone: 2500,
    photo: '/images/petr-drimal.jpg', // TODO nahradit skutečnou fotografií (min. 1200 px, WebP)
  },
  social: {
    facebook: 'https://www.facebook.com/', // TODO
    instagram: 'https://www.instagram.com/', // TODO
    linkedin: 'https://www.linkedin.com/', // TODO
  },
  /** Odkaz na profil na Sreality (adresář) */
  sreality:
    'https://www.sreality.cz/adresar/realitni-analytik-cz-vyskov-nosalovice/70763',
  /** Google recenze – odkaz na "Napsat recenzi" / profil firmy. TODO */
  googleReviews: '',
  /** Endpoint formulářů – Cloudflare Pages Function `functions/api/lead.ts`. */
  formEndpoint: '/api/lead',
  /**
   * Veřejný site key Cloudflare Turnstile (ochrana formulářů proti spamu).
   * Prázdná hodnota = widget se nevykreslí a server ověření přeskočí (vývoj, staging bez účtu).
   * Tajný klíč patří do proměnné prostředí TURNSTILE_SECRET – nikdy do repozitáře.
   * TODO doplnit po založení widgetu v Cloudflare → Turnstile.
   */
  turnstileSiteKey: '',
  /**
   * ID kontejneru Google Tag Manageru. Prázdná hodnota = GTM se nenačte vůbec
   * (web pak neposílá žádná data třetí straně). TODO doplnit před spuštěním.
   */
  gtmId: '',
} as const;

export const nav = [
  { label: 'Nemovitosti', href: '/nemovitosti/' },
  { label: 'Prodej', href: '/jak-prodavame/' },
  { label: 'Ocenění', href: '/oceneni-nemovitosti-zdarma/' },
  { label: 'Financování', href: '/financovani/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'O nás', href: '/o-nas/' },
  { label: 'Kontakt', href: '/kontakt/' },
] as const;

/** Služby – pro sekci na úvodu a strukturovaná data. */
export const sluzby = [
  { slug: 'prodej', title: 'Prodej nemovitosti', href: '/jak-prodavame/', text: 'Ocenění z dat, příprava nemovitosti, profesionální prezentace, prohlídky, právní servis s úschovou a předání. Provize až po prodeji.' },
  { slug: 'oceneni', title: 'Ocenění nemovitosti', href: '/oceneni-nemovitosti-zdarma/', text: 'Za kolik se vaše nemovitost skutečně prodá – s podklady, které vám ukážu, ne odhad od stolu. Zdarma, do 2 pracovních dnů, bez závazku.' },
  { slug: 'financovani', title: 'Financování a hypotéka', href: '/financovani/', text: 'Porovnání nabídek bank, předschválení úvěru před prohlídkou, refinancování. Pro kupující našich nemovitostí i pro kohokoli jiného.' },
] as const;
