const SITE_PREFIX = '/site';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/') {
      return Response.redirect(new URL(`${SITE_PREFIX}/`, url), 302);
    }

    if (url.pathname === SITE_PREFIX) {
      return Response.redirect(new URL(`${SITE_PREFIX}/`, url), 308);
    }

    if (!url.pathname.startsWith(`${SITE_PREFIX}/`)) {
      return new Response('Página não encontrada', {
        status: 404,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    url.pathname = url.pathname.slice(SITE_PREFIX.length) || '/';
    return env.ASSETS.fetch(new Request(url, request));
  },
};
