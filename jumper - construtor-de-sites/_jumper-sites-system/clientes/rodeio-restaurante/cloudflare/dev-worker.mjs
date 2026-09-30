import hoster from './worker.mjs';

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

export default {
  async fetch(request, env, context) {
    if (!isDevelopmentRequest(new URL(request.url))) {
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
