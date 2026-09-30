import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readConfig = (name) => JSON.parse(readFileSync(join(root, name), 'utf8'));
const live = readConfig('wrangler.jsonc');
const dev = readConfig('wrangler.dev.jsonc');

assert.equal(live.name, 'jumper-hoster');
assert.equal(dev.name, 'jumper-hoster-dev');
for (const key of ['account_id', 'compatibility_date', 'assets', 'version_metadata']) {
  assert.deepEqual(dev[key], live[key], `${key} precisa corresponder ao Hoster publicado`);
}
assert.equal(dev.main, 'cloudflare/dev-worker.mjs');
assert.equal(dev.workers_dev, false);
assert.equal(dev.preview_urls, false);
assert.deepEqual(dev.routes, [
  'rodeio', 'izigym', 'izigym-lp', 'izigym-lp-vilaromana',
  'casabelie', 'casabelie-2', 'casabelie-3',
].map((slug) => ({ pattern: `site.jumper.dev.br/${slug}/*`, zone_name: 'jumper.dev.br' })),
'somente os sete caminhos dev podem ser roteados');
for (const key of ['d1_databases', 'kv_namespaces', 'ratelimits', 'services', 'vars', 'triggers']) {
  assert.equal(dev[key], undefined, `o Worker dev não pode herdar ${key} de produção`);
}
console.log('Config do jumper-hoster-dev validada: mesmos assets, apenas sete rotas dev, sem dados de produção.');
