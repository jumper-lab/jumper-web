import { compareHubDeployment } from './hub-status.mjs';

const HUB_HOST = 'site.jumper.dev.br';
const HUB_STATUS_PATH = '/__jumper/hub-status';
const HOSTER_STATUS_PATH = '/__jumper/system-status';
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
    if (url.pathname === HUB_STATUS_PATH) {
      if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } });
      const hosterUrl = new URL(HOSTER_STATUS_PATH, url);
      const hosterResponse = await env.HOSTER.fetch(new Request(hosterUrl, request));
      if (hosterResponse.status !== 200) return hubHeaders(hosterResponse, { 'Cache-Control': 'no-store, private' });
      const status = await hosterResponse.json();
      const metadata = env.CF_VERSION_METADATA;
      const commitSha = /^git-([a-f0-9]{40})$/.exec(metadata?.tag || '')?.[1] || null;
      const mainSha = status.repositories?.find((repository) => repository.id === 'jumper-web')?.sha;
      const state = await compareHubDeployment(commitSha, mainSha);
      status.hub = {
        worker: 'jumper-hub',
        versionId: metadata?.id || null,
        deployedAt: metadata?.timestamp || null,
        commitSha,
        state,
      };
      if (state !== 'matched') {
        status.alerts = Array.isArray(status.alerts) ? status.alerts : [];
        status.alerts.push({
          level: state === 'different' ? 'attention' : 'partial',
          source: 'jumper-hub',
          title: state === 'different' ? 'Hub publicado e GitHub estão diferentes'
            : state === 'pending' ? 'Ajustes do hub ainda não publicados' : 'Versão do hub não confirmada',
          detail: state === 'different' ? 'A versão ativa do hub não pertence ao histórico atual do main.'
            : state === 'pending' ? 'Há mudanças do painel no GitHub posteriores ao último deploy do hub.'
              : 'Não foi possível comparar a versão ativa do painel com o GitHub.',
        });
      }
      if (status.hub.versionId) {
        const commit = status.repositories?.find((repository) => repository.id === 'jumper-web')?.recentCommits
          ?.find((item) => item.sha === commitSha);
        status.activity = Array.isArray(status.activity) ? status.activity : [];
        status.activity.push({
          id: `jumper-hub-deploy-${status.hub.versionId}`,
          source: 'jumper-hub',
          kind: 'hub-deploy',
          title: 'Hub publicado na Cloudflare',
          detail: commit?.message || 'Versão ativa do painel.',
          occurredAt: status.hub.deployedAt || null,
          url: commitSha ? `https://github.com/jumper-lab/jumper-web/commit/${commitSha}` : null,
        });
        status.activity.sort((left, right) => Date.parse(right.occurredAt || '') - Date.parse(left.occurredAt || ''));
      }
      return hubHeaders(new Response(JSON.stringify(status), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, private' },
      }));
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
