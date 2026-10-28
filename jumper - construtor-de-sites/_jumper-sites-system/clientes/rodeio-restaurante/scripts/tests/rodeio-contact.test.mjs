import test from 'node:test';
import assert from 'node:assert/strict';
import { rodeioContact } from '../../cloudflare/rodeio-contact.mjs';

const origin = 'https://site.jumper.dev.br';
function request(fields = {}, headers = {}) {
  return new Request(`${origin}/rodeio/api/contato`, {
    method: 'POST',
    headers: { Origin: origin, ...headers },
    body: new URLSearchParams({ kind: 'sac-jardins', name: 'Teste local', email: 'teste@example.com', message: 'Mensagem simulada', ...fields }),
  });
}

test('rejects invalid or foreign requests before reaching WordPress', async () => {
  const never = () => assert.fail('Unexpected upstream request');
  assert.equal((await rodeioContact(request({ kind: 'other' }), never)).status, 400);
  assert.equal((await rodeioContact(request({ message: '' }), never)).status, 400);
  assert.equal((await rodeioContact(request({ email: 'invalid' }), never)).status, 400);
  assert.equal((await rodeioContact(request({ website: 'bot' }), never)).status, 400);
  assert.equal((await rodeioContact(request({}, { Origin: 'https://example.com' }), never)).status, 403);
  assert.equal((await rodeioContact(request({}, { Origin: '' }), never)).status, 403);
});

test('uses fresh nonces and the existing Forminator form for each channel', async () => {
  const expected = {
    'sac-jardins': ['363', '310', '/sac/jardins/'],
    'sac-iguatemi': ['318', '322', '/sac/iguatemi/'],
    compliance: ['393', '388', '/compliance/'],
  };
  for (const [kind, [id, page, path]] of Object.entries(expected)) {
    let calls = 0;
    const response = await rodeioContact(request({ kind }), async (url, options) => {
      assert.equal(url, 'https://rodeiosp.com.br/wp-admin/admin-ajax.php');
      calls += 1;
      if (calls === 1) {
        assert.equal(options.body.get('action'), 'forminator_get_nonce');
        assert.equal(options.body.get('form_id'), id);
        return Response.json({ success: true, data: 'fresh-nonce' });
      }
      assert.equal(options.body.get('form_id'), id);
      assert.equal(options.body.get('page_id'), page);
      assert.equal(options.body.get('_wp_http_referer'), path);
      assert.equal(options.body.get('forminator_nonce'), 'fresh-nonce');
      assert.equal(options.body.get('textarea-1'), 'Mensagem simulada');
      if (kind === 'compliance') assert.equal(options.body.has('email-1'), false);
      else assert.equal(options.body.get('email-1'), 'teste@example.com');
      return Response.json({ success: true, data: { success: true } });
    });
    assert.equal(calls, 2);
    assert.equal((await response.json()).success, true);
  }
});

test('does not claim delivery when WordPress rejects or times out', async () => {
  for (const result of [{ success: false }, { success: true, data: { success: false } }]) {
    let calls = 0;
    const response = await rodeioContact(request(), async () => ++calls === 1
      ? Response.json({ success: true, data: 'nonce' })
      : Response.json(result));
    assert.equal(response.status, 502);
    assert.equal((await response.json()).success, false);
  }
  const response = await rodeioContact(request(), async () => { throw new Error('Unavailable'); });
  assert.equal(response.status, 502);
});
