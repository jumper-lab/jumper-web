import assert from 'node:assert/strict';
import { test } from 'node:test';
import devWorker, { developmentSlugs, isDevelopmentRequest, isPreviewAsset } from '../../cloudflare/dev-worker.mjs';

test('somente os sete caminhos de desenvolvimento são permitidos', () => {
  assert.equal(developmentSlugs.length, 7);
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
  assert.equal(isPreviewAsset('/'), true);
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
