/**
 * Sdílená logika lead endpointu – validace, texty e-mailů, rate limit.
 * Soubory ve složce `_lib` Cloudflare Pages nesměruje na URL (podtržítko = privátní).
 */

export interface Env {
  /** E-mail makléře – kam chodí leady. */
  MAIL_TO: string;
  /** Kopie (např. lukas.koula@…). Nepovinné, více adres oddělit čárkou. */
  MAIL_CC?: string;
  /** Odesílatel, musí být na ověřené doméně v Resendu. Např. "Realitní analytik <web@realitni-analytik.cz>" */
  MAIL_FROM: string;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET?: string;
  /** Apps Script / Airtable webhook pro zápis leadu do tabulky. */
  SHEETS_WEBHOOK_URL?: string;
  /** KV namespace pro rate limit. Není-li nabindovaný, limit běží jen v paměti isolate. */
  LEADS_KV?: KVNamespace;
}

export type FormId = 'oceneni' | 'zajem' | 'kontakt' | 'koupe' | 'hypoteka';

export const FORM_LABEL: Record<FormId, string> = {
  oceneni: 'Ocenění',
  zajem: 'Zájem o nemovitost',
  kontakt: 'Kontakt',
  koupe: 'Poptávka kupujícího',
  hypoteka: 'Financování / hypotéka',
};

/** Pořadí a české popisky polí v e-mailu. Neznámá pole se připojí na konec. */
export const FIELD_LABEL: Record<string, string> = {
  jmeno: 'Jméno',
  telefon: 'Telefon',
  email: 'E-mail',
  predmet: 'Nemovitost',
  typ: 'Typ nemovitosti',
  obec: 'Obec / adresa',
  plocha: 'Plocha (m²)',
  dispozice: 'Dispozice',
  stav: 'Stav',
  plan: 'Kdy plánuje prodat',
  vybaveni: 'Součástí je',
  poznamka: 'Poznámka',
  zprava: 'Zpráva',
  utm_source: 'UTM source',
  utm_medium: 'UTM medium',
  utm_campaign: 'UTM campaign',
  utm_content: 'UTM content',
  utm_term: 'UTM term',
  stranka: 'Odesláno ze stránky',
};

/** Pole, která se do e-mailu ani do tabulky nepřepisují. */
const SKIP_FIELDS = new Set(['website', 'souhlas', 'form', 'cf-turnstile-response']);

export interface LeadData {
  form: FormId;
  jmeno: string;
  email: string;
  telefon: string;
  /** Všechna ostatní vyplněná pole v pořadí podle FIELD_LABEL. */
  fields: { key: string; label: string; value: string }[];
  raw: Record<string, string>;
}

export class ValidationError extends Error {}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function parseLead(fd: FormData): LeadData {
  const raw: Record<string, string> = {};
  for (const key of new Set([...fd.keys()])) {
    if (SKIP_FIELDS.has(key)) continue;
    // vybaveni[] a další vícehodnotová pole spojíme čárkou
    const values = fd.getAll(key).map((v) => String(v).trim()).filter(Boolean);
    if (values.length) raw[key] = values.join(', ');
  }

  const form = (String(fd.get('form') ?? 'kontakt') as FormId);
  if (!(form in FORM_LABEL)) throw new ValidationError('Neznámý typ formuláře.');

  const jmeno = raw.jmeno ?? '';
  const email = raw.email ?? '';
  const telefon = raw.telefon ?? '';

  if (jmeno.length < 2) throw new ValidationError('Vyplňte prosím jméno.');
  if (!EMAIL_RE.test(email)) throw new ValidationError('E-mail nevypadá správně.');
  if ((telefon.match(/\d/g) ?? []).length < 9) throw new ValidationError('Telefon musí mít alespoň 9 číslic.');
  if (String(fd.get('souhlas') ?? '') === '') throw new ValidationError('Bez souhlasu se zpracováním údajů nemůžeme zprávu přijmout.');

  const order = Object.keys(FIELD_LABEL);
  const fields = Object.entries(raw)
    .sort(([a], [b]) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    })
    .map(([key, value]) => ({ key, label: FIELD_LABEL[key] ?? key, value }));

  return { form, jmeno, email, telefon, fields, raw };
}

