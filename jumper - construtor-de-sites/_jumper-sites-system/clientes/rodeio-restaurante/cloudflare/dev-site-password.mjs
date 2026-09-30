// Optional, independent password gate for a single client preview.
// No binding means public. Passwords are Cloudflare Worker secrets, never source files.
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();

export function passwordBindingFor(slug) {
  return `HOSTER_DEV_PASSWORD_${slug.toUpperCase().replaceAll('-', '_')}`;
}

function cookieNameFor(slug) {
  return `__Host-jumper_dev_${slug}`;
}

function cookieValue(request, name) {
  for (const part of (request.headers.get('Cookie') || '').split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return value.join('=');
  }
  return '';
}

function base64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

async function sha256(value) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

function sameBytes(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i += 1) difference |= left[i] ^ right[i];
  return difference === 0;
}

async function signature(secret, host, slug, expiresAt) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64url(await crypto.subtle.sign('HMAC', key, encoder.encode(`hoster-dev|${host}|${slug}|${expiresAt}`)));
}

async function hasSession(request, secret, host, slug, now) {
  const value = cookieValue(request, cookieNameFor(slug));
  const [expiresAt, suppliedSignature, extra] = value.split('.');
  if (!/^\d{13}$/.test(expiresAt || '') || !suppliedSignature || extra || Number(expiresAt) <= now) return false;
  const expected = await signature(secret, host, slug, expiresAt);
  return sameBytes(await sha256(suppliedSignature), await sha256(expected));
}

function safeNext(value, slug) {
  return typeof value === 'string' && value.startsWith(`/${slug}/`) && !value.includes('\\') && !/[\r\n]/.test(value)
    ? value : `/${slug}/`;
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function accessPage(slug, next, error = false) {
  const action = `/${slug}/__jumper/preview-login`;
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Prévia protegida — Jumper Studio</title><style>
@font-face{font-family:Saans;src:url('/fonts/Saans-TRIAL-Regular.woff2') format('woff2');font-display:swap}@font-face{font-family:Greed;src:url('/fonts/GreedCondensed-Heavy-TRIAL.woff2') format('woff2');font-display:swap}*{box-sizing:border-box}html{background:#0c0c0c;color:#fff;font-family:Saans,Arial,sans-serif}body{min-height:100dvh;margin:0;display:grid;grid-template-rows:auto 1fr auto;padding:24px clamp(20px,5vw,64px)}header,footer{display:flex;justify-content:space-between;align-items:center;gap:16px}.brand{font-family:Greed,Impact,sans-serif;font-size:24px;letter-spacing:-.03em}.tag,footer{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#aaa}main{width:min(100%,680px);margin:auto 0;padding:56px 0}.eyebrow{color:#ff492b;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}h1{font-family:Greed,Impact,sans-serif;font-size:clamp(46px,8vw,84px);line-height:.94;letter-spacing:-.03em;margin:18px 0}p{color:#bbb;line-height:1.5}form{max-width:440px;margin-top:34px;padding:24px;border:1px solid #424242;border-radius:14px;background:#171717}label{display:block;margin-bottom:9px;font-size:11px;letter-spacing:.12em;text-transform:uppercase}input{width:100%;min-height:48px;padding:12px 14px;border:1px solid #666;border-radius:8px;background:#0c0c0c;color:#fff;font:16px Saans,Arial,sans-serif}input:focus-visible,button:focus-visible{outline:3px solid #ff492b;outline-offset:3px}button{width:100%;min-height:48px;margin-top:14px;border:0;border-radius:100px;background:#ff492b;color:#111;font:700 14px Saans,Arial,sans-serif;cursor:pointer}.error{color:#ff8c78;margin:12px 0 0}@media(max-width:600px){main{padding:36px 0}}
</style></head><body><header><span class="brand">Jumper®</span><span class="tag">Prévia de cliente</span></header><main><span class="eyebrow">Acesso reservado</span><h1>Veja antes de ir ao ar.</h1><p>Esta prévia foi protegida a pedido da Jumper. Use a senha compartilhada para este site.</p><form method="post" action="${action}"><input type="hidden" name="next" value="${escapeHtml(next)}"><label for="password">Senha da prévia</label><input id="password" name="password" type="password" autocomplete="current-password" autofocus required><button type="submit">Abrir prévia ↗</button>${error ? '<p class="error" role="alert">Senha incorreta. Confira com a Jumper e tente novamente.</p>' : ''}</form></main><footer><span>Jumper Studio</span><span>Ambiente de desenvolvimento</span></footer></body></html>`;
  return new Response(html, { status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store, private', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; font-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" } });
}

export async function gateDevSite(request, env, slug, now = Date.now()) {
  const secret = env[passwordBindingFor(slug)];
  if (secret === undefined) return null;
  if (typeof secret !== 'string' || secret.length < 12) {
    return new Response('Prévia temporariamente indisponível.', { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  const auditToken = request.headers.get('X-Jumper-Dev-Audit-Token');
  if (['GET', 'HEAD'].includes(request.method) && env.HOSTER_DEV_AUDIT_TOKEN && auditToken
    && sameBytes(await sha256(auditToken), await sha256(env.HOSTER_DEV_AUDIT_TOKEN))) return null;
  const url = new URL(request.url);
  const loginPath = `/${slug}/__jumper/preview-login`;
  const logoutPath = `/${slug}/__jumper/preview-logout`;
  const name = cookieNameFor(slug);

  if (url.pathname === logoutPath && request.method === 'POST') {
    return new Response(null, { status: 303, headers: { Location: `/${slug}/`, 'Set-Cookie': `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`, 'Cache-Control': 'no-store' } });
  }
  if (url.pathname === loginPath && request.method === 'POST') {
    if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/x-www-form-urlencoded')) {
      return new Response('Formato inválido.', { status: 415, headers: { 'Cache-Control': 'no-store' } });
    }
    if (Number(request.headers.get('Content-Length') || 0) > 4096) {
      return new Response('Envio muito grande.', { status: 413, headers: { 'Cache-Control': 'no-store' } });
    }
    const form = await request.formData();
    const entered = form.get('password');
    const next = safeNext(form.get('next'), slug);
    if (typeof entered !== 'string' || entered.length > 256 || !sameBytes(await sha256(entered), await sha256(secret))) {
      return accessPage(slug, next, true);
    }
    const expiresAt = String(now + SESSION_SECONDS * 1000);
    const value = `${expiresAt}.${await signature(secret, url.hostname, slug, expiresAt)}`;
    return new Response(null, { status: 303, headers: { Location: next, 'Set-Cookie': `${name}=${value}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Lax`, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
  }
  if (await hasSession(request, secret, url.hostname, slug, now)) {
    if (url.pathname === loginPath) return Response.redirect(new URL(`/${slug}/`, url), 303);
    return null;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Acesso não autorizado.', { status: 401, headers: { 'Cache-Control': 'no-store' } });
  return accessPage(slug, safeNext(`${url.pathname}${url.search}`, slug));
}
