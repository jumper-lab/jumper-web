import assert from 'node:assert/strict';
import { test } from 'node:test';
import devWorker, { developmentSlugs, isDevelopmentRequest, isPreviewAsset } from '../../cloudflare/dev-worker.mjs';

test('somente os oito caminhos de desenvolvimento registrados são permitidos', () => {
  assert.equal(developmentSlugs.length, 8);
  for (const slug of developmentSlugs) {
    assert.equal(isDevelopmentRequest(new URL(`https://site.jumper.dev.br/${slug}/`)), true);
    assert.equal(isDevelopmentRequest(new URL(`https://site.jumper.dev.br/${slug}/assets/file.js`)), true);
  }
  for (const url of [
    'https://site.jumper.dev.br/',
    'https://site.jumper.dev.br/briefing/',
    'https://site.jumper.dev.br/briefing/api/briefings',
    'https://site.jumper.dev.br/__dev/hub/',
    'https://site.jumper.dev.br/__dev/briefing/',
    'https://site.jumper.dev.br/api/izigym/leads',
    'https://site.jumper.dev.br/__jumper/system-status',
    'https://site.jumper.dev.br/_official/izigym/index.html',
    'https://www.izigym.com.br/',
    'https://cerrocora.izigym.com.br/',
  ]) assert.equal(isDevelopmentRequest(new URL(url)), false, url);
});

test('Pão de Queijo: quatro páginas e assets públicos, sem capturar domínio oficial ou slug vizinho', async () => {
  const prefix = '/pao-de-queijo-haddock-lobo/';
  for (const route of ['', 'sobre/', 'lojas/', 'menu/', '_astro/site.js', 'images/hero.webp']) {
    const url = `https://site.jumper.dev.br${prefix}${route}`;
    let fetched;
    const response = await devWorker.fetch(new Request(url), {
      ASSETS: { fetch: async (request) => { fetched = request.url; return new Response('preview', { headers: { 'Content-Type': route.endsWith('.js') ? 'text/javascript' : 'text/html' } }); } },
    });
    assert.equal(fetched, url);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-Jumper-Worker'), 'jumper-hoster-dev');
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
    assert.equal(await response.text(), 'preview');
  }
  for (const url of [
    'https://paodequeijohaddocklobo.com.br/',
    'https://site.jumper.dev.br/pao-de-queijo-haddock-lobo-v2/',
    'https://site.jumper.dev.br/briefing/',
  ]) {
    assert.equal(isDevelopmentRequest(new URL(url)), false);
    assert.equal((await devWorker.fetch(new Request(url), {})).status, 404);
  }
});

test('responde 404 fora dos caminhos dev antes de acessar qualquer binding', async () => {
  const response = await devWorker.fetch(new Request('https://www.izigym.com.br/'), {});
  assert.equal(response.status, 404);
});

test('host de prévia permanece fechado sem aplicação Access configurada', async () => {
  const assets = { fetch: async () => { throw new Error('assets não deveriam ser lidos'); } };
  for (const path of ['/', '/briefing/', '/__jumper/system-status']) {
    const response = await devWorker.fetch(new Request(`https://site-dev.jumper.dev.br${path}`), { ASSETS: assets });
    assert.equal(response.status, 404, path);
  }
});

test('prévia interna não inclui o formulário público', () => {
  assert.equal(isPreviewAsset('/'), false);
  assert.equal(isPreviewAsset('/index.html'), false);
  assert.equal(isPreviewAsset('/briefing/'), false);
  assert.equal(isPreviewAsset('/briefing/api/briefings'), false);
});

test('marca uma resposta dev sem mudar seu corpo', async () => {
  const request = new Request('https://site.jumper.dev.br/rodeio/');
  const response = await devWorker.fetch(request, {
    ASSETS: { fetch: async () => new Response('cópia publicada', { headers: { 'Content-Type': 'text/html' } }) },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Jumper-Worker'), 'jumper-hoster-dev');
  assert.equal(await response.text(), 'cópia publicada');
});
