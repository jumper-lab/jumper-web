import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPhone, submitClixx, clixxRedirectUrl, CLIXX_WEBHOOK } from '../src/enrollment-form.ts';

test('Clixx receives the supplied company, fields, consent and six arrival UTMs', async () => {
  let request;
  const result = await submitClixx({ nome: 'Pessoa de teste', celular: '11999999999', lgpd_consentimento: 0 },
    { utm_source: 'teste', utm_medium: 'email', utm_campaign: 'izi', utm_content: 'cta', utm_term: 'academia', utm_id: '42', cupom: 'OUTRO', empresa_id: '999' },
    async (url, options) => { request = { url, ...options }; return Response.json({ success: true, redirect_url: 'https://checkout.example/' }); });
  assert.equal(request.url, CLIXX_WEBHOOK);
  assert.equal(request.method, 'POST');
  assert.deepEqual(JSON.parse(request.body), { utm_source: 'teste', utm_medium: 'email', utm_campaign: 'izi', utm_term: 'academia', utm_content: 'cta', utm_id: '42', nome: 'Pessoa de teste', celular: '11999999999', lgpd_consentimento: 0, empresa_id: 205, origem: 'embed' });
  assert.equal(result.success, true);
});

test('already enrolled is successful too, while rejection, HTTP errors and invalid JSON fail', async () => {
  const values = { nome: 'Teste', celular: '11999999999', lgpd_consentimento: 1 };
  assert.equal((await submitClixx(values, {}, async () => Response.json({ ja_inscrito: true }))).ja_inscrito, true);
  for (const response of [Response.json({ success: false, error: 'Recusado' }), Response.json({ success: true }, { status: 500 }), new Response('invalid')]) {
    await assert.rejects(submitClixx(values, {}, async () => response));
  }
  await assert.rejects(submitClixx(values, {}, async () => { throw new Error('offline'); }));
});

test('redirect uses the CRM destination, retains coupon and carries session attribution', () => {
  const url = new URL(clixxRedirectUrl('https://vendas.online.sistemapacto.com.br/checkout?pl=2&cupom=0,99_IZI&k=account', { utm_source: 'teste', utm_campaign: 'izi', cupom: 'OUTRO' }, 'https://cerrocora.izigym.com.br/'));
  assert.equal(url.searchParams.get('cupom'), '0,99_IZI');
  assert.equal(url.searchParams.get('pl'), '2');
  assert.equal(url.searchParams.get('k'), 'account');
  assert.equal(url.searchParams.get('utm_source'), 'teste');
  assert.equal(url.searchParams.get('utm_campaign'), 'izi');
  assert.throws(() => clixxRedirectUrl('javascript:alert(1)', {}, 'https://cerrocora.izigym.com.br/'));
  assert.throws(() => clixxRedirectUrl('http://insecure.example/', {}, 'https://cerrocora.izigym.com.br/'));
});

test('phone mask strips non-digits and bounds the Brazilian phone length', () => {
  assert.equal(formatPhone('11999999999'), '(11) 99999-9999');
  assert.equal(formatPhone('abc119999999999999'), '(11) 99999-9999');
  assert.equal(formatPhone(''), '');
  assert.equal(formatPhone('11'), '(11');
});
