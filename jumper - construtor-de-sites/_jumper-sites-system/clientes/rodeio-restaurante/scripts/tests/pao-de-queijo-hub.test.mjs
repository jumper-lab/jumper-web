import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import worker from '../../cloudflare/worker.mjs';

const root = new URL('../../', import.meta.url);
const slug = 'pao-de-queijo-haddock-lobo';
const registry = JSON.parse(await readFile(new URL('../../jumper-hoster.registry.json', root), 'utf8'));

test('card Pão de Queijo separa a prévia do site oficial externo', async () => {
  const clients = registry.clients.filter(client => client.id === slug);
  assert.equal(clients.length, 1);
  const [client] = clients;
  assert.deepEqual(client.developmentSites, [{
    slug, label: 'Site em desenvolvimento', url: `https://site.jumper.dev.br/${slug}/`,
  }]);
  assert.deepEqual(client.officialSite, {
    label: 'Site oficial', url: 'https://paodequeijohaddocklobo.com.br/',
  });
  assert.equal(client.hubLinks, undefined);
  const html = await readFile(new URL('hoster-dist/index.html', root), 'utf8');
  const button = html.match(/<button[^>]*data-client="Pão de Queijo Haddock Lobo"[^>]*>/)?.[0];
  assert.ok(button, 'Card precisa estar no HTML gerado, não apenas no registro');
  const encoded = button.match(/data-links="([^"]+)"/)[1];
  const links = JSON.parse(encoded.replaceAll('&quot;', '"').replaceAll('&#039;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&'));
  assert.deepEqual(links, [
    { label: 'Site em desenvolvimento', url: `/${slug}/`, external: false },
    { label: 'Site oficial', url: 'https://paodequeijohaddocklobo.com.br/', external: true },
  ]);
});

test('adicionar o cliente não abre o hub nem altera o domínio oficial', async () => {
  const env = { JUMPER_HUB_PASSWORD: 'only-a-test-hub-password' };
  for (const route of ['/', '/index.html']) {
    const response = await worker.fetch(new Request(`https://site.jumper.dev.br${route}`), env);
    assert.equal(response.status, 401);
  }
  const config = JSON.parse(await readFile(new URL('wrangler.jsonc', root), 'utf8'));
  assert.ok(config.routes.every(route => !route.pattern.includes('paodequeijohaddocklobo.com.br')));
});

test('pacote Pão de Queijo mantém quatro páginas e preview não indexável', async () => {
  for (const file of ['index.html', 'sobre/index.html', 'lojas/index.html', 'menu/index.html']) {
    const html = await readFile(new URL(`hoster-dist/${slug}/${file}`, root), 'utf8');
    assert.ok(html.includes('name="robots" content="noindex,follow"'), file);
    for (const [, url] of html.matchAll(/(?:src|href)="(\/[^"\s]*)"/g)) {
      assert.ok(url.startsWith(`/${slug}/`), `${file}: ${url}`);
    }
  }
  const robots = await readFile(new URL(`hoster-dist/${slug}/robots.txt`, root), 'utf8');
  assert.match(robots, /Disallow: \//);
  const home = await readFile(new URL(`hoster-dist/${slug}/index.html`, root), 'utf8');
  assert.match(home, /data-contact-submit[^>]*disabled/);
});
