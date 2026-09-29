import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareDomains, compareProtectedPages, protectedPages } from '../../clientes/rodeio-restaurante/scripts/preflight-hoster.mjs';

const files = new Map(protectedPages.map(([, , asset]) => [asset, Buffer.from(`conteúdo de ${asset}`)]));
const assetsByUrl = new Map(protectedPages.map(([, url, asset]) => [url, asset]));

test('a comparação aprova apenas páginas idênticas às publicadas', async () => {
  const differences = await compareProtectedPages(
    async (asset) => files.get(asset),
    async (url) => new Response(files.get(assetsByUrl.get(url))),
  );
  assert.deepEqual(differences, []);
});

test('a comparação bloqueia conteúdo divergente e arquivo ausente', async () => {
  const differences = await compareProtectedPages(
    async (asset) => {
      if (asset === 'cerrocora/index.html') throw new Error('ausente');
      return files.get(asset);
    },
    async (url) => new Response(url.endsWith('/izigym/') ? 'versão diferente' : files.get(assetsByUrl.get(url))),
  );
  assert.equal(differences.length, 2);
  assert.match(differences[0], /IZI Gym dev: conteúdo publicado difere/);
  assert.match(differences[1], /Cerro Corá oficial: arquivo ausente/);
});

test('a comparação bloqueia falhas HTTP em vez de aceitar uma página de erro', async () => {
  const differences = await compareProtectedPages(
    async (asset) => files.get(asset),
    async () => new Response('erro', { status: 503 }),
  );
  assert.equal(differences.length, protectedPages.length);
  assert.ok(differences.every((difference) => difference.includes('HTTP 503')));
});

test('domínios não podem desaparecer nem ser adicionados num deploy do hub', () => {
  assert.deepEqual(compareDomains(['site.jumper.dev.br'], ['site.jumper.dev.br']), []);
  assert.deepEqual(
    compareDomains(['site.jumper.dev.br', 'novo.exemplo.com'], ['site.jumper.dev.br', 'cerrocora.izigym.com.br']),
    [
      'Domínio ativo ausente no wrangler.jsonc (cerrocora.izigym.com.br)',
      'Domínio novo no wrangler.jsonc exige revisão (novo.exemplo.com)',
    ],
  );
});
