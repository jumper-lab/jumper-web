import assert from 'node:assert/strict';
import { test } from 'node:test';
import devWorker from '../../cloudflare/dev-worker.mjs';
import { gateDevSite, passwordBindingFor } from '../../cloudflare/dev-site-password.mjs';

const host = 'https://site.jumper.dev.br';
const env = { HOSTER_DEV_PASSWORD_IZIGYM: 'somente-izi-teste', ASSETS: { fetch: async () => new Response('site') } };

test('sem segredo por site, o cliente dev continua público', async () => {
  assert.equal(await gateDevSite(new Request(`${host}/rodeio/`), env, 'rodeio'), null);
  assert.equal(passwordBindingFor('izigym-lp-vilaromana'), 'HOSTER_DEV_PASSWORD_IZIGYM_LP_VILAROMANA');
  const invalid = await gateDevSite(new Request(`${host}/rodeio/`), { HOSTER_DEV_PASSWORD_RODEIO: '' }, 'rodeio');
  assert.equal(invalid.status, 503);
});

test('protege HTML e assets apenas do site que recebeu senha', async () => {
  for (const path of ['/izigym/', '/izigym/images/foto.webp']) {
    const response = await devWorker.fetch(new Request(`${host}${path}`), env);
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
    assert.doesNotMatch(await response.text(), /somente-izi-teste/);
  }
  const publicResponse = await devWorker.fetch(new Request(`${host}/rodeio/`), env);
  assert.equal(publicResponse.status, 200);
  assert.equal(await publicResponse.text(), 'site');
});

test('senha correta abre somente o site escolhido e rotação invalida a sessão', async () => {
  const login = await devWorker.fetch(new Request(`${host}/izigym/__jumper/preview-login`, {
    method: 'POST', body: new URLSearchParams({ password: 'somente-izi-teste', next: '/izigym/' }),
  }), env);
  assert.equal(login.status, 303);
  assert.equal(login.headers.get('Location'), '/izigym/');
  const cookie = login.headers.get('Set-Cookie').split(';')[0];
  assert.match(login.headers.get('Set-Cookie'), /HttpOnly; Secure; SameSite=Lax/);
  const authorized = await devWorker.fetch(new Request(`${host}/izigym/images/foto.webp`, { headers: { Cookie: cookie } }), env);
  assert.equal(authorized.status, 200);
  assert.equal(authorized.headers.get('Cache-Control'), 'no-store, private');
  const rotated = await devWorker.fetch(new Request(`${host}/izigym/`, { headers: { Cookie: cookie } }), { ...env, HOSTER_DEV_PASSWORD_IZIGYM: 'nova-senha-de-teste' });
  assert.equal(rotated.status, 401);
  const otherSite = await devWorker.fetch(new Request(`${host}/izigym-lp/`, { headers: { Cookie: cookie } }), { ...env, HOSTER_DEV_PASSWORD_IZIGYM_LP: 'senha-da-lp-forte' });
  assert.equal(otherSite.status, 401);
});

test('senha errada não cria sessão e redirecionamento fica no mesmo site', async () => {
  const login = await devWorker.fetch(new Request(`${host}/izigym/__jumper/preview-login`, {
    method: 'POST', body: new URLSearchParams({ password: 'errada', next: 'https://evil.example/' }),
  }), env);
  assert.equal(login.status, 401);
  assert.equal(login.headers.get('Set-Cookie'), null);
});

test('token de auditoria só lê assets com segredo dev correto', async () => {
  const protectedEnv = { ...env, HOSTER_DEV_AUDIT_TOKEN: 'audit-token-teste' };
  const path = `${host}/izigym/images/foto.webp`;
  const valid = await devWorker.fetch(new Request(path, { headers: { 'X-Jumper-Dev-Audit-Token': 'audit-token-teste' } }), protectedEnv);
  assert.equal(valid.status, 200);
  const invalid = await devWorker.fetch(new Request(path, { headers: { 'X-Jumper-Dev-Audit-Token': 'outra-chave' } }), protectedEnv);
  assert.equal(invalid.status, 401);
  const missing = await devWorker.fetch(new Request(path, { headers: { 'X-Jumper-Dev-Audit-Token': 'audit-token-teste' } }), env);
  assert.equal(missing.status, 401);
});
