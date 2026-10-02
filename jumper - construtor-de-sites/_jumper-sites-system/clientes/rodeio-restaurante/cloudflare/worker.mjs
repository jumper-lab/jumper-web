import { hubStatus } from './hub-status.mjs';
import { cloudflareProcesses, githubWebhook } from './process-status.mjs';

const SITE_PREFIX = '/rodeio';
const LEGACY_PREFIX = '/site';
const PUBLIC_SITES = ['/rodeio', '/izigym', '/izigym-lp', '/izigym-lp-vilaromana', '/casabelie', '/casabelie-2', '/casabelie-3', '/pao-de-queijo-haddock-lobo'];
const IZI_OFFICIAL_HOST = 'www.izigym.com.br';
const IZI_OFFICIAL_APEX = 'izigym.com.br';
const IZI_OFFICIAL_ROOT = '/_official/izigym';
const IZI_CERRO_CORÁ_HOST = 'cerrocora.izigym.com.br';
const IZI_LEADS_PATH = '/api/izigym/leads';
const IZI_LEADS_TEST_HOST = 'site.jumper.dev.br';
const IZI_LEADS_TEST_PATH = '/izigym-leads-test';
const IZI_LEADS_ADMIN_PATH = '/__jumper/izi-gym/leads';
const IZI_LEADS_LIVE_ADMIN_PATH = '/__jumper/izi-gym/lp-cerro-cora/leads-live';
const IZI_LEADS_LIVE_ADMIN_LEGACY_PATH = '/__jumper/izi-gym/leads-live';
const BRIEFING_PATH = '/briefing';
const BRIEFING_API_PATH = `${BRIEFING_PATH}/api/briefings`;
const BRIEFING_CONTINUE_PREFIX = `${BRIEFING_PATH}/continuar/`;
const BRIEFING_API_UPSTREAM = 'https://briefing-formulario-sites-jumper.vercel.app/api/briefings';
const LOGIN_PATH = '/__jumper/login';
const LOGOUT_PATH = '/__jumper/logout';
const HUB_STATUS_PATH = '/__jumper/system-status';
const HUB_PROCESSES_PATH = '/__jumper/active-processes';
const HUB_GITHUB_EVENTS_PATH = '/__jumper/github-events';
const COOKIE_NAME = 'jumper_hoster_session';
const HUB_COOKIE_NAME = 'jumper_hub_session';
const SESSION_SECONDS = 60 * 60 * 12;
const encoder = new TextEncoder();

const securityHeaders = {
  'Cache-Control': 'no-store, private',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; font-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Robots-Tag': 'noindex, nofollow',
};

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(value) {
  return crypto.subtle.digest('SHA-256', encoder.encode(value));
}

async function sessionToken(secret) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return bytesToHex(await crypto.subtle.sign('HMAC', key, encoder.encode('jumper-hoster-session-v1')));
}