/** Předmět e-mailu: "[Web] Ocenění – Vyškov, byt 74 m²" */
export function subjectFor(lead: LeadData): string {
  const r = lead.raw;
  const detail: string[] = [];
  if (lead.form === 'zajem' && r.predmet) {
    detail.push(r.predmet);
  } else {
    if (r.obec) detail.push(r.obec);
    if (r.typ) detail.push(TYP_TEXT[r.typ] ?? r.typ);
    if (r.plocha) detail.push(`${r.plocha} m²`);
  }
  if (!detail.length) detail.push(lead.jmeno);
  return `[Web] ${FORM_LABEL[lead.form]} – ${detail.join(', ')}`;
}

const TYP_TEXT: Record<string, string> = {
  byt: 'byt',
  dum: 'dům',
  pozemek: 'pozemek',
  komercni: 'komerční',
  rekreacni: 'chata / chalupa',
  jine: 'jiné',
  ostatni: 'ostatní',
};

const PRAHA = 'Europe/Prague';

export function nowCz(): string {
  return new Intl.DateTimeFormat('cs-CZ', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: PRAHA,
  }).format(new Date());
}

/** Textový e-mail makléři – všechna pole a čas. */
export function brokerEmailText(lead: LeadData, meta: { ip: string; userAgent: string }): string {
  const lines = [
    `Nový lead z webu – ${FORM_LABEL[lead.form]}`,
    `Přijato: ${nowCz()}`,
    '',
    ...lead.fields.map((f) => `${f.label}: ${f.value}`),
    '',
    '—',
    `Odpovědět můžete přímo na tento e-mail (Reply-To je adresa klienta).`,
    `IP: ${meta.ip}`,
    `Prohlížeč: ${meta.userAgent}`,
  ];
  return lines.join('\n');
}

/** Krátké textové potvrzení klientovi. */
export function clientEmailText(lead: LeadData, broker: { name: string; phone: string }): string {
  const co =
    lead.form === 'oceneni'
      ? 'žádost o ocenění'
      : lead.form === 'zajem'
        ? `zprávu k nemovitosti${lead.raw.predmet ? ` „${lead.raw.predmet}“` : ''}`
        : lead.form === 'hypoteka'
          ? 'dotaz k financování'
          : 'vaši zprávu';
  return [
    `Dobrý den,`,
    ``,
    `děkujeme za ${co}. Ozveme se do 2 pracovních dnů.`,
    `Pokud to spěchá, zavolejte rovnou na ${broker.phone}.`,
    ``,
    `${broker.name}`,
    `Realitní analytik`,
    `${broker.phone}`,
  ].join('\n');
}

export const CLIENT_SUBJECT: Record<FormId, string> = {
  oceneni: 'Přijali jsme vaši žádost o ocenění',
  zajem: 'Přijali jsme váš dotaz k nemovitosti',
  kontakt: 'Přijali jsme vaši zprávu',
  koupe: 'Přijali jsme vaši poptávku',
  hypoteka: 'Přijali jsme váš dotaz k financování',
};

/**
 * Rate limit: max 5 odeslání z jedné IP za 10 minut.
 * S KV je limit sdílený mezi všemi instancemi, bez KV jen v rámci jednoho isolate
 * (lepší než nic, ale pro produkci KV nabindovat – viz NASAZENI.md).
 */
const WINDOW_S = 600;
const MAX_HITS = 5;
const memory = new Map<string, { hits: number; reset: number }>();

export async function rateLimited(ip: string, env: Env): Promise<boolean> {
  const key = `rl:${ip}`;
  if (env.LEADS_KV) {
    const hits = Number((await env.LEADS_KV.get(key)) ?? 0) + 1;
    // expirationTtl obnovujeme při každém zápisu – okno je klouzavé
    await env.LEADS_KV.put(key, String(hits), { expirationTtl: WINDOW_S });
    return hits > MAX_HITS;
  }
  const now = Date.now();
  const rec = memory.get(key);
  if (!rec || rec.reset < now) {
    memory.set(key, { hits: 1, reset: now + WINDOW_S * 1000 });
    return false;
  }
  rec.hits += 1;
  return rec.hits > MAX_HITS;
}

/** Ověření Turnstile tokenu. Bez nastaveného secretu se přeskakuje (dev / staging). */
export async function verifyTurnstile(token: string, ip: string, env: Env): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return true;
  if (!token) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}
