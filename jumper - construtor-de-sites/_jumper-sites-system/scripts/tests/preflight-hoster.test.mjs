import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { compareDomains, compareProtectedPages, protectedPages, readPromotion, validatePromotionScope } from '../../clientes/rodeio-restaurante/scripts/preflight-hoster.mjs';

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

test('promoção do principal mantém escopo, páginas e hashes específicos', async () => {
  const promotion = await readPromotion(['--promote=principal-tracking-2026-10-13']);
  assert.equal(promotion.scope, 'principal');
  for (const change of [
    { scope: 'cerrocora' },
    { pages: [...promotion.pages, { ...promotion.pages[0], asset: 'cerrocora/index.html' }] },
    { pages: [{ ...promotion.pages[0], candidateSha256: 'qualquer' }, promotion.pages[1]] },
  ]) assert.throws(() => validatePromotionScope({ ...promotion, ...change }, 'principal-tracking-2026-10-13'));
  await assert.rejects(readPromotion(['--promote=principal-qualquer']));
  await assert.rejects(readPromotion(['--promote=principal-tracking-2026-10-13', '--skip-checks']));
});

test('promoção do principal não permite mudar a Cerro Corá ou bytes não revisados', async () => {
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  const principal = '_official/izigym/index.shell';
  const candidate = Buffer.from('principal aprovado');
  const published = Buffer.from('principal anterior');
  const promotion = { pages: [{ asset: principal, candidateSha256: sha(candidate), publishedSha256: [sha(published), sha(candidate)] }] };
  const readCandidate = async asset => asset === principal ? candidate : files.get(asset);
  const fetchLive = async url => new Response(assetsByUrl.get(url) === principal ? published : files.get(assetsByUrl.get(url)));
  assert.deepEqual(await compareProtectedPages(readCandidate, fetchLive, promotion), []);
  const changed = await compareProtectedPages(
    async asset => asset === 'cerrocora/index.html' ? Buffer.from('cerro não aprovada') : readCandidate(asset), fetchLive, promotion,
  );
  assert.equal(changed.length, 1);
  assert.match(changed[0], /Cerro Corá oficial: conteúdo publicado difere/);
  const unknown = await compareProtectedPages(async asset => asset === principal ? Buffer.from('principal não revisado') : readCandidate(asset), fetchLive, promotion);
  assert.equal(unknown.length, 1);
  assert.match(unknown[0], /IZI Gym oficial: pacote ou publicação difere da promoção revisada/);
});
