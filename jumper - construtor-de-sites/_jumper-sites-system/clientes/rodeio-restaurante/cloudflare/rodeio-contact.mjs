const endpoint = 'https://rodeiosp.com.br/wp-admin/admin-ajax.php';
const forms = Object.freeze({
  'sac-jardins': { id: '363', page: '310', path: '/sac/jardins/' },
  'sac-iguatemi': { id: '318', page: '322', path: '/sac/iguatemi/' },
  compliance: { id: '393', page: '388', path: '/compliance/' },
});
const reply = (success, message, status = 200) => Response.json({ success, message }, {
  status,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});

// Preserve the three existing Forminator destinations without exposing the
// WordPress admin endpoint or form tokens to the browser.
export async function rodeioContact(request, upstreamFetch = fetch) {
  if (request.method !== 'POST') return reply(false, 'Método não permitido.', 405);
  const origin = request.headers.get('Origin');
  if (origin !== new URL(request.url).origin) return reply(false, 'Origem não permitida.', 403);
  if (!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded')) return reply(false, 'Formato inválido.', 415);
  if (Number(request.headers.get('Content-Length')) > 8192) return reply(false, 'Solicitação muito longa.', 413);
  const body = await request.text();
  if (body.length > 8192) return reply(false, 'Solicitação muito longa.', 413);
  const fields = new URLSearchParams(body);
  if (fields.get('website')) return reply(false, 'Não foi possível enviar.', 400);
  const kind = fields.get('kind');
  const form = forms[kind];
  if (!form) return reply(false, 'Formulário inválido.', 400);
  const message = (fields.get('message') || '').trim();
  if (!message || message.length > 180) return reply(false, 'Escreva uma mensagem de até 180 caracteres.', 400);
  const payload = new URLSearchParams({
    'textarea-1': message,
    form_id: form.id,
    page_id: form.page,
    form_type: 'default',
    render_id: '0',
    action: 'forminator_submit_form_custom-forms',
    _wp_http_referer: form.path,
    current_url: `https://rodeiosp.com.br${form.path}`,
    referer_url: `https://rodeiosp.com.br${form.path}`,
  });
  if (kind !== 'compliance') {
    const name = (fields.get('name') || '').trim();
    const email = (fields.get('email') || '').trim();
    const phone = (fields.get('phone') || '').trim();
    const subject = (fields.get('subject') || '').trim();
    if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 180 || phone.length > 40 || subject.length > 120) {
      return reply(false, 'Confira nome, e-mail e demais campos.', 400);
    }
    payload.set('name-1', name);
    payload.set('email-1', email);
    payload.set('phone-1', phone);
    payload.set('text-1', subject);
  }
  try {
    const nonceResponse = await upstreamFetch(endpoint, {
      method: 'POST',
      body: new URLSearchParams({ action: 'forminator_get_nonce', form_id: form.id }),
      signal: AbortSignal.timeout(8000),
    });
    const nonce = await nonceResponse.json();
    if (!nonceResponse.ok || nonce.success !== true || typeof nonce.data !== 'string' || !nonce.data) throw new Error('Unavailable nonce');
    payload.set('forminator_nonce', nonce.data);
    const response = await upstreamFetch(endpoint, { method: 'POST', body: payload, signal: AbortSignal.timeout(12000) });
    const result = await response.json();
    if (!response.ok || result.success !== true || result.data?.success !== true) {
      return reply(false, 'Não foi possível confirmar o envio. Abra o formulário original e tente por lá.', 502);
    }
    return reply(true, 'Mensagem enviada.');
  } catch {
    return reply(false, 'Não foi possível confirmar o envio. Antes de tentar novamente, use o formulário original.', 502);
  }
}
