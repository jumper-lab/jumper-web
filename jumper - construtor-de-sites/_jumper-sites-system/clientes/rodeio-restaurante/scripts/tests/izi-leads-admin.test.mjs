import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { test } from 'node:test';
import worker from '../../cloudflare/worker.mjs';

globalThis.crypto ??= webcrypto;

const secret = 'test-only-password';
const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
const token = [...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('jumper-hoster-session-v1')))]
  .map((byte) => byte.toString(16).padStart(2, '0')).join('');

function mockDb(calls) {
  return {
    prepare(sql) {
      const query = { sql, values: [] };
      calls.push(query);
      return {
        bind(...values) { query.values = values; return this; },
        async first() { return { total: 1 }; },
        async all() {
          if (sql.startsWith('SELECT DISTINCT')) return { results: [] };
          return { results: [{ id: 'lead-1', created_at: '2026-09-29 18:00:00', name: '=Test', phone: '11999999999', email: 'test@example.com', plan: 'PRIME', utm_source: 'ads' }] };
        },
      };
    },
  };
}

function environment(calls, devCalls = null) {
  return {
    JUMPER_HOSTER_PASSWORD: secret,
    IZI_LEADS_DB: mockDb(calls),
    IZI_LEADS_TEST_DB: devCalls ? mockDb(devCalls) : { prepare() { throw new Error('Development D1 must not be used.'); } },
  };
}

test('live admin requires authentication', async () => {
  const response = await worker.fetch(new Request('https://site.jumper.dev.br/__jumper/izi-gym/leads-live'), environment([]));
  assert.equal(response.status, 401);
  assert.match(await response.text(), /Senha de acesso/);
});

test('month filter queries production D1 and CSV uses same filter', async () => {
  const calls = [];
  const env = environment(calls);
  const headers = { Cookie: `jumper_hoster_session=${token}` };
  const page = await worker.fetch(new Request('https://site.jumper.dev.br/__jumper/izi-gym/leads-live?month=2026-09', { headers }), env);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /Cadastros do formulário/);
  assert.match(html, /Base de dados/);
  assert.match(html, /izi-lp-CerroCora-leads-dev/);
  assert.doesNotMatch(html, /Campanha \(UTM\)/);
  assert.match(html, /href="\/__jumper\/izi-gym\/leads-live\?database=izi-lp-CerroCora-leads&amp;month=2026-09&amp;page=1"/);
  assert.match(html, /Atualizar planilha/);
  assert.deepEqual(calls[0].values, ['2026-09-01', '2026-10-01']);

  calls.length = 0;
  const csv = await worker.fetch(new Request('https://site.jumper.dev.br/__jumper/izi-gym/leads-live.csv?month=2026-09', { headers }), env);
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get('Content-Disposition'), /izi-lp-CerroCora-leads-2026-09\.csv/);
  assert.deepEqual(calls[0].values, ['2026-09-01', '2026-10-01']);
  assert.match(await csv.text(), /'\=Test/);
});

test('development selection and CSV use only the development D1', async () => {
  const productionCalls = [];
  const developmentCalls = [];
  const env = environment(productionCalls, developmentCalls);
  const headers = { Cookie: `jumper_hoster_session=${token}` };
  const path = 'https://site.jumper.dev.br/__jumper/izi-gym/leads-live';
  const response = await worker.fetch(new Request(`${path}?database=izi-lp-CerroCora-leads-dev&month=2026-09`, { headers }), env);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /<strong>izi-lp-CerroCora-leads-dev<\/strong> está selecionada/);
  assert.equal(productionCalls.length, 0);
  assert.deepEqual(developmentCalls[0].values, ['2026-09-01', '2026-10-01']);

  const csv = await worker.fetch(new Request(`${path}.csv?database=izi-lp-CerroCora-leads-dev&month=2026-09`, { headers }), env);
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get('Content-Disposition'), /izi-lp-CerroCora-leads-dev-2026-09\.csv/);
  assert.equal(productionCalls.length, 0);

  const invalid = await worker.fetch(new Request(`${path}?database=another-db`, { headers }), env);
  assert.equal(invalid.status, 400);
});
