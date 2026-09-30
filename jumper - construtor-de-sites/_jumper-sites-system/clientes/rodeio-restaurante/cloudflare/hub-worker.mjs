const HUB_HOST = 'site.jumper.dev.br';
const PUBLIC_PREFIX = '/hub-assets/';

function hubHeaders(response, extra = {}) {
  const headers = new Headers(response.headers);
  headers.set('X-Jumper-Surface', 'jumper-hub');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  for (const [name, value] of Object.entries(extra)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname !== HUB_HOST) return new Response('Not Found', { status: 404 });
    if (url.pathname.startsWith(PUBLIC_PREFIX)) {
      if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method Not Allowed', { status: 405 });
      return hubHeaders(await env.ASSETS.fetch(request));
    }
    if (url.pathname !== '/') return new Response('Not Found', { status: 404 });
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method Not Allowed', { status: 405 });

    // The hoster remains the single authority for the existing session cookie.
    // A failed auth check must never expose the hub document.
    const headers = new Headers({ 'X-Jumper-Hub-Auth': '1' });
    const cookie = request.headers.get('Cookie');
    if (cookie) headers.set('Cookie', cookie);
    const authorization = await env.HOSTER.fetch(new Request(new URL('/', url), { headers }));
    if (authorization.status === 401) {
      return hubHeaders(authorization, { 'Cache-Control': 'no-store, private' });
    }
    if (authorization.status !== 200 && authorization.status !== 204) {
      return hubHeaders(new Response('Hub temporariamente indisponível.', { status: 503 }), { 'Cache-Control': 'no-store, private' });
    }

    const documentUrl = new URL('/index.html', url);
    const document = await env.ASSETS.fetch(new Request(documentUrl, request));
    if (document.status !== 200) {
      return hubHeaders(new Response('Hub temporariamente indisponível.', { status: 503 }), { 'Cache-Control': 'no-store, private' });
    }
    return hubHeaders(document, { 'Cache-Control': 'no-store, private' });
  },
};
