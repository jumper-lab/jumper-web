import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { test } from 'node:test';
import worker from '../../cloudflare/worker.mjs';

globalThis.crypto ??= webcrypto;

const secret = 'test-only-password';
const canonicalPath = 'https://site.jumper.dev.br/__jumper/izi-gym/lp-cerro-cora/leads-live';
const legacyPath = 'https://site.jumper.dev.br/__jumper/izi-gym/leads-live';
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
  for (const path of [canonicalPath, legacyPath]) {
    const response = await worker.fetch(new Request(`${path}?period=today`), environment([]));
    assert.equal(response.status, 401);
    const html = await response.text();
    assert.match(html, /Senha de acesso/);
    assert.match(html, new RegExp(`name="next" value="${new URL(path).pathname}\\?period=today"`));
  }
});

test('month filter queries production D1 and CSV uses same filter', async () => {
  const calls = [];
  const env = environment(calls);
  const headers = { Cookie: `jumper_hoster_session=${token}` };
  const page = await worker.fetch(new Request(`${canonicalPath}?month=2026-09`, { headers }), env);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /Cadastros da LP Cerro Corá/);
  assert.match(html, /Base de dados/);
  assert.match(html, /izi-lp-CerroCora-leads-dev/);
  assert.match(html, /href="https:\/\/dash\.cloudflare\.com\/e23efa36a1e09015eebb2b36bdfcf201\/workers\/d1\/databases\/e06d432d-eaf4-47cb-90a2-fd7b6cc54ebc\/studio" target="_blank" rel="noopener noreferrer">Abrir base da LP Cerro Corá no Cloudflare/);
  assert.doesNotMatch(html, /Campanha \(UTM\)/);
  assert.match(html, /href="\/__jumper\/izi-gym\/lp-cerro-cora\/leads-live\?database=izi-lp-CerroCora-leads&amp;month=2026-09&amp;page=1"/);
  assert.match(html, /Atualizar cadastros da LP Cerro Corá/);
  assert.match(html, /Baixar CSV da LP Cerro Corá/);
  assert.deepEqual(calls[0].values, ['2026-09-01', '2026-10-01']);

  calls.length = 0;
  const csv = await worker.fetch(new Request(`${canonicalPath}.csv?month=2026-09`, { headers }), env);
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get('Content-Disposition'), /izi-lp-CerroCora-leads-2026-09\.csv/);
  assert.deepEqual(calls[0].values, ['2026-09-01', '2026-10-01']);
  assert.match(await csv.text(), /'\=Test/);
});

test('legacy dashboard and CSV URLs remain connected to the same LP Cerro Corá data', async () => {
  const calls = [];
  const env = environment(calls);
  const headers = { Cookie: `jumper_hoster_session=${token}` };
  const page = await worker.fetch(new Request(`${legacyPath}?period=today`, { headers }), env);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /Cadastros da LP Cerro Corá/);
  assert.match(html, /href="\/__jumper\/izi-gym\/lp-cerro-cora\/leads-live\?database=izi-lp-CerroCora-leads&amp;period=today&amp;page=1"/);
  const csv = await worker.fetch(new Request(`${legacyPath}.csv?period=today`, { headers }), env);
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get('Content-Disposition'), /izi-lp-CerroCora-leads-today\.csv/);
  assert.ok(calls.length > 0);
});

test('development selection and CSV use only the development D1', async () => {
  const productionCalls = [];
  const developmentCalls = [];
  const env = environment(productionCalls, developmentCalls);
  const headers = { Cookie: `jumper_hoster_session=${token}` };
  const path = 'https://site.jumper.dev.br/__jumper/izi-gym/leads-live';
  const response = await worker.fetch(new Request(`${path}?database=izi-lp-CerroCora-leads-dev&month=2026-09`, { headers }), env);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<strong>izi-lp-CerroCora-leads-dev<\/strong> está selecionada/);
  assert.match(html, /href="https:\/\/dash\.cloudflare\.com\/e23efa36a1e09015eebb2b36bdfcf201\/workers\/d1\/databases\/af52ce85-b519-473c-ad3c-66654cf3aabd\/studio" target="_blank" rel="noopener noreferrer">Abrir base da LP Cerro Corá no Cloudflare/);
  assert.equal(productionCalls.length, 0);
  assert.deepEqual(developmentCalls[0].values, ['2026-09-01', '2026-10-01']);

  const csv = await worker.fetch(new Request(`${path}.csv?database=izi-lp-CerroCora-leads-dev&month=2026-09`, { headers }), env);
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get('Content-Disposition'), /izi-lp-CerroCora-leads-dev-2026-09\.csv/);
  assert.equal(productionCalls.length, 0);

  const invalid = await worker.fetch(new Request(`${path}?database=another-db`, { headers }), env);
  assert.equal(invalid.status, 400);
});

test('custom date range filters the table and CSV using São Paulo calendar days', async () => {
  const calls = [];
  const env = environment(calls);
  const headers = { Cookie: `jumper_hoster_session=${token}` };
  const path = 'https://site.jumper.dev.br/__jumper/izi-gym/leads-live';
  const query = 'period=custom&from=2026-09-15&to=2026-09-29';
  const response = await worker.fetch(new Request(`${path}?${query}`, { headers }), env);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<span class="field-label">Período<\/span><details class="period-picker"/);
  assert.match(html, /class="period-summary">15\/09\/2026 a 29\/09\/2026<\/summary>/);
  assert.match(html, /class="calendar" hidden/);
  assert.match(html, /name="from" value="2026-09-15"/);
  assert.match(html, /name="to" value="2026-09-29"/);
  assert.doesNotMatch(html, /name="from" type="date"/);
  assert.match(html, /period=custom&amp;from=2026-09-15&amp;to=2026-09-29/);
  assert.deepEqual(calls[0].values, ['2026-09-15T03:00:00.000Z', '2026-09-30T03:00:00.000Z']);

  calls.length = 0;
  const csv = await worker.fetch(new Request(`${path}.csv?${query}`, { headers }), env);
  assert.equal(csv.status, 200);
  assert.deepEqual(calls[0].values, ['2026-09-15T03:00:00.000Z', '2026-09-30T03:00:00.000Z']);
  assert.match(csv.headers.get('Content-Disposition'), /2026-09-15-a-2026-09-29\.csv/);
});

test('invalid custom date ranges are rejected', async () => {
  const headers = { Cookie: `jumper_hoster_session=${token}` };
  const path = 'https://site.jumper.dev.br/__jumper/izi-gym/leads-live';
  for (const query of ['period=custom&from=2026-09-29&to=2026-09-01', 'period=custom&from=2026-02-30&to=2026-03-01', 'period=custom&from=2026-09-01']) {
    const response = await worker.fetch(new Request(`${path}?${query}`, { headers }), environment([]));
    assert.equal(response.status, 400);
  }
});
