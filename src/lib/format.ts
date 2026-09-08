import type { CollectionEntry } from 'astro:content';

export type Nemovitost = CollectionEntry<'nemovitosti'>;

export const TYP_LABEL: Record<Nemovitost['data']['typ'], string> = {
  byt: 'Byt',
  dum: 'Dům',
  pozemek: 'Pozemek',
  komercni: 'Komerční',
  rekreacni: 'Chata / chalupa',
  ostatni: 'Ostatní',
};

export const STATUS_LABEL: Record<Nemovitost['data']['status'], string> = {
  aktivni: 'V nabídce',
  rezervovano: 'Rezervováno',
  prodano: 'Prodáno',
  pronajato: 'Pronajato',
};

export const VLASTNICTVI_LABEL: Record<string, string> = {
  osobni: 'osobní',
  druzstevni: 'družstevní',
  statni: 'státní / obecní',
  jine: 'jiné',
};

const czk = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 });

export function formatCena(n: Nemovitost): string {
  const { cena, cenaZaMesic, cenaPoznamka } = n.data;
  if (cena === null || cena === undefined) return cenaPoznamka ?? 'Cena na vyžádání';
  return czk.format(cena) + (cenaZaMesic ? ' / měsíc' : '');
}

export function formatPlocha(m2?: number): string {
  return m2 ? `${new Intl.NumberFormat('cs-CZ').format(m2)} m²` : '';
}

/** Krátký řádek pod titulkem karty: "3+kk · 74 m² · Vyškov" bez použití středníkových teček */
export function shortFacts(n: Nemovitost): string[] {
  const d = n.data;
  const out: string[] = [];
  if (d.dispozice) out.push(d.dispozice);
  if (d.plocha) out.push(formatPlocha(d.plocha));
  else if (d.plochaPozemku) out.push(`pozemek ${formatPlocha(d.plochaPozemku)}`);
  return out;
}

export function lokalitaKratce(n: Nemovitost): string {
  const l = n.data.lokalita;
  return l.castObce ? `${l.obec} – ${l.castObce}` : l.obec;
}

export function formatDatum(d: Date): string {
  return new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

/** Řazení: aktivní první, pak rezervované, prodané/pronajaté nakonec; uvnitř podle data sestupně */
const STATUS_ORDER = { aktivni: 0, rezervovano: 1, prodano: 2, pronajato: 2 } as const;
export function sortNemovitosti(list: Nemovitost[]): Nemovitost[] {
  return [...list].sort((a, b) => {
    const s = STATUS_ORDER[a.data.status] - STATUS_ORDER[b.data.status];
    if (s !== 0) return s;
    return b.data.datum.getTime() - a.data.datum.getTime();
  });
}
