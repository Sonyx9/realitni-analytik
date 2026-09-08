/**
 * Centrální údaje o webu. Vše, co je označeno TODO, doplní klient před spuštěním.
 */
export const site = {
  name: 'Realitní analytik',
  tagline: 'Prodej nemovitostí podložený daty',
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
  /** Endpoint formulářů – viz zadání (Cloudflare Worker / Formspree). TODO */
  formEndpoint: '/api/lead',
} as const;

export const nav = [
  { label: 'Nemovitosti', href: '/nemovitosti/' },
  { label: 'Jak prodáváme', href: '/jak-prodavame/' },
  { label: 'Ocenění zdarma', href: '/oceneni-nemovitosti-zdarma/' },
  { label: 'O nás', href: '/o-nas/' },
  { label: 'Analýzy trhu', href: '/analyzy/' },
  { label: 'Kontakt', href: '/kontakt/' },
] as const;
