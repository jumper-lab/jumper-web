const SITE_PREFIX = '/rodeio';
const LEGACY_PREFIX = '/site';
const PUBLIC_SITES = ['/rodeio', '/izigym', '/casabelie', '/casabelie-2', '/casabelie-3'];
const IZI_OFFICIAL_HOST = 'www.izigym.com.br';
const IZI_OFFICIAL_APEX = 'izigym.com.br';
const IZI_OFFICIAL_ROOT = '/_official/izigym';
const BRIEFING_PREFIX = '/briefing';
const BRIEFING_API = 'https://briefing-formulario-sites-jumper.vercel.app/api/briefings';
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const password = env.JUMPER_HOSTER_PASSWORD;

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

    if (url.pathname === BRIEFING_PREFIX) return Response.redirect(new URL(`${BRIEFING_PREFIX}/`, url), 308);

    if (url.pathname === `${BRIEFING_PREFIX}/api/briefings`) {
      return fetch(new Request(BRIEFING_API, request));
    }

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

    for (const prefix of PUBLIC_SITES) {
      if (url.pathname === prefix) return Response.redirect(new URL(`${prefix}/`, url), 308);
    }
    if (url.pathname === LEGACY_PREFIX || url.pathname.startsWith(`${LEGACY_PREFIX}/`)) {
      url.pathname = `${SITE_PREFIX}${url.pathname.slice(LEGACY_PREFIX.length) || '/'}`;
      return Response.redirect(url, 308);
    }

    if (url.pathname === '/' && !(await isAuthorized(request, password))) {
      return htmlResponse(loginPage('/'));
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
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
