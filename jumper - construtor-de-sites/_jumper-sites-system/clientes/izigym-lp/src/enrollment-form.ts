import { readCampaign, trackingCampaign, trackCheckout } from './checkout-attribution.ts';

export const CLIXX_WEBHOOK = 'https://app.clixx.com.br/api/webhook/inscricao/d63641';
export const CLIXX_TRACKING = 'https://app.clixx.com.br/api/tracking/form';
const announcementId = 151;
type Campaign = Record<string, string>;
type Submission = { nome: string; celular: string; lgpd_consentimento: number };
type ClixxResult = { success?: boolean; ja_inscrito?: boolean; redirect_url?: string; message?: string; error?: string };

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length > 6) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length > 2) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return digits ? `(${digits}` : '';
}

export async function submitClixx(values: Submission, campaign: Campaign, send: typeof fetch = fetch): Promise<ClixxResult> {
  const utms = Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'].map(key => [key, campaign[key] || null]));
  const response = await send(CLIXX_WEBHOOK, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...utms, ...values, empresa_id: 205, origem: 'embed' }),
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json();
  if (!response.ok || !result || !(result.success || result.ja_inscrito)) throw new Error(result?.error || 'Erro ao realizar inscrição. Tente novamente.');
  return result;
}

export function clixxRedirectUrl(href: string, campaign: Campaign, base: string): string {
  const destination = new URL(href, base);
  if (!['https:', 'http:'].includes(destination.protocol) || (destination.protocol === 'http:' && new URL(base).protocol === 'https:')) throw new Error('Destino de inscrição inválido.');
  for (const [key, value] of Object.entries(campaign)) if (/^utm_[a-z0-9_]+$/.test(key) || ['gclid', 'fbclid'].includes(key)) destination.searchParams.set(key, value);
  return destination.href;
}

export function setupEnrollmentForm(): ((campaign: Campaign, placement: string, opener: HTMLAnchorElement) => void) | undefined {
  const dialog = document.querySelector<HTMLDialogElement>('#inscricao');
  const form = document.querySelector<HTMLFormElement>('#clx2Form');
  if (!dialog || !form) return;
  const name = form.querySelector<HTMLInputElement>('#clx2_nome')!;
  const phone = form.querySelector<HTMLInputElement>('#clx2_celular')!;
  const consent = form.querySelector<HTMLInputElement>('#clx2_lgpd')!;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const message = form.querySelector<HTMLElement>('#clx2Msg')!;
  const originalLabel = button.textContent!;
  let campaign: Campaign = {};
  let placement = '';
  let opener: HTMLAnchorElement | undefined;
  let started = false, submitted = false, sending = false;
  let hiddenTimer: ReturnType<typeof setTimeout> | undefined;
  const start = Date.now();
  let session = '';
  try { session = sessionStorage.getItem(`clx2_sid_${announcementId}`) || ''; } catch { /* Storage can be disabled. */ }
  if (!session) {
    session = crypto.randomUUID();
    try { sessionStorage.setItem(`clx2_sid_${announcementId}`, session); } catch { /* The in-memory ID still works. */ }
  }
  const tracking = (extra: Record<string, unknown> = {}, beacon = false) => {
    const body = JSON.stringify({ anuncio_id: announcementId, sessao: session,
      formulario_iniciado: started, campo_nome: !!name.value.trim(), campo_email: false, campo_celular: !!phone.value.trim(),
      valor_nome: name.value.trim(), valor_email: '', valor_celular: phone.value.replace(/\D/g, ''), campos_extras: {},
      tempo_total: Math.round((Date.now() - start) / 1000), ...extra });
    try {
      if (beacon && navigator.sendBeacon?.(CLIXX_TRACKING, new Blob([body], { type: 'text/plain' }))) return;
      void fetch(CLIXX_TRACKING, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body, keepalive: true }).catch(() => {});
    } catch { /* Tracking must never prevent enrollment. */ }
  };
  const abandoned = (type: string) => { if (started && !submitted && !sending) tracking({ formulario_abandonado: true, abandono_tipo: type }, true); };
  phone.addEventListener('input', () => { phone.value = formatPhone(phone.value); phone.setCustomValidity(''); });
  form.addEventListener('focusin', () => { if (!started) { started = true; tracking(); } });
  form.addEventListener('change', () => { if (started && !submitted) tracking(); });
  window.addEventListener('pagehide', () => abandoned('page_leave'));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (!hiddenTimer) hiddenTimer = setTimeout(() => { hiddenTimer = undefined; abandoned('visibility'); }, 120000);
    } else if (hiddenTimer) { clearTimeout(hiddenTimer); hiddenTimer = undefined; }
  });
  dialog.querySelector<HTMLButtonElement>('.enrollment-close')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { document.body.classList.remove('enrollment-open'); opener?.focus({ preventScroll: true }); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    const digits = phone.value.replace(/\D/g, '');
    phone.setCustomValidity(/^\d{10,11}$/.test(digits) ? '' : 'Informe um celular com DDD (10 ou 11 dígitos).');
    if (!form.reportValidity()) return;
    sending = true; button.disabled = true; button.textContent = 'Enviando…'; message.className = 'clx2-msg';
    try {
      // Re-read persisted arrival attribution even when the visitor has navigated before submitting.
      try { campaign = readCampaign(location.search, sessionStorage); } catch { /* Keep the campaign captured at opening. */ }
      const result = await submitClixx({ nome: name.value.trim(), celular: digits, lgpd_consentimento: consent.checked ? 1 : 0 }, campaign);
      submitted = true;
      if (hiddenTimer) { clearTimeout(hiddenTimer); hiddenTimer = undefined; }
      tracking({ formulario_submetido: true, formulario_abandonado: false }, true);
      const dataWindow = window as Window & { dataLayer?: unknown[] };
      dataWindow.dataLayer ||= [];
      dataWindow.dataLayer.push({ event: 'form_submit', form_id: 'clx2Form', placement, ...trackingCampaign(campaign) });
      message.className = 'clx2-msg success'; message.textContent = result.message || 'Inscrição realizada com sucesso!';
      if (result.redirect_url) {
        const href = clixxRedirectUrl(result.redirect_url, campaign, location.href);
        trackCheckout(placement, campaign, href);
        location.assign(href);
        return;
      }
      form.reset();
    } catch (error) {
      message.className = 'clx2-msg error';
      message.textContent = submitted ? 'Inscrição recebida. Não foi possível abrir a próxima etapa.' : error instanceof Error && error.message.startsWith('Erro ao realizar') ? error.message : 'Erro de conexão. Tente novamente.';
    } finally {
      sending = false; button.disabled = false; button.textContent = originalLabel;
    }
  });
  return (arrival, source, trigger) => {
    campaign = arrival; placement = source; opener = trigger;
    document.body.classList.add('enrollment-open');
    if (!dialog.open) dialog.showModal();
  };
}
