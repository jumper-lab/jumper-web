import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../cloudflare/worker.mjs';

test('missing Rodeio documents retain HTTP 404 and the site navigation', async () => {
  const calls = [];
  const env = { ASSETS: { fetch: async request => {
    const path = new URL(request.url).pathname;
    calls.push(path);
    return path === '/rodeio/404.html'
      ? new Response('<header>Rodeio</header><main>Página não encontrada</main>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      : new Response('Not Found', { status: 404 });
  } } };
  const response = await worker.fetch(new Request('https://site.jumper.dev.br/rodeio/ausente/', { headers: { Accept: 'text/html' } }), env);
  assert.equal(response.status, 404);
  assert.match(await response.text(), /<header>Rodeio/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store, max-age=0');
  assert.deepEqual(calls, ['/rodeio/ausente/', '/rodeio/404.html']);
});

test('the Rodeio fallback leaves missing assets and other client routes alone', async () => {
  for (const [path, accept] of [['/rodeio/ausente.avif', 'image/avif'], ['/outro/ausente/', 'text/html']]) {
    const calls = [];
    const response = await worker.fetch(new Request('https://site.jumper.dev.br' + path, { headers: { Accept: accept } }), { ASSETS: { fetch: async request => {
      calls.push(new URL(request.url).pathname);
      return new Response('Not Found', { status: 404 });
    } } });
    assert.equal(response.status, 404);
    assert.deepEqual(calls, [path]);
  }
});
