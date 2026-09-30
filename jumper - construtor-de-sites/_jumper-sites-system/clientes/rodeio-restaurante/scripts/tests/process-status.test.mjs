import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cloudflareProcesses, githubWebhook } from '../../cloudflare/process-status.mjs';
import worker from '../../cloudflare/worker.mjs';

const now = Date.parse('2026-09-30T08:00:00Z');

test('Cloudflare process list accepts only fresh, known Worker deployments', async () => {
  const records = [
    { source: 'jumper-hoster', phase: 'Publicando na Cloudflare', startedAt: '2026-09-30T07:59:00Z', updatedAt: '2026-09-30T07:59:30Z', commitSha: 'a'.repeat(40) },
    { source: 'jumper-hoster-dev', phase: 'Pacote antigo', updatedAt: '2026-09-30T07:50:00Z' },
    { source: 'another-worker', phase: 'Não pertence ao Hoster', updatedAt: '2026-09-30T07:59:30Z' },
  ];
  const namespace = {
    async list() { return { list_complete: true, keys: records.map((_, index) => ({ name: `deploy/${index}` })) }; },
    async get(name) { return records[Number(name.split('/')[1])]; },
  };
  const result = await cloudflareProcesses(namespace, { now });
  assert.equal(result.available, true);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].source, 'jumper-hoster');
  assert.match(result.items[0].url, /github\.com\/jumper-lab\/jumper-web\/commit\/a{40}$/);
});

test('missing or failed Cloudflare source is unknown, never idle', async () => {
  assert.deepEqual(await cloudflareProcesses(undefined, { now }), { available: false, items: [] });
  assert.deepEqual(await cloudflareProcesses({ async list() { throw new Error('offline'); }, async get() {} }, { now }), { available: false, items: [] });
});

test('signed GitHub execution appears with its verified run link', async () => {
  const record = { source: 'jumper-web', phase: 'GitHub: testes em execução', startedAt: '2026-09-30T07:59:00Z',
    updatedAt: '2026-09-30T07:59:30Z', url: 'https://github.com/jumper-lab/jumper-web/actions/runs/123' };
  const result = await cloudflareProcesses({
    async list() { return { list_complete: true, keys: [{ name: 'github/jumper-web/123' }] }; },
    async get() { return record; },
  }, { now, githubEventsEnabled: true });
  assert.equal(result.githubEventsEnabled, true);
  assert.equal(result.items[0].url, record.url);
});

test('process endpoint is available only to the hub session', async () => {
  const url = 'https://site.jumper.dev.br/__jumper/active-processes';
  const env = { JUMPER_HOSTER_PASSWORD: 'admin-secret', JUMPER_HUB_PASSWORD: 'hub-secret',
    JUMPER_HUB_OPERATIONS: { async list() { return { list_complete: true, keys: [] }; }, async get() { return null; } } };
  assert.equal((await worker.fetch(new Request(url), env)).status, 401);
  const admin = await worker.fetch(new Request('https://site.jumper.dev.br/__jumper/login', {
    method: 'POST', body: new URLSearchParams({ password: 'admin-secret', next: '/izigym-leads-test/' }),
  }), env);
  assert.equal((await worker.fetch(new Request(url, { headers: { Cookie: admin.headers.get('Set-Cookie').split(';')[0] } }), env)).status, 401);
  const hub = await worker.fetch(new Request('https://site.jumper.dev.br/__jumper/login', {
    method: 'POST', body: new URLSearchParams({ password: 'hub-secret', next: '/' }),
  }), env);
  const response = await worker.fetch(new Request(url, { headers: { Cookie: hub.headers.get('Set-Cookie').split(';')[0] } }), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { available: true, githubEventsEnabled: false, items: [] });
});

test('GitHub webhook requires a valid signature and clears a completed run', async () => {
  const records = new Map();
  const namespace = {
    async put(key, value) { records.set(key, JSON.parse(value)); },
    async delete(key) { records.delete(key); },
  };
  const secret = 'webhook-test-secret';
  const run = { id: 123, name: 'Verificações', status: 'in_progress', created_at: '2026-09-30T08:00:00Z', html_url: 'https://github.com/jumper-lab/jumper-web/actions/runs/123' };
  const payload = { action: 'in_progress', repository: { full_name: 'jumper-lab/jumper-web' }, workflow_run: run };
  const signed = async (data) => {
    const body = JSON.stringify(data);
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const digest = [...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)))].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    return new Request('https://site.jumper.dev.br/__jumper/github-events', { method: 'POST', body, headers: { 'X-Hub-Signature-256': `sha256=${digest}`, 'X-GitHub-Event': 'workflow_run' } });
  };
  assert.equal((await githubWebhook(new Request('https://site.jumper.dev.br/__jumper/github-events', { method: 'POST', body: JSON.stringify(payload) }), namespace, secret)).status, 401);
  assert.equal((await worker.fetch(await signed(payload), { JUMPER_HUB_OPERATIONS: namespace })).status, 404);
  assert.equal((await githubWebhook(await signed(payload), namespace, secret)).status, 202);
  assert.equal(records.get('github/jumper-web/123').source, 'jumper-web');
  assert.match(records.get('github/jumper-web/123').phase, /em execução/);
  assert.equal((await githubWebhook(await signed({ ...payload, action: 'completed', workflow_run: { ...run, status: 'completed' } }), namespace, secret)).status, 202);
  assert.equal(records.size, 0);
});
