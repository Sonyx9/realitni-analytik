/**
 * POST /api/lead – příjem všech formulářů webu (Cloudflare Pages Function).
 *
 * Postup: honeypot → rate limit → validace → Turnstile → e-mail makléři (Resend)
 * → potvrzení klientovi → zápis do tabulky (webhook). Vrací JSON.
 *
 * Proměnné prostředí nastavíte v Cloudflare Pages → Settings → Environment variables,
 * KV namespace LEADS_KV v Settings → Functions → KV namespace bindings. Viz NASAZENI.md.
 */
import { site } from '../../src/data/site';
import {
  brokerEmailText,
  clientEmailText,
  CLIENT_SUBJECT,
  FORM_LABEL,
  nowCz,
  parseLead,
  rateLimited,
  subjectFor,
  ValidationError,
  verifyTurnstile,
  type Env,
  type LeadData,
} from '../_lib/lead';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  const userAgent = request.headers.get('User-Agent') ?? '';

  let fd: FormData;
  try {
    const ct = request.headers.get('Content-Type') ?? '';
    if (ct.includes('multipart/form-data') || ct.includes('application/x-www-form-urlencoded')) {
      fd = await request.formData();
    } else {
      return json({ error: 'Nepodporovaný formát požadavku.' }, 415);
    }
  } catch {
    return json({ error: 'Požadavek se nepodařilo přečíst.' }, 400);
  }

  // 1. Honeypot – robot vyplnil skryté pole. Tváříme se úspěšně, nikam nic neposíláme.
  if (String(fd.get('website') ?? '').trim() !== '') return json({ ok: true });

  // 2. Rate limit
  if (ip && (await rateLimited(ip, env))) {
    return json({ error: 'Příliš mnoho odeslání. Zkuste to prosím za chvíli, nebo zavolejte.' }, 429);
  }

  // 3. Validace
  let lead: LeadData;
  try {
    lead = parseLead(fd);
  } catch (e) {
    if (e instanceof ValidationError) return json({ error: e.message }, 422);
    return json({ error: 'Formulář se nepodařilo zpracovat.' }, 422);
  }

  // 4. Turnstile
  const ok = await verifyTurnstile(String(fd.get('cf-turnstile-response') ?? ''), ip, env);
  if (!ok) return json({ error: 'Nepodařilo se ověřit, že nejste robot. Načtěte stránku znovu.' }, 403);

  // 5. E-mail makléři – bez něj by lead zmizel, proto je jediný krok, který smí selhat nahlas.
  try {
    await sendBrokerMail(lead, env, { ip, userAgent });
  } catch (err) {
    console.error('lead: e-mail makléři selhal', { form: lead.form, err: String(err) });
    return json({ error: 'Zprávu se nepodařilo odeslat. Zkuste to znovu, nebo nám zavolejte.' }, 502);
  }

  // 6. + 7. Potvrzení klientovi a zápis do tabulky jsou doplňkové – chybu jen zalogujeme.
  const extras = await Promise.allSettled([sendClientMail(lead, env), writeToSheet(lead, env, { ip })]);
  extras.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`lead: ${i === 0 ? 'potvrzení klientovi' : 'zápis do tabulky'} selhalo`, String(r.reason));
  });

  return json({ ok: true });
};

/** GET na endpoint nemá smysl – ať se v logu nemíchá s chybami. */
export const onRequestGet: PagesFunction<Env> = () => json({ error: 'Použijte POST.' }, 405);

async function resend(env: Env, payload: Record<string, unknown>): Promise<void> {
  if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY není nastavený');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

function sendBrokerMail(lead: LeadData, env: Env, meta: { ip: string; userAgent: string }) {
  return resend(env, {
    from: env.MAIL_FROM,
    to: env.MAIL_TO.split(',').map((s) => s.trim()).filter(Boolean),
    cc: env.MAIL_CC ? env.MAIL_CC.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
    reply_to: lead.email,
    subject: subjectFor(lead),
    text: brokerEmailText(lead, meta),
  });
}

function sendClientMail(lead: LeadData, env: Env) {
  return resend(env, {
    from: env.MAIL_FROM,
    to: [lead.email],
    reply_to: env.MAIL_TO,
    subject: CLIENT_SUBJECT[lead.form],
    text: clientEmailText(lead, { name: site.broker.name, phone: site.broker.phone }),
  });
}

/** Řádek do Google Sheets přes webhook Apps Scriptu (nebo Airtable). */
async function writeToSheet(lead: LeadData, env: Env, meta: { ip: string }) {
  if (!env.SHEETS_WEBHOOK_URL) return;
  const res = await fetch(env.SHEETS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cas: nowCz(),
      form: lead.form,
      formLabel: FORM_LABEL[lead.form],
      ...lead.raw,
      ip: meta.ip,
    }),
  });
  if (!res.ok) throw new Error(`Sheets ${res.status}`);
}
