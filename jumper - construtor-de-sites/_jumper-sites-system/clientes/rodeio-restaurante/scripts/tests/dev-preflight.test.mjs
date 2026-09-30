import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { developmentSlugs } from '../../cloudflare/dev-worker.mjs';
import { checkLiveBoundaries, compareUntouchedSites, parseAllowedSlugs } from '../preflight-hoster-dev.mjs';

test('exige exatamente um slug dev conhecido', () => {
  assert.equal(parseAllowedSlugs(['--allow=izigym']), 'izigym');
  for (const args of [[], ['--allow=all'], ['--allow=izigym', '--allow=rodeio'], ['--audit']]) {
    assert.throws(() => parseAllowedSlugs(args));
  }
});

test('bloqueia diferenças em qualquer outro site e ignora só o site autorizado', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hoster-dev-preflight-'));
  try {
    const inventory = {};
    for (const slug of developmentSlugs) {
      await mkdir(join(root, slug));
      await writeFile(join(root, slug, 'index.html'), `${slug} publicado`);
      await writeFile(join(root, slug, 'site.css'), `${slug} CSS publicado`);
      inventory[slug] = [`${slug}/index.html`, `${slug}/site.css`];
    }
    await writeFile(join(root, 'izigym', 'index.html'), 'IZI mudou de propósito');
    const published = async (url) => {
      const [slug, asset] = new URL(url).pathname.slice(1).split('/');
      return new Response(`${slug} ${asset === 'index.html' ? '' : 'CSS '}publicado`, {
        headers: { 'X-Jumper-Worker': 'jumper-hoster-dev' },
      });
    };
    const clean = await compareUntouchedSites({ allowedSlug: 'izigym', root, fetchPublished: published, inventory });
    assert.equal(clean.checked, 12);
    assert.deepEqual(clean.differences, []);

    await writeFile(join(root, 'rodeio', 'site.css'), 'Rodeio mudou sem autorização');
    const blocked = await compareUntouchedSites({ allowedSlug: 'izigym', root, fetchPublished: published, inventory });
    assert.deepEqual(blocked.differences, ['rodeio/site.css: pacote difere do dev publicado']);

    await rm(join(root, 'rodeio', 'site.css'));
    const removed = await compareUntouchedSites({ allowedSlug: 'izigym', root, fetchPublished: published, inventory });
    assert.ok(removed.differences.includes('rodeio/site.css: removido do pacote; revise o inventário em PR'));
    const tamperedInventory = { ...inventory, rodeio: ['rodeio/index.html'] };
    const tampered = await compareUntouchedSites({
      allowedSlug: 'izigym', root, fetchPublished: published,
      inventory: tamperedInventory, baselineInventory: inventory,
    });
    assert.ok(tampered.differences.includes('rodeio: inventário de outro site mudou em relação ao main'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('bloqueia quando outro Worker responde no lugar do dev', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hoster-dev-route-'));
  try {
    const inventory = {};
    for (const slug of developmentSlugs) {
      await mkdir(join(root, slug));
      await writeFile(join(root, slug, 'index.html'), 'igual');
      inventory[slug] = [`${slug}/index.html`];
    }
    const result = await compareUntouchedSites({
      allowedSlug: 'izigym', root, inventory,
      fetchPublished: async () => new Response('igual'),
    });
    assert.equal(result.differences.length, 6);
    assert.ok(result.differences.every((difference) => difference.includes('não veio do jumper-hoster-dev')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('deploy somente do código confere os sete sites, sem exceção', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hoster-dev-worker-only-'));
  try {
    const inventory = {};
    for (const slug of developmentSlugs) {
      await mkdir(join(root, slug));
      await writeFile(join(root, slug, 'index.html'), 'igual');
      inventory[slug] = [`${slug}/index.html`];
    }
    const fetchPublished = async () => new Response('igual', { headers: { 'X-Jumper-Worker': 'jumper-hoster-dev' } });
    const clean = await compareUntouchedSites({ allowedSlug: null, root, inventory, baselineInventory: inventory, fetchPublished });
    assert.equal(clean.checked, 7);
    assert.deepEqual(clean.differences, []);
    await writeFile(join(root, 'izigym', 'index.html'), 'alterado');
    const blocked = await compareUntouchedSites({ allowedSlug: null, root, inventory, baselineInventory: inventory, fetchPublished });
    assert.deepEqual(blocked.differences, ['izigym/index.html: pacote difere do dev publicado']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('segue só redirecionamentos dentro do mesmo site dev', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hoster-dev-redirect-'));
  try {
    const inventory = {};
    for (const slug of developmentSlugs) {
      await mkdir(join(root, slug));
      await writeFile(join(root, slug, 'index.html'), 'igual');
      inventory[slug] = [`${slug}/index.html`];
    }
    const calls = [];
    const fetchPublished = async (url) => {
      calls.push(url);
      const path = new URL(url).pathname;
      if (path === '/rodeio/index.html') return new Response(null, { status: 307, headers: { Location: '/rodeio/' } });
      if (path === '/casabelie/index.html') return new Response(null, { status: 307, headers: { Location: 'https://evil.example/collect' } });
      return new Response('igual', { headers: { 'X-Jumper-Worker': 'jumper-hoster-dev' } });
    };
    const result = await compareUntouchedSites({ allowedSlug: 'izigym', root, inventory, fetchPublished });
    assert.deepEqual(result.differences, ['casabelie/index.html: não foi possível comparar (redirecionamento saiu do site dev; token não enviado)']);
    assert.ok(calls.includes('https://site.jumper.dev.br/rodeio/'));
    assert.ok(calls.every((url) => new URL(url).hostname === 'site.jumper.dev.br'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('detecta quando hub ou briefing são capturados pelo Worker dev', async () => {
  const expected = new Map([
    ['/', 401], ['/briefing/', 200], ['/briefing/styles.css', 200],
    ['/briefing/quiz.js', 200], ['/briefing/api/briefings', 405],
    ['/__jumper/system-status', 401], ['/api/izigym/leads', 401],
  ]);
  const statusFor = (url) => new URL(url).hostname === 'site.jumper.dev.br'
    ? expected.get(new URL(url).pathname) : 200;
  const normal = await checkLiveBoundaries(async (url) => new Response('live', {
    status: statusFor(url),
  }));
  assert.deepEqual(normal.differences, []);
  const captured = await checkLiveBoundaries(async (url) => new Response('dev', {
    status: statusFor(url),
    headers: new URL(url).pathname === '/briefing/' ? { 'X-Jumper-Worker': 'jumper-hoster-dev' } : {},
  }));
  assert.deepEqual(captured.differences, ['briefing: área live respondeu de forma inesperada (HTTP 200)']);
});