function constantTimeEqual(left, right) {
  if (left.byteLength !== right.byteLength) return false;
  const a = new Uint8Array(left);
  const b = new Uint8Array(right);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

function cookieValue(request, cookieName = COOKIE_NAME) {
  const cookies = request.headers.get('Cookie') || '';
  for (const part of cookies.split(';')) {
    const [name, ...value] = part.trim().split('=');
    if (name === cookieName) return value.join('=');
  }
  return '';
}

async function isAuthorized(request, secret, cookieName = COOKIE_NAME) {
  const provided = cookieValue(request, cookieName);
  if (!provided || !secret) return false;
  const expected = await sessionToken(secret);
  return constantTimeEqual(await sha256(provided), await sha256(expected));
}

function safeNext(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

function loginPage(next = '/', hasError = false) {
  const destination = safeNext(next).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  const error = hasError ? '<p class="error" role="alert">Senha incorreta. Tente novamente.</p>' : '';
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Acesso — Jumper Studio</title>
<style>
@font-face{font-family:Saans;src:url('/fonts/Saans-TRIAL-Regular.woff2') format('woff2');font-weight:400;font-display:swap}@font-face{font-family:Saans;src:url('/fonts/Saans-TRIAL-Bold.woff2') format('woff2');font-weight:700;font-display:swap}@font-face{font-family:Greed;src:url('/fonts/GreedCondensed-Heavy-TRIAL.woff2') format('woff2');font-weight:900;font-display:swap}
*{box-sizing:border-box}html{font-family:Saans,Arial,sans-serif;color:#101010;background:#fff}body{margin:0;min-height:100svh;display:flex;flex-direction:column}header,footer{display:flex;align-items:center;justify-content:space-between;padding:31px 38px}.brand{font:900 18px/1 Greed,Impact,sans-serif;text-transform:uppercase}.by,footer{font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:#707070}main{width:min(944px,calc(100% - 48px));margin:auto;padding:72px 0 80px}h1{font:900 clamp(44px,4.25vw,58px)/.94 Greed,Impact,sans-serif;letter-spacing:-.025em;text-transform:uppercase;margin:0;max-width:650px}.lead{font-size:17px;color:#696969;margin:14px 0 40px}.panel{width:min(100%,430px);border:1px solid #d9d9d9;border-radius:14px;padding:20px}label{display:block;font-size:10px;font-weight:700;letter-spacing:.25em;text-transform:uppercase;margin-bottom:10px}input{display:block;width:100%;height:48px;border:1px solid #cfcfcf;border-radius:8px;padding:0 14px;font:16px Saans,Arial,sans-serif;outline:none}input:focus{border-color:#101010;box-shadow:0 0 0 3px rgba(0,0,0,.07)}button{width:100%;height:48px;margin-top:12px;border:0;border-radius:8px;background:#101010;color:#fff;font:700 12px Saans,Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase;cursor:pointer;transition:transform .2s ease,background .2s ease}button:hover{background:#2b2b2b;transform:translateY(-1px)}.error{font-size:14px;color:#c42323;margin:12px 0 0}@media(max-width:560px){header,footer{padding-left:24px;padding-right:24px}.by{display:none}main{padding:48px 0 64px}h1{font-size:42px}.lead{font-size:16px}}@media(prefers-reduced-motion:reduce){button{transition:none}}
</style></head><body><header><span class="brand">Sites</span><span class="by">By Jumper</span></header><main><h1>Área de acesso da Jumper.</h1><p class="lead">Digite a senha para abrir os sites em desenvolvimento.</p><form class="panel" action="${LOGIN_PATH}" method="post"><input type="hidden" name="next" value="${destination}"><label for="password">Senha de acesso</label><input id="password" name="password" type="password" autocomplete="current-password" autofocus required><button type="submit">Entrar →</button>${error}</form></main><footer>Sites · Jumper Studio</footer></body></html>`;
}

function htmlResponse(html, status = 200, headers = {}) {
  return new Response(html, { status, headers: { ...securityHeaders, 'Content-Type': 'text/html; charset=utf-8', ...headers } });
}

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function submitIziLead(request, env, isTest = false) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405);
  }

  const origin = request.headers.get('Origin');
  if (origin !== `https://${IZI_CERRO_CORÁ_HOST}` && origin !== `https://${IZI_LEADS_TEST_HOST}` && origin !== 'http://127.0.0.1:4327') {
    return jsonResponse({ error: 'Origem não permitida.' }, 403);
  }
  if (origin === `https://${IZI_LEADS_TEST_HOST}` && !(await isAuthorized(request, env.JUMPER_HOSTER_PASSWORD))) {
    return jsonResponse({ error: 'Acesso não autorizado.' }, 401);
  }

  if (!request.headers.get('Content-Type')?.toLowerCase().includes('application/json')) {
    return jsonResponse({ error: 'Formato de envio inválido.' }, 415);
  }
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > 8192) return jsonResponse({ error: 'Envio muito grande.' }, 413);

  const ipAddress = request.headers.get('CF-Connecting-IP') || 'local';
  const limit = await env.IZI_LEAD_LIMITER.limit({ key: ipAddress });
  if (!limit.success) return jsonResponse({ error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' }, 429);

  let payload;
  try {
    const raw = await request.text();
    if (raw.length > 8192) return jsonResponse({ error: 'Envio muito grande.' }, 413);
    payload = JSON.parse(raw);
  } catch {
    return jsonResponse({ error: 'Não foi possível ler o envio.' }, 400);
  }

  // Honeypot submissions are acknowledged without storing any data.
  if (typeof payload.website === 'string' && payload.website.trim()) {
    return jsonResponse({ ok: true }, 202);
  }
  const startedAt = Number(payload.startedAt);
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 1800 || Date.now() - startedAt > 86400000) {
    return jsonResponse({ error: 'Atualize o formulário e tente novamente.' }, 422);
  }

  const name = typeof payload.name === 'string' ? payload.name.trim().replace(/\s+/g, ' ') : '';
  const phone = typeof payload.phone === 'string' ? payload.phone.replace(/\D/g, '') : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  if (name.length < 2 || name.length > 120 || /[\u0000-\u001f\u007f]/.test(name)) {
    return jsonResponse({ error: 'Confira o nome informado.' }, 422);
  }
  if (phone.length < 10 || phone.length > 15) {
    return jsonResponse({ error: 'Confira o telefone informado.' }, 422);
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: 'Confira o e-mail informado.' }, 422);
  }
  if (payload.consent !== true) return jsonResponse({ error: 'É necessário autorizar o contato da IZI Gym.' }, 422);
  const plan = typeof payload.plan === 'string' ? payload.plan.trim().slice(0, 80) : null;

  const campaign = payload.campaign && typeof payload.campaign === 'object' ? payload.campaign : {};
  const field = (key) => typeof campaign[key] === 'string' ? campaign[key].trim().slice(0, 200) || null : null;
  const id = crypto.randomUUID();
  const consentedAt = new Date().toISOString();
  const leadsDb = isTest ? env.IZI_LEADS_TEST_DB : env.IZI_LEADS_DB;

  try {
    await leadsDb.prepare(
      `INSERT INTO izi_gym_leads
       (id, name, phone, email, consent_version, consented_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid, plan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      name,
      phone,
      email,
      'izi-lead-consent-v1',
      consentedAt,
      field('utm_source'),
      field('utm_medium'),
      field('utm_campaign'),
      field('utm_content'),
      field('utm_term'),
      field('gclid'),
      field('fbclid'),
      plan,
    ).run();
  } catch {
    // Do not log submitted personal data.
    console.error('IZI lead could not be written to D1.');
    return jsonResponse({ error: 'Não foi possível concluir o cadastro. Tente novamente ou fale com a equipe.' }, 503);
  }

  return jsonResponse({ ok: true, id }, 201);
}

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function leadTestPage(nonce) {
  const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`;
  return htmlResponse(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Teste de cadastro IZI Gym · Jumper</title><style>
*{box-sizing:border-box}body{margin:0;background:#f2eee5;color:#30302e;font:16px/1.5 system-ui,-apple-system,sans-serif}.wrap{width:min(760px,calc(100% - 32px));margin:42px auto}.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}.brand{font-weight:800;letter-spacing:.04em}.panel{background:#fff;border:1px solid #ddd8cc;border-radius:18px;padding:clamp(22px,5vw,44px)}.flag{font-size:12px;text-transform:uppercase;letter-spacing:.09em;color:#a52a1b}h1{font-size:clamp(30px,6vw,46px);line-height:1.05;margin:10px 0}p{color:#65645f}.grid{display:grid;gap:16px;margin:26px 0}label{display:grid;gap:6px;font-size:14px;font-weight:600}input:not([type=checkbox]){width:100%;height:48px;padding:0 13px;border:1px solid #c9c6bd;border-radius:8px;font:inherit}input:focus{outline:3px solid #e52c1233;border-color:#e52c12}.consent{display:flex;align-items:flex-start;gap:10px;font-size:13px;font-weight:400}.consent input{margin-top:4px;accent-color:#e52c12}button,.link{min-height:48px;padding:12px 20px;border:0;border-radius:999px;background:#e52c12;color:white;font:inherit;font-weight:650;cursor:pointer}.link{display:inline-flex;align-items:center;background:#30302e;text-decoration:none}.status{min-height:24px;margin-top:14px}.trap{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px}.secondary{background:#efede8;color:#333}.small{font-size:13px}.table-wrap{overflow:auto;margin-top:22px}table{width:100%;border-collapse:collapse;text-align:left;font-size:13px}th,td{padding:11px 9px;border-bottom:1px solid #e3e0d8;white-space:nowrap}th{font-size:11px;text-transform:uppercase;letter-spacing:.06em}a{color:inherit}@media(max-width:520px){.wrap{margin:18px auto}.top{align-items:flex-start}}
</style></head><body><main class="wrap"><div class="top"><span class="brand">IZI GYM · JUMPER</span><form action="${LOGOUT_PATH}" method="post"><button class="secondary" type="submit">Sair</button></form></div><section class="panel"><div class="flag">Ambiente de teste · separado do YayForms</div><h1>Teste o cadastro no D1</h1><p>Este formulário grava somente nesta base de teste da Jumper. Ele não altera nem substitui o formulário de matrícula atual.</p><form id="lead-form"><div class="grid"><label>Nome<input name="name" autocomplete="name" required minlength="2" maxlength="120"></label><label>Telefone<input name="phone" type="tel" autocomplete="tel" required minlength="10" maxlength="20" placeholder="(11) 99999-9999"></label><label>E-mail<input name="email" type="email" autocomplete="email" required maxlength="254"></label><label class="consent"><input name="consent" type="checkbox" required><span>Autorizo a IZI Gym a usar estes dados para retornar sobre o cadastro. (Teste interno.)</span></label><label class="trap" aria-hidden="true">Deixe vazio<input name="website" tabindex="-1" autocomplete="off"></label><input type="hidden" name="startedAt"></div><button id="submit" type="submit">Enviar cadastro de teste</button><p id="status" class="status" role="status" aria-live="polite"></p></form><div class="actions"><a class="link" href="${IZI_LEADS_ADMIN_PATH}">Ver cadastros no D1</a><a class="link secondary" href="${IZI_LEADS_ADMIN_PATH}.csv">Baixar CSV</a></div></section></main><script nonce="${nonce}">
const form=document.querySelector('#lead-form');const status=document.querySelector('#status');const submit=document.querySelector('#submit');form.elements.startedAt.value=String(Date.now());form.addEventListener('submit',async event=>{event.preventDefault();submit.disabled=true;status.textContent='Enviando…';const data=new FormData(form);const campaign={};for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid']){const value=new URLSearchParams(location.search).get(key);if(value)campaign[key]=value;}try{const response=await fetch('/api/izigym/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:data.get('name'),phone:data.get('phone'),email:data.get('email'),consent:data.get('consent')==='on',website:data.get('website'),startedAt:Number(data.get('startedAt')),campaign})});const result=await response.json();if(!response.ok)throw new Error(result.error||'Não foi possível salvar.');status.textContent='Cadastro de teste salvo no D1. ID: '+(result.id||'');form.reset();}catch(error){status.textContent=error.message||'Falha no envio. Tente novamente.';}finally{submit.disabled=false;form.elements.startedAt.value=String(Date.now());}});
</script></body></html>`, 200, { 'Content-Security-Policy': csp, 'Cache-Control': 'no-store, private' });
}

async function listIziLeads(request, env, isTest = false) {
  if (request.method !== 'GET') return jsonResponse({ error: 'Método não permitido.' }, 405);
  if (!(await isAuthorized(request, env.JUMPER_HOSTER_PASSWORD))) return jsonResponse({ error: 'Acesso não autorizado.' }, 401);
  const leadsDb = isTest ? env.IZI_LEADS_TEST_DB : env.IZI_LEADS_DB;
  try {
    const { results = [] } = await leadsDb.prepare(
      `SELECT id, created_at, name, phone, email, consent_version, consented_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid, plan
       FROM izi_gym_leads ORDER BY created_at DESC LIMIT 500`,
    ).all();
    if (new URL(request.url).pathname.endsWith('.csv')) {
      const columns = ['created_at', 'name', 'phone', 'email', 'plan', 'consent_version', 'consented_at', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];
      const cell = (value) => {
        let text = String(value ?? '');
        if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
        return `"${text.replaceAll('"', '""')}"`;
      };
      const csv = [columns.map(cell).join(','), ...results.map((row) => columns.map((column) => cell(row[column])).join(','))].join('\r\n');
      return new Response(`\uFEFF${csv}`, { headers: { ...securityHeaders, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="izi-lp-CerroCora-leads-dev.csv"', 'Cache-Control': 'no-store, private' } });
    }
    const body = results.length ? results.map((row) => `<tr>${['created_at', 'name', 'phone', 'email', 'plan', 'utm_source'].map((key) => `<td>${escapeHtml(row[key])}</td>`).join('')}</tr>`).join('') : '<tr><td colspan="6">Nenhum cadastro encontrado.</td></tr>';
    return htmlResponse(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Cadastros IZI Gym · Jumper</title><style>*{box-sizing:border-box}body{margin:0;padding:28px;background:#f2eee5;color:#30302e;font:15px/1.5 system-ui,sans-serif}.wrap{max-width:1200px;margin:auto}.top,.actions{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.panel{margin-top:20px;padding:24px;background:white;border:1px solid #ddd8cc;border-radius:16px}h1{margin:0;font-size:32px}.notice{color:#686760}.actions a{display:inline-block;padding:11px 16px;border-radius:999px;background:#e52c12;color:#fff;text-decoration:none}.actions form{margin:0}.actions button{padding:11px 16px;border:0;border-radius:999px;background:#30302e;color:white;font:inherit}.table-wrap{overflow:auto;margin-top:20px}table{width:100%;border-collapse:collapse;text-align:left}th,td{padding:12px;border-bottom:1px solid #e4e0d8;white-space:nowrap}th{font-size:11px;text-transform:uppercase;letter-spacing:.06em}</style></head><body><main class="wrap"><div class="top"><h1>Cadastros IZI Gym</h1><div class="actions"><a href="${IZI_LEADS_TEST_PATH}/">Novo teste</a><a href="${IZI_LEADS_ADMIN_PATH}.csv">Exportar CSV (até 500 registros)</a><form action="${LOGOUT_PATH}" method="post"><button type="submit">Sair</button></form></div></div><section class="panel"><p class="notice">Dados pessoais: acesso restrito. Exibindo os ${results.length} registros mais recentes (máximo de 500).</p><div class="table-wrap"><table><thead><tr><th>Data</th><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Plano</th><th>Origem</th></tr></thead><tbody>${body}</tbody></table></div></section></main></body></html>`, 200, { 'Cache-Control': 'no-store, private' });
  } catch {
    return jsonResponse({ error: 'Não foi possível consultar os cadastros.' }, 503);
  }
}

async function listLiveIziLeads(request, env) {
  if (request.method !== 'GET') return jsonResponse({ error: 'Método não permitido.' }, 405);
  const url = new URL(request.url);
  if (!(await isAuthorized(request, env.JUMPER_HOSTER_PASSWORD))) return htmlResponse(loginPage(`${url.pathname}${url.search}`), 401);

  const month = url.searchParams.get('month') || '';
  const period = url.searchParams.get('period') || (month ? 'legacy_month' : 'all');
  const from = url.searchParams.get('from') || '';
  const to = url.searchParams.get('to') || '';
  const plan = url.searchParams.get('plan') || '';
  const database = url.searchParams.get('database') || 'izi-lp-CerroCora-leads';
  const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  if ((month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) || !['all', 'today', 'yesterday', 'last7', 'last30', 'this_month', 'previous_month', 'custom', 'legacy_month'].includes(period) || (period === 'legacy_month' && !month) || (period === 'custom' && (!validDate(from) || !validDate(to) || from > to)) || plan.length > 80 || !['izi-lp-CerroCora-leads', 'izi-lp-CerroCora-leads-dev'].includes(database)) {
    return htmlResponse('<h1>Filtros inválidos.</h1>', 400);
  }
  const cloudflareDatabaseUrl = `https://dash.cloudflare.com/e23efa36a1e09015eebb2b36bdfcf201/workers/d1/databases/${database === 'izi-lp-CerroCora-leads-dev' ? 'af52ce85-b519-473c-ad3c-66654cf3aabd' : 'e06d432d-eaf4-47cb-90a2-fd7b6cc54ebc'}/studio`;
  const page = Math.max(1, Math.min(10000, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1));
  const where = [];
  const values = [];
  const shiftDate = (value, days) => {
    const date = new Date(`${value}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };
  const brazilToday = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  const today = `${brazilToday.year}-${brazilToday.month}-${brazilToday.day}`;
  const brazilMidnightUtc = (date) => {
    const utcMidnight = Date.parse(`${date}T00:00:00Z`);
    const zone = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', timeZoneName: 'longOffset' }).formatToParts(new Date(utcMidnight)).find(({ type }) => type === 'timeZoneName').value;
    const [, sign, hours, minutes] = /^GMT([+-])(\d{2}):(\d{2})$/.exec(zone);
    const offset = (sign === '+' ? 1 : -1) * (Number(hours) * 60 + Number(minutes));
    return new Date(utcMidnight - offset * 60000).toISOString();
  };
  if (month) {
    const [year, number] = month.split('-').map(Number);
    const nextMonth = `${number === 12 ? year + 1 : year}-${String(number === 12 ? 1 : number + 1).padStart(2, '0')}`;
    where.push('created_at >= ? AND created_at < ?');
    values.push(`${month}-01`, `${nextMonth}-01`);
  } else if (period !== 'all') {
    let start;
    let end;
    if (period === 'today') [start, end] = [today, shiftDate(today, 1)];
    if (period === 'yesterday') [start, end] = [shiftDate(today, -1), today];
    if (period === 'last7') [start, end] = [shiftDate(today, -6), shiftDate(today, 1)];
    if (period === 'last30') [start, end] = [shiftDate(today, -29), shiftDate(today, 1)];
    if (period === 'this_month') [start, end] = [`${today.slice(0, 7)}-01`, shiftDate(`${today.slice(0, 7)}-01`, 32).slice(0, 7) + '-01'];
    if (period === 'previous_month') [start, end] = [shiftDate(`${today.slice(0, 7)}-01`, -1).slice(0, 7) + '-01', `${today.slice(0, 7)}-01`];
    if (period === 'custom') [start, end] = [from, shiftDate(to, 1)];
    where.push('created_at >= ? AND created_at < ?');
    values.push(brazilMidnightUtc(start), brazilMidnightUtc(end));
  }
  if (plan) { where.push('plan = ?'); values.push(plan); }
  const clause = where.length ? ` WHERE ${where.join(' AND ')}` : '';
  const basePath = IZI_LEADS_LIVE_ADMIN_PATH;
  const filterParams = new URLSearchParams();
  filterParams.set('database', database);
  if (month) filterParams.set('month', month);
  if (period !== 'all' && !month) filterParams.set('period', period);
  if (period === 'custom') { filterParams.set('from', from); filterParams.set('to', to); }
  if (plan) filterParams.set('plan', plan);
  const query = filterParams.toString();
  const link = (target, extra = '') => `${target}?${[query, extra].filter(Boolean).join('&')}`;

  try {
    const db = database === 'izi-lp-CerroCora-leads-dev' ? env.IZI_LEADS_TEST_DB : env.IZI_LEADS_DB;
    const countRow = await db.prepare(`SELECT COUNT(*) AS total FROM izi_gym_leads${clause}`).bind(...values).first();
    const total = Number(countRow?.total || 0);
    if (url.pathname.endsWith('.csv')) {
      if (total > 20000) return jsonResponse({ error: 'A exportação ultrapassa 20.000 registros. Aplique um filtro de período.' }, 413);
      const columns = ['created_at', 'name', 'phone', 'email', 'plan', 'consent_version', 'consented_at', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];
      const cell = (value) => {
        let text = String(value ?? '');
        if (/^\s*[=+@-]/.test(text)) text = `'${text}`;
        return `"${text.replaceAll('"', '""')}"`;
      };
      const lines = [columns.map(cell).join(',')];
      for (let offset = 0; offset < total; offset += 1000) {
        const { results = [] } = await db.prepare(`SELECT ${columns.join(',')} FROM izi_gym_leads${clause} ORDER BY created_at DESC, id DESC LIMIT 1000 OFFSET ?`).bind(...values, offset).all();
        for (const row of results) lines.push(columns.map((column) => cell(row[column])).join(','));
      }
      const filename = `${database}${month ? `-${month}` : period === 'custom' ? `-${from}-a-${to}` : period !== 'all' ? `-${period}` : ''}.csv`;
      return new Response(`\uFEFF${lines.join('\r\n')}\r\n`, { headers: { ...securityHeaders, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"` } });
    }

    const [{ results = [] }, { results: plans = [] }] = await Promise.all([
      db.prepare(`SELECT created_at, name, phone, email, plan FROM izi_gym_leads${clause} ORDER BY created_at DESC, id DESC LIMIT 50 OFFSET ?`).bind(...values, (page - 1) * 50).all(),
      db.prepare("SELECT DISTINCT plan FROM izi_gym_leads WHERE plan IS NOT NULL AND plan != '' ORDER BY plan LIMIT 100").all(),
    ]);
    const options = (rows, key, selected) => rows.map((row) => `<option value="${escapeHtml(row[key])}"${row[key] === selected ? ' selected' : ''}>${escapeHtml(row[key])}</option>`).join('');
    const body = results.length ? results.map((row) => `<tr>${['created_at', 'name', 'phone', 'email', 'plan'].map((key) => `<td>${escapeHtml(row[key])}</td>`).join('')}</tr>`).join('') : '<tr><td colspan="5">Nenhum cadastro encontrado para esses filtros.</td></tr>';
    const periodChoices = [['all', 'Todo o período'], ['today', 'Hoje'], ['yesterday', 'Ontem'], ['last7', 'Últimos 7 dias'], ['last30', 'Últimos 30 dias'], ['this_month', 'Este mês'], ['previous_month', 'Mês anterior']];
    const selectedCustom = period === 'custom' || period === 'legacy_month';
    const periodButtons = periodChoices.map(([value, label]) => `<button class="period-choice" type="button" data-period="${value}"${period === value ? ' aria-current="true"' : ''}>${label}</button>`).join('');
    const initialFrom = month ? `${month}-01` : from;
    const initialTo = month ? shiftDate(shiftDate(`${month}-01`, 32).slice(0, 7) + '-01', -1) : to;
    const dateLabel = (value) => value ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}` : '';
    const selectedPeriodLabel = selectedCustom ? `${dateLabel(initialFrom)} a ${dateLabel(initialTo)}` : periodChoices.find(([value]) => value === period)?.[1] || 'Todo o período';
    const nonce = crypto.randomUUID().replaceAll('-', '');
    const periodScript = String.raw`
const picker = document.querySelector('.period-picker');
const form = document.querySelector('.filters');
const periodInput = form.elements.period;
const fromInput = form.elements.from;
const toInput = form.elements.to;
const summary = picker.querySelector('.period-summary');
const calendar = picker.querySelector('.calendar');
const menu = picker.querySelector('.period-menu');
const grid = picker.querySelector('.calendar-grid');
const monthLabel = picker.querySelector('.calendar-month');
const rangeLabel = picker.querySelector('.range-label');
const apply = picker.querySelector('.apply-range');
let start = fromInput.value;
let end = toInput.value;
let visibleMonth = (start || picker.dataset.today).slice(0, 7);
const shortDate = value => value ? value.slice(8, 10) + '/' + value.slice(5, 7) + '/' + value.slice(0, 4) : '';
const monthName = value => new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + '-01T12:00:00Z'));
function showCalendar() {
  calendar.hidden = false;
  menu.classList.add('calendar-open');
  renderCalendar();
}
function renderCalendar() {
  monthLabel.textContent = monthName(visibleMonth);
  grid.replaceChildren();
  const [year, month] = visibleMonth.split('-').map(Number);
  const firstDay = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let index = 0; index < firstDay; index++) grid.append(document.createElement('span'));
  for (let day = 1; day <= days; day++) {
    const date = visibleMonth + '-' + String(day).padStart(2, '0');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'calendar-day';
    if (date === start || date === end) button.classList.add('selected');
    else if (start && end && date > start && date < end) button.classList.add('in-range');
    button.textContent = String(day);
    button.setAttribute('aria-label', shortDate(date));
    button.setAttribute('aria-pressed', String(date === start || date === end));
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!start || end) { start = date; end = ''; }
      else if (date < start) { end = start; start = date; }
      else { end = date; }
      renderCalendar();
    });
    grid.append(button);
  }
  rangeLabel.textContent = start ? (end ? shortDate(start) + ' até ' + shortDate(end) : 'Início: ' + shortDate(start) + '. Escolha o fim.') : 'Escolha o início e o fim do período.';
  apply.disabled = !start || !end;
}
picker.querySelectorAll('[data-period]').forEach(button => button.addEventListener('click', () => {
  periodInput.value = button.dataset.period;
  fromInput.value = '';
  toInput.value = '';
  summary.textContent = button.textContent;
  calendar.hidden = true;
  menu.classList.remove('calendar-open');
  picker.open = false;
}));
picker.querySelector('.choose-dates').addEventListener('click', showCalendar);
picker.querySelector('.calendar-back').addEventListener('click', () => { calendar.hidden = true; menu.classList.remove('calendar-open'); });
picker.querySelectorAll('[data-month-step]').forEach(button => button.addEventListener('click', () => {
  const [year, month] = visibleMonth.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1 + Number(button.dataset.monthStep), 1));
  visibleMonth = next.toISOString().slice(0, 7);
  renderCalendar();
}));
apply.addEventListener('click', () => {
  if (!start || !end) return;
  periodInput.value = 'custom';
  fromInput.value = start;
  toInput.value = end;
  summary.textContent = shortDate(start) + ' a ' + shortDate(end);
  picker.open = false;
});
picker.addEventListener('toggle', () => {
  if (picker.open && periodInput.value === 'custom') showCalendar();
});
document.addEventListener('click', event => { if (!picker.contains(event.target)) picker.open = false; });
form.addEventListener('submit', event => {
  if (periodInput.value === 'custom' && (!fromInput.value || !toInput.value)) {
    event.preventDefault();
    picker.open = true;
    showCalendar();
  }
});`;
    const pages = Math.max(1, Math.ceil(total / 50));
    const pagination = `<nav class="pages" aria-label="Páginas">${page > 1 ? `<a href="${escapeHtml(link(basePath, `page=${page - 1}`))}">← Anterior</a>` : ''}<span>Página ${page} de ${pages}</span>${page < pages ? `<a href="${escapeHtml(link(basePath, `page=${page + 1}`))}">Próxima →</a>` : ''}</nav>`;
    return htmlResponse(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Cadastros da LP Cerro Corá · IZI Gym</title><style>*{box-sizing:border-box}body{margin:0;padding:clamp(16px,4vw,40px);background:#f2eee5;color:#30302e;font:15px/1.5 system-ui,sans-serif}.wrap{max-width:1240px;margin:auto}.top,.pages{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.toolbar{display:flex;align-items:end;justify-content:space-between;gap:12px}.controls{display:flex;align-items:center;gap:8px;white-space:nowrap}.eyebrow{text-transform:uppercase;letter-spacing:.14em;color:#e52c12;font-size:11px;font-weight:700}h1{margin:4px 0;font-size:clamp(28px,4vw,42px)}.panel{margin-top:24px;padding:clamp(18px,3vw,30px);background:#fff;border:1px solid #ddd8cc;border-radius:18px}.filters{display:flex;align-items:end;gap:8px;min-width:0;flex:1;white-space:nowrap}.filters label{display:grid;gap:5px;font-size:12px;font-weight:700}.filters input,.filters select{height:40px;min-width:0;width:130px;border:1px solid #ccc6b9;border-radius:8px;padding:0 10px;background:#fff;font:inherit}.button,.pages a{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:9px 12px;border:0;border-radius:999px;background:#e52c12;color:#fff;text-decoration:none;font:inherit;font-size:13px;font-weight:700;cursor:pointer}.button.secondary,.pages a{background:#30302e}.notice{color:#686760}.notice a{color:#c92913;font-weight:700;text-underline-offset:3px}.count{margin:16px 0 0}.filters label:first-child select{width:200px}.filters a{align-self:end}.period-field{position:relative;min-width:140px}.field-label{display:block;margin-bottom:5px;font-size:12px;font-weight:700}.period-picker{position:relative}.period-summary{display:flex;align-items:center;justify-content:space-between;width:140px;height:40px;padding:0 10px;border:1px solid #ccc6b9;border-radius:8px;background:white;font-size:12px;font-weight:700;cursor:pointer;list-style:none;overflow:hidden;white-space:nowrap}.period-summary::-webkit-details-marker{display:none}.period-summary:after{content:"⌄";margin-left:8px}.period-summary:focus-visible,.period-menu button:focus-visible{outline:2px solid #1379d5;outline-offset:2px}.period-menu{position:absolute;z-index:10;top:calc(100% + 6px);left:0;width:min(320px,calc(100vw - 40px));max-height:min(620px,75vh);overflow:auto;padding:10px;background:#fff;border:1px solid #ddd8cc;border-radius:14px;box-shadow:0 14px 30px #0002;white-space:normal}.period-choice{display:block;width:100%;padding:9px 10px;text-align:left;border:0;border-radius:8px;background:transparent;color:inherit;font:inherit;font-size:13px;cursor:pointer}.period-choice:hover,.period-choice[aria-current=true]{background:#f2eee5}.period-menu.calendar-open .period-choice{display:none}.calendar[hidden]{display:none}.calendar-header{display:flex;align-items:center;justify-content:space-between;gap:6px}.calendar-header button{width:30px;height:30px;border:0;border-radius:50%;background:#f2eee5;color:inherit;cursor:pointer}.calendar-header .calendar-back{width:auto;padding:0 8px;border-radius:8px}.calendar-month{text-transform:capitalize;font-size:14px;font-weight:700}.calendar-weekdays,.calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center}.calendar-weekdays{margin-top:12px;font-size:11px;color:#686760}.calendar-grid{margin-top:5px}.calendar-day{aspect-ratio:1;border:0;border-radius:8px;background:transparent;color:inherit;font:inherit;font-size:12px;cursor:pointer}.calendar-day:hover,.calendar-day.in-range{background:#f2eee5}.calendar-day.selected{background:#30302e;color:#fff}.range-label{min-height:35px;margin:12px 0 6px;font-size:12px;color:#686760}.apply-range{width:100%}.apply-range:disabled{opacity:.45;cursor:not-allowed}.table-wrap{overflow:auto;margin-top:18px}table{width:100%;border-collapse:collapse;text-align:left}th,td{padding:12px;border-bottom:1px solid #e4e0d8;white-space:nowrap}th{font-size:11px;text-transform:uppercase;letter-spacing:.06em}.pages{margin-top:18px}@media(max-width:1200px){.toolbar{align-items:stretch;flex-wrap:wrap}.filters,.controls{flex-wrap:wrap}}@media(max-width:600px){.toolbar,.filters,.controls{display:grid;width:100%}.filters{grid-template-columns:1fr 1fr}.filters label:first-child{grid-column:1/-1}.period-field{min-width:0}.period-summary{width:100%}.period-menu{left:0;right:auto}.filters label,.filters input,.filters select,.filters label:first-child select{width:100%}.controls{grid-template-columns:1fr 1fr}.controls .button{text-align:center;white-space:normal}}@media(max-width:420px){.controls{grid-template-columns:1fr}}</style></head><body><main class="wrap"><div class="top"><div><span class="eyebrow">IZI Gym · LP Cerro Corá</span><h1>Cadastros da LP Cerro Corá</h1><p class="notice">Escolha a base que deseja consultar. <strong>${database}</strong> está selecionada; o CSV usa esta mesma base. <a href="${cloudflareDatabaseUrl}" target="_blank" rel="noopener noreferrer">Abrir base da LP Cerro Corá no Cloudflare ↗</a></p></div><form action="${LOGOUT_PATH}" method="post"><button class="button secondary" type="submit">Sair</button></form></div><section class="panel"><div class="toolbar"><form class="filters" method="get" action="${basePath}"><label>Base de dados<select name="database"><option value="izi-lp-CerroCora-leads"${database === 'izi-lp-CerroCora-leads' ? ' selected' : ''}>izi-lp-CerroCora-leads</option><option value="izi-lp-CerroCora-leads-dev"${database === 'izi-lp-CerroCora-leads-dev' ? ' selected' : ''}>izi-lp-CerroCora-leads-dev</option></select></label><div class="period-field"><span class="field-label">Período</span><details class="period-picker" data-today="${today}"><summary class="period-summary">${escapeHtml(selectedPeriodLabel)}</summary><div class="period-menu">${periodButtons}<button class="period-choice choose-dates" type="button">Escolher datas no calendário</button><div class="calendar" hidden><div class="calendar-header"><button class="calendar-back" type="button" aria-label="Voltar às opções de período">←</button><button type="button" data-month-step="-1" aria-label="Mês anterior">‹</button><span class="calendar-month"></span><button type="button" data-month-step="1" aria-label="Próximo mês">›</button></div><div class="calendar-weekdays"><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span></div><div class="calendar-grid"></div><p class="range-label" role="status"></p><button class="button apply-range" type="button" disabled>Aplicar período</button></div></div></details><input type="hidden" name="period" value="${selectedCustom ? 'custom' : period}"><input type="hidden" name="from" value="${escapeHtml(initialFrom)}"><input type="hidden" name="to" value="${escapeHtml(initialTo)}"></div><label>Plano<select name="plan"><option value="">Todos</option>${options(plans, 'plan', plan)}</select></label><button class="button secondary" type="submit">Filtrar</button><a class="button secondary" href="${basePath}">Limpar filtros</a></form><div class="controls"><a class="button secondary" href="${escapeHtml(link(basePath, `page=${page}`))}" aria-label="Atualizar a lista de cadastros mantendo os filtros">↻ Atualizar cadastros da LP Cerro Corá</a><a class="button" href="${escapeHtml(link(`${basePath}.csv`))}">Baixar CSV da LP Cerro Corá</a></div></div><p class="notice count"><strong>${total}</strong> cadastro${total === 1 ? '' : 's'} encontrado${total === 1 ? '' : 's'}. Exibindo até 50 por página.</p><div class="table-wrap"><table><thead><tr><th>Data</th><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Plano</th></tr></thead><tbody>${body}</tbody></table></div>${pagination}</section></main><script nonce="${nonce}">${periodScript}</script></body></html>`, 200, { 'Cache-Control': 'no-store, private', 'Content-Security-Policy': `${securityHeaders['Content-Security-Policy']}; script-src 'nonce-${nonce}'` });
  } catch {
    console.error('IZI live leads admin query failed.');
    return jsonResponse({ error: 'Não foi possível consultar os cadastros.' }, 503);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const password = env.JUMPER_HOSTER_PASSWORD;
    const hubPassword = env.JUMPER_HUB_PASSWORD || password;
    const hubCookieName = env.JUMPER_HUB_PASSWORD ? HUB_COOKIE_NAME : COOKIE_NAME;

    if (url.hostname === IZI_LEADS_TEST_HOST && url.pathname === HUB_GITHUB_EVENTS_PATH) {
      return githubWebhook(request, env.JUMPER_HUB_OPERATIONS, env.JUMPER_HUB_GITHUB_WEBHOOK_SECRET);
    }

    if (url.hostname === IZI_CERRO_CORÁ_HOST) {
      if (url.pathname === IZI_LEADS_PATH) return submitIziLead(request, env);
      if (url.pathname === '/robots.txt') {
        return new Response('User-agent: *\nAllow: /\n', {
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
        });
      }
      const assetUrl = new URL(url.pathname === '/' ? '/cerrocora/' : url.pathname, url);
      const response = await env.ASSETS.fetch(new Request(assetUrl, request));
      const headers = new Headers(response.headers);
      headers.delete('X-Robots-Tag');
      if (url.pathname === '/' && response.status === 200) {
        headers.set('Content-Type', 'text/html; charset=utf-8');
        headers.set('Cache-Control', 'no-store, max-age=0');
      }
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }

    if (url.hostname === IZI_LEADS_TEST_HOST) {
      if ([IZI_LEADS_LIVE_ADMIN_PATH, IZI_LEADS_LIVE_ADMIN_LEGACY_PATH].some((path) => url.pathname === path || url.pathname === `${path}.csv`)) {
        return listLiveIziLeads(request, env);
      }
      const isTestPage = url.pathname === IZI_LEADS_TEST_PATH || url.pathname === `${IZI_LEADS_TEST_PATH}/`;
      const isAdmin = url.pathname === IZI_LEADS_ADMIN_PATH || url.pathname === `${IZI_LEADS_ADMIN_PATH}.csv`;
      if (isTestPage || isAdmin || url.pathname === IZI_LEADS_PATH) {
        if (!(await isAuthorized(request, password))) {
          if (isTestPage && request.method === 'GET') return htmlResponse(loginPage(`${IZI_LEADS_TEST_PATH}/`), 401);
          return jsonResponse({ error: 'Acesso não autorizado.' }, 401);
        }
        if (isTestPage) {
          if (url.pathname === IZI_LEADS_TEST_PATH) return Response.redirect(new URL(`${IZI_LEADS_TEST_PATH}/`, url), 308);
          if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } });
          return leadTestPage(crypto.randomUUID());
        }
        if (isAdmin) return listIziLeads(request, env, true);
        return submitIziLead(request, env, true);
      }
    }

    if (url.hostname === IZI_OFFICIAL_APEX) {
      url.hostname = IZI_OFFICIAL_HOST;
      return Response.redirect(url, 308);
    }

    if (url.hostname === IZI_OFFICIAL_HOST) {
      if (url.pathname.startsWith('/_official/')) return new Response('Not Found', { status: 404 });
      if (url.pathname.startsWith('/cdn-cgi/image/')) {
        const imagePath = url.pathname.match(/\/images\/[^?]+$/)?.[0];
        if (imagePath) {
          const imageUrl = new URL(`${IZI_OFFICIAL_ROOT}${imagePath}`, url);
          return env.ASSETS.fetch(new Request(imageUrl, request));
        }
      }

      const assetPath = url.pathname === '/' ? '/index.shell' : url.pathname;
      const assetUrl = new URL(`${IZI_OFFICIAL_ROOT}${assetPath}`, url);
      let response = await env.ASSETS.fetch(new Request(assetUrl, request));
      if (response.status === 404 && request.headers.get('Accept')?.includes('text/html')) {
        response = await env.ASSETS.fetch(new Request(new URL(`${IZI_OFFICIAL_ROOT}/index.shell`, url), request));
      }
      const headers = new Headers(response.headers);
      headers.delete('X-Robots-Tag');
      if (assetPath === '/index.shell' || (response.status === 200 && request.headers.get('Accept')?.includes('text/html'))) {
        headers.set('Content-Type', 'text/html; charset=utf-8');
      }
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }

    if (url.pathname.startsWith('/_official/')) return new Response('Not Found', { status: 404 });

    if (url.pathname.startsWith('/fonts/')) return env.ASSETS.fetch(request);

    if (url.pathname === LOGIN_PATH && request.method === 'POST') {
      const form = await request.formData();
      const entered = String(form.get('password') || '');
      const next = safeNext(String(form.get('next') || '/'));
      const isHubLogin = next === '/';
      const loginPassword = isHubLogin ? hubPassword : password;
      const loginCookieName = isHubLogin ? hubCookieName : COOKIE_NAME;
      const matches = loginPassword && constantTimeEqual(await sha256(entered), await sha256(loginPassword));
      if (!matches) return htmlResponse(loginPage(next, true), 401);
      const headers = new Headers({ Location: next, ...securityHeaders });
      headers.append('Set-Cookie', `${loginCookieName}=${await sessionToken(loginPassword)}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Lax`);
      return new Response(null, { status: 303, headers });
    }

    if (url.pathname === LOGOUT_PATH && request.method === 'POST') {
      const headers = new Headers({ Location: '/', ...securityHeaders });
      headers.append('Set-Cookie', `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
      headers.append('Set-Cookie', `${HUB_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
      return new Response(null, { status: 303, headers });
    }

    if (url.hostname === IZI_LEADS_TEST_HOST && url.pathname === HUB_STATUS_PATH) {
      if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } });
      if (!(await isAuthorized(request, hubPassword, hubCookieName))) return jsonResponse({ error: 'Acesso não autorizado.' }, 401);
      return jsonResponse(await hubStatus(env.CF_VERSION_METADATA));
    }

    if (url.hostname === IZI_LEADS_TEST_HOST && url.pathname === HUB_PROCESSES_PATH) {
      if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } });
      if (!(await isAuthorized(request, hubPassword, hubCookieName))) return jsonResponse({ error: 'Acesso não autorizado.' }, 401);
      return jsonResponse(await cloudflareProcesses(env.JUMPER_HUB_OPERATIONS, { githubEventsEnabled: Boolean(env.JUMPER_HUB_GITHUB_WEBHOOK_SECRET) }));
    }

    if (url.pathname === BRIEFING_API_PATH) {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
      }
      const headers = new Headers(request.headers);
      headers.delete('host');
      return fetch(BRIEFING_API_UPSTREAM, {
        method: 'POST',
        headers,
        body: request.body,
        redirect: 'manual',
      });
    }

    if (url.pathname.startsWith(BRIEFING_CONTINUE_PREFIX)) {
      if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } });
      const token = url.pathname.slice(BRIEFING_CONTINUE_PREFIX.length);
      if (!/^[a-f0-9]{32}$/.test(token)) return new Response('Not Found', { status: 404 });
      const draft = await env.JUMPER_BRIEFING_DRAFTS?.get(`draft:${token}`);
      if (!draft) return new Response('Not Found', { status: 404 });
      const bytes = new TextEncoder().encode(draft);
      const encoded = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
        .replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
      const destination = new URL(`${BRIEFING_PATH}/`, url);
      destination.hash = `jumper-draft-v1=${encoded}`;
      return new Response(null, {
        status: 302,
        headers: {
          Location: destination.href,
          'Cache-Control': 'no-store, private',
          'Referrer-Policy': 'no-referrer',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      });
    }

    for (const prefix of PUBLIC_SITES) {
      if (url.pathname === prefix) return Response.redirect(new URL(`${prefix}/`, url), 308);
    }
    if (url.pathname === LEGACY_PREFIX || url.pathname.startsWith(`${LEGACY_PREFIX}/`)) {
      url.pathname = `${SITE_PREFIX}${url.pathname.slice(LEGACY_PREFIX.length) || '/'}`;
      return Response.redirect(url, 308);
    }

    if (['/', '/index', '/index/', '/index.html'].includes(url.pathname) && !(await isAuthorized(request, hubPassword, hubCookieName))) {
      return htmlResponse(loginPage('/'), 401);
    }

    if (url.pathname === BRIEFING_PATH) {
      url.pathname = `${BRIEFING_PATH}/`;
      return Response.redirect(url, 308);
    }

    if (url.pathname.startsWith('/izigym/cdn-cgi/image/')) {
      const imagePath = url.pathname.match(/\/images\/[^?]+$/)?.[0];
      if (imagePath) {
        const imageUrl = new URL(`/izigym${imagePath}`, url);
        return env.ASSETS.fetch(new Request(imageUrl, request));
      }
    }

    if (url.pathname === '/casabelie/_image') {
      const imagePath = url.searchParams.get('href');
      if (imagePath?.startsWith('/_astro/')) {
        const imageUrl = new URL(`/casabelie${imagePath}`, url);
        return env.ASSETS.fetch(new Request(imageUrl, request));
      }
    }

    let response = await env.ASSETS.fetch(request);
    if (response.status === 404 && url.pathname.startsWith('/izigym/') && request.headers.get('Accept')?.includes('text/html')) {
      response = await env.ASSETS.fetch(new Request(new URL('/izigym/index.html', url), request));
    }
    const headers = new Headers(response.headers);
    if (['/izigym-lp/', '/izigym-lp/index.html', '/izigym-lp-vilaromana/', '/izigym-lp-vilaromana/index.html'].includes(url.pathname)) {
      headers.delete('X-Robots-Tag');
    } else {
      headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    // Client-site documents must always reflect the current Worker deployment.
    // Images, scripts and fonts retain the asset cache headers generated at build time.
    if (response.headers.get('Content-Type')?.includes('text/html')) {
      headers.set('Cache-Control', 'no-store, max-age=0');
    }
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
