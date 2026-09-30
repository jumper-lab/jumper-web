import hoster from './worker.mjs';
import { verifyDevAccess } from './dev-access.mjs';

export const previewHost = 'site-dev.jumper.dev.br';

export const developmentSlugs = Object.freeze([
  'rodeio',
  'izigym',
  'izigym-lp',
  'izigym-lp-vilaromana',
  'casabelie',
  'casabelie-2',
  'casabelie-3',
]);

export function isDevelopmentRequest(url) {
  return url.hostname === 'site.jumper.dev.br'
    && developmentSlugs.some((slug) => url.pathname.startsWith(`/${slug}/`));
}

export function isPreviewAsset(pathname) {
  return pathname === '/' || pathname === '/index.html'
    || pathname === '/briefing' || pathname.startsWith('/briefing/')
    || pathname === '/hub-redesign.css' || pathname === '/favicon-jumper.png'
    || pathname.startsWith('/hub-design-system/') || pathname.startsWith('/fonts/');
}

async function previewResponse(request, env) {
  const url = new URL(request.url);
  if (!await verifyDevAccess(request, env)) return new Response('Not Found', { status: 404 });
  if (url.pathname === '/briefing/api/briefings') {
    return new Response(JSON.stringify({ error: 'Envio desativado na prévia de desenvolvimento.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
    });
  }
  if (url.pathname === '/__jumper/system-status') {
    return new Response(JSON.stringify({ error: 'Estado do live indisponível nesta prévia.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
    });
  }
  if (url.pathname === '/__jumper/logout' && request.method === 'POST') {
    return Response.redirect(new URL('/cdn-cgi/access/logout', url), 303);
  }
  if (!['GET', 'HEAD'].includes(request.method) || !isPreviewAsset(url.pathname)) {
    return new Response('Not Found', { status: 404 });
  }
  if (url.pathname === '/briefing') return Response.redirect(new URL('/briefing/', url), 308);
  const response = await env.ASSETS.fetch(request);
  const headers = new Headers(response.headers);
  headers.set('X-Jumper-Worker', 'jumper-hoster-dev');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  headers.set('Cache-Control', 'no-store');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);
    if (url.hostname === previewHost) return previewResponse(request, env);
    if (!isDevelopmentRequest(url)) {
      return new Response('Not Found', { status: 404 });
    }
    const response = await hoster.fetch(request, env, context);
    const headers = new Headers(response.headers);
    headers.set('X-Jumper-Worker', 'jumper-hoster-dev');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
