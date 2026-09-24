const SITE_PREFIX = '/rodeio';
const LEGACY_PREFIX = '/site';
const PUBLIC_SITES = ['/rodeio', '/izigym', '/izigym-lp', '/izigym-lp-vilaromana', '/casabelie', '/casabelie-2', '/casabelie-3'];
const IZI_OFFICIAL_HOST = 'www.izigym.com.br';
const IZI_OFFICIAL_APEX = 'izigym.com.br';
const IZI_OFFICIAL_ROOT = '/_official/izigym';
const IZI_CERRO_CORÁ_HOST = 'cerrocora.izigym.com.br';
const IZI_LEADS_PATH = '/api/izigym/leads';
const IZI_LEADS_TEST_HOST = 'site.jumper.dev.br';
const IZI_LEADS_TEST_PATH = '/izigym-leads-test';
const IZI_LEADS_ADMIN_PATH = '/__jumper/izi-gym/leads';
const BRIEFING_PATH = '/briefing';
const BRIEFING_API_PATH = `${BRIEFING_PATH}/api/briefings`;
const BRIEFING_API_UPSTREAM = 'https://briefing-formulario-sites-jumper.vercel.app/api/briefings';
const LOGIN_PATH = '/__jumper/login';
const LOGOUT_PATH = '/__jumper/logout';
const COOKIE_NAME = 'jumper_hoster_session';
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

function cookieValue(request) {
  const cookies = request.headers.get('Cookie') || '';
  for (const part of cookies.split(';')) {
    const [name, ...value] = part.trim().split('=');
    if (name === COOKIE_NAME) return value.join('=');
  }
  return '';
}

async function isAuthorized(request, secret) {
  const provided = cookieValue(request);
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

  const campaign = payload.campaign && typeof payload.campaign === 'object' ? payload.campaign : {};
  const field = (key) => typeof campaign[key] === 'string' ? campaign[key].trim().slice(0, 200) || null : null;
  const id = crypto.randomUUID();
  const consentedAt = new Date().toISOString();
  const leadsDb = isTest ? env.IZI_LEADS_TEST_DB : env.IZI_LEADS_DB;

  try {
    await leadsDb.prepare(
      `INSERT INTO izi_gym_leads
       (id, name, phone, email, consent_version, consented_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      `SELECT id, created_at, name, phone, email, consent_version, consented_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid
       FROM izi_gym_leads ORDER BY created_at DESC LIMIT 500`,
    ).all();
    if (new URL(request.url).pathname.endsWith('.csv')) {
      const columns = ['created_at', 'name', 'phone', 'email', 'consent_version', 'consented_at', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];
      const cell = (value) => {
        let text = String(value ?? '');
        if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
        return `"${text.replaceAll('"', '""')}"`;
      };
      const csv = [columns.map(cell).join(','), ...results.map((row) => columns.map((column) => cell(row[column])).join(','))].join('\r\n');
      return new Response(`\uFEFF${csv}`, { headers: { ...securityHeaders, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="izi-gym-leads.csv"', 'Cache-Control': 'no-store, private' } });
    }
    const body = results.length ? results.map((row) => `<tr>${['created_at', 'name', 'phone', 'email', 'utm_source'].map((key) => `<td>${escapeHtml(row[key])}</td>`).join('')}</tr>`).join('') : '<tr><td colspan="5">Nenhum cadastro encontrado.</td></tr>';
    return htmlResponse(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Cadastros IZI Gym · Jumper</title><style>*{box-sizing:border-box}body{margin:0;padding:28px;background:#f2eee5;color:#30302e;font:15px/1.5 system-ui,sans-serif}.wrap{max-width:1200px;margin:auto}.top,.actions{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}.panel{margin-top:20px;padding:24px;background:white;border:1px solid #ddd8cc;border-radius:16px}h1{margin:0;font-size:32px}.notice{color:#686760}.actions a{display:inline-block;padding:11px 16px;border-radius:999px;background:#e52c12;color:#fff;text-decoration:none}.actions form{margin:0}.actions button{padding:11px 16px;border:0;border-radius:999px;background:#30302e;color:white;font:inherit}.table-wrap{overflow:auto;margin-top:20px}table{width:100%;border-collapse:collapse;text-align:left}th,td{padding:12px;border-bottom:1px solid #e4e0d8;white-space:nowrap}th{font-size:11px;text-transform:uppercase;letter-spacing:.06em}</style></head><body><main class="wrap"><div class="top"><h1>Cadastros IZI Gym</h1><div class="actions"><a href="${IZI_LEADS_TEST_PATH}/">Novo teste</a><a href="${IZI_LEADS_ADMIN_PATH}.csv">Exportar CSV (até 500 registros)</a><form action="${LOGOUT_PATH}" method="post"><button type="submit">Sair</button></form></div></div><section class="panel"><p class="notice">Dados pessoais: acesso restrito. Exibindo os ${results.length} registros mais recentes (máximo de 500).</p><div class="table-wrap"><table><thead><tr><th>Data</th><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Origem</th></tr></thead><tbody>${body}</tbody></table></div></section></main></body></html>`, 200, { 'Cache-Control': 'no-store, private' });
  } catch {
    return jsonResponse({ error: 'Não foi possível consultar os cadastros.' }, 503);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const password = env.JUMPER_HOSTER_PASSWORD;

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
      const matches = password && constantTimeEqual(await sha256(entered), await sha256(password));
      const next = safeNext(String(form.get('next') || '/'));
      if (!matches) return htmlResponse(loginPage(next, true), 401);
      const headers = new Headers({ Location: next, ...securityHeaders });
      headers.append('Set-Cookie', `${COOKIE_NAME}=${await sessionToken(password)}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Lax`);
      return new Response(null, { status: 303, headers });
    }

    if (url.pathname === LOGOUT_PATH && request.method === 'POST') {
      const headers = new Headers({ Location: '/', ...securityHeaders });
      headers.append('Set-Cookie', `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
      return new Response(null, { status: 303, headers });
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

    for (const prefix of PUBLIC_SITES) {
      if (url.pathname === prefix) return Response.redirect(new URL(`${prefix}/`, url), 308);
    }
    if (url.pathname === LEGACY_PREFIX || url.pathname.startsWith(`${LEGACY_PREFIX}/`)) {
      url.pathname = `${SITE_PREFIX}${url.pathname.slice(LEGACY_PREFIX.length) || '/'}`;
      return Response.redirect(url, 308);
    }

    if (url.pathname === '/' && !(await isAuthorized(request, password))) {
      return htmlResponse(loginPage('/'), 401);
    }

    if (url.pathname === BRIEFING_PATH) {
      const assetUrl = new URL('/briefing-page.shell', url);
      const response = await env.ASSETS.fetch(new Request(assetUrl, request));
      const headers = new Headers(response.headers);
      headers.set('Content-Type', 'text/html; charset=utf-8');
      headers.set('X-Robots-Tag', 'noindex, nofollow');
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
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
