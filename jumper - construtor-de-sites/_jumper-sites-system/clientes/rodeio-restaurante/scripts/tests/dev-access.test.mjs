import assert from 'node:assert/strict';
import { test } from 'node:test';
import { webcrypto } from 'node:crypto';
import { resetDevAccessCertificatesForTests, verifyDevAccess } from '../../cloudflare/dev-access.mjs';

const now = Date.parse('2026-09-30T12:00:00Z');
const audience = 'test-preview-audience';

function encode(value) {
  return Buffer.from(Buffer.isBuffer(value) ? value : typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');
}

async function signedRequest(overrides = {}) {
  const pair = await webcrypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = await webcrypto.subtle.exportKey('jwk', pair.publicKey);
  jwk.kid = 'dev-test-key';
  const header = encode({ alg: 'RS256', kid: jwk.kid });
  const payload = encode({ iss: 'https://jumperstudio.cloudflareaccess.com', aud: [audience], email: 'pessoa@jumper.studio', exp: Math.floor(now / 1000) + 300, ...overrides });
  const input = `${header}.${payload}`;
  const signature = encode(Buffer.from(await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, new TextEncoder().encode(input))));
  const request = new Request('https://site-dev.jumper.dev.br/', { headers: { 'Cf-Access-Jwt-Assertion': `${input}.${signature}` } });
  return { request, fetchImpl: async () => new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'Content-Type': 'application/json' } }) };
}

test('prévia aceita JWT válido apenas de e-mail @jumper.studio e audiência da aplicação', async () => {
  resetDevAccessCertificatesForTests();
  const signed = await signedRequest();
  assert.equal(await verifyDevAccess(signed.request, { HOSTER_DEV_ACCESS_AUD: audience }, { fetchImpl: signed.fetchImpl, now }), true);
  assert.equal(await verifyDevAccess(signed.request, {}, { fetchImpl: signed.fetchImpl, now }), false);
  assert.equal(await verifyDevAccess(signed.request, { HOSTER_DEV_ACCESS_AUD: 'outra-aplicação' }, { fetchImpl: signed.fetchImpl, now }), false);
});

for (const [name, overrides] of [
  ['domínio externo', { email: 'pessoa@outro.com' }],
  ['sufixo falso', { email: 'pessoa@jumper.studio.evil.com' }],
  ['emissor falso', { iss: 'https://fake.cloudflareaccess.com' }],
  ['expirado', { exp: Math.floor(now / 1000) - 1 }],
]) {
  test(`prévia rejeita ${name}`, async () => {
    resetDevAccessCertificatesForTests();
    const signed = await signedRequest(overrides);
    assert.equal(await verifyDevAccess(signed.request, { HOSTER_DEV_ACCESS_AUD: audience }, { fetchImpl: signed.fetchImpl, now }), false);
  });
}
