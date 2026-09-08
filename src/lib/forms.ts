/**
 * Klientská logika formulářů – sdílí ji LeadForm i ValuationForm.
 *
 * Řeší tři věci, které mají oba formuláře společné:
 *  1. UTM parametry (uložené ze vstupní stránky) a adresu stránky, ze které se odesílá,
 *  2. Turnstile – skript se načte až při první interakci s formulářem, ne při načtení stránky,
 *  3. samotné odeslání: POST na endpoint, chybová hláška ze serveru, událost do dataLayeru.
 */
import { site } from '@/data/site';

const UTM_KEY = 'ra-utm';
const UTM_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

/** Zapíše UTM parametry z URL do sessionStorage. Volá se jednou při vstupu na web. */
export function captureUtm(): void {
  try {
    const params = new URLSearchParams(location.search);
    const found: Record<string, string> = {};
    for (const f of UTM_FIELDS) {
      const v = params.get(f);
      if (v) found[f] = v.slice(0, 120);
    }
    // Bez UTM v URL neděláme nic – původní zdroj návštěvy zůstane zachovaný.
    if (Object.keys(found).length) sessionStorage.setItem(UTM_KEY, JSON.stringify(found));
  } catch {}
}

function readUtm(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(UTM_KEY) ?? '{}');
  } catch {
    return {};
  }
}

/* ---------------------------------- Turnstile ---------------------------------- */

interface TurnstileApi {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id?: string): void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
    onloadTurnstile?: () => void;
  }
}

const SITE_KEY = site.turnstileSiteKey;
const widgets = new WeakMap<HTMLElement, { id: string; token: string }>();
let scriptRequested = false;

function renderWidgets() {
  if (!window.turnstile) return;
  document.querySelectorAll<HTMLElement>('[data-turnstile]').forEach((el) => {
    if (widgets.has(el)) return;
    const record = { id: '', token: '' };
    record.id = window.turnstile!.render(el, {
      sitekey: SITE_KEY,
      // Ověření proběhne na pozadí; výzva se ukáže jen tomu, kdo vypadá podezřele.
      appearance: 'interaction-only',
      callback: (token: string) => { record.token = token; },
      'expired-callback': () => { record.token = ''; },
      'error-callback': () => { record.token = ''; },
    });
    widgets.set(el, record);
  });
}

/** Načte Turnstile až ve chvíli, kdy se návštěvník formuláře skutečně dotkne. */
function loadTurnstile() {
  if (!SITE_KEY || scriptRequested) return;
  scriptRequested = true;
  window.onloadTurnstile = renderWidgets;
  const s = document.createElement('script');
  s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstile&render=explicit';
  s.async = true;
  s.defer = true;
  document.head.appendChild(s);
}

/** Počká na token (Turnstile ho obvykle vydá do vteřiny). Prázdný řetězec = nepodařilo se. */
async function turnstileToken(form: HTMLFormElement): Promise<string> {
  const el = form.querySelector<HTMLElement>('[data-turnstile]');
  if (!SITE_KEY || !el) return '';
  loadTurnstile();
  for (let i = 0; i < 100; i++) {
    renderWidgets();
    const token = widgets.get(el)?.token;
    if (token) return token;
    await new Promise((r) => setTimeout(r, 100));
  }
  return '';
}

/* ---------------------------------- Odeslání ---------------------------------- */

/**
 * Připojí k formuláři odesílání přes fetch. Formulář musí mít skryté pole `form`,
 * prvek [data-form-error] pro hlášku a tlačítko type=submit.
 *
 * @param validate  vlastní kontrola před odesláním (vícekrokový formulář kontroluje jen aktuální krok)
 */
export function attachLeadForm(form: HTMLFormElement, validate?: () => boolean): void {
  const err = form.querySelector<HTMLElement>('[data-form-error]');
  const btn = form.querySelector<HTMLButtonElement>('button[type=submit]');
  const formId = (form.elements.namedItem('form') as HTMLInputElement | null)?.value ?? 'kontakt';

  // Turnstile načteme při první interakci – ne dřív, ať se nezdržuje načtení stránky.
  const wake = () => loadTurnstile();
  form.addEventListener('focusin', wake, { once: true });
  form.addEventListener('pointerdown', wake, { once: true });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (validate ? !validate() : !form.checkValidity()) {
      if (!validate) form.reportValidity();
      return;
    }

    const label = btn?.textContent ?? 'Odeslat';
    if (btn) { btn.disabled = true; btn.textContent = 'Odesílám…'; }
    if (err) err.hidden = true;

    try {
      const fd = new FormData(form);
      for (const [k, v] of Object.entries(readUtm())) fd.set(k, v);
      fd.set('stranka', location.pathname);

      const token = await turnstileToken(form);
      if (token) fd.set('cf-turnstile-response', token);

      const res = await fetch(form.action, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(data.error || 'Odeslání se nepodařilo.');
      }

      window.dataLayer?.push({ event: `lead_${formId}` });
      location.href = `/dekujeme/?typ=${encodeURIComponent(formId)}`;
    } catch (e) {
      if (err) {
        err.hidden = false;
        err.textContent = `${e instanceof Error ? e.message : 'Odeslání se nepodařilo.'} Zkuste to prosím znovu, nebo nám zavolejte na ${site.broker.phone}.`;
        err.scrollIntoView({ block: 'nearest' });
      }
      if (btn) { btn.disabled = false; btn.textContent = label; }
    }
  });
}
