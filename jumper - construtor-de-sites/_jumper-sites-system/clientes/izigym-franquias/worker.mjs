const CAPITAL = new Set(['Sim', 'Estou avaliando com sócios', 'Ainda estou estruturando o investimento']);
const UTMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
function json(body, status = 200) { return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
export function validateLead(input, origin) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Envio inválido.');
  const text = (key, max, required = false) => {
    const value = input[key];
    if (value !== undefined && value !== null && typeof value !== 'string') throw Error('Campo inválido: ' + key);
    const result = (value || '').trim();
    if (result.length > max || /[\u0000-\u001f]/.test(result) || (required && !result)) throw Error('Confira o campo ' + key + '.');
    return result;
  };
  const nome = text('nome', 160, true), email = text('email', 254, true).toLowerCase();
  if (nome.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error('Informe nome e e-mail válidos.');
  const rawPhone = text('telefone', 30, true);
  if (!/^[+\d\s().-]+$/.test(rawPhone)) throw Error('Informe um telefone válido.');
  const telefone = rawPhone.replace(/\D/g, '');
  if (!/^\d{10,11}$/.test(telefone) && !/^55\d{10,11}$/.test(telefone)) throw Error('Informe um telefone com DDD.');
  if (typeof input.aceita_whatsapp !== 'boolean') throw Error('Preferência de contato inválida.');
  const cidade = text('cidade', 160, true), capital = text('capital', 80, true);
  if (!CAPITAL.has(capital)) throw Error('Escolha uma opção de investimento.');
  const id = text('submission_id', 36, true);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw Error('Identificador de envio inválido.');
  const pagina_origem = text('pagina_origem', 2048, true);
  let page; try { page = new URL(pagina_origem); } catch { throw Error('Página de origem inválida.'); }
  if (page.origin !== origin) throw Error('Página de origem inválida.');
  return { id, nome, email, telefone, aceita_whatsapp: input.aceita_whatsapp ? 1 : 0, cidade, capital, ...Object.fromEntries(UTMS.map(k => [k, text(k, 512) || null])), pagina_origem };
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/lead') {
      if (url.pathname.startsWith('/api/')) return json({ error: 'Não encontrado.' }, 404);
      return env.ASSETS.fetch(request);
    }
    if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
    const allowed = new Set(['https://franquias.izigym.com.br']);
    if (env.ENVIRONMENT === 'local') { allowed.add('http://127.0.0.1:8787'); allowed.add('http://localhost:8787'); }
    const origin = request.headers.get('Origin');
    if (!allowed.has(origin) || origin !== url.origin) return json({ error: 'Origem não autorizada.' }, 403);
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'Use JSON.' }, 415);
    if (Number(request.headers.get('Content-Length') || 0) > 8192) return json({ error: 'Envio muito grande.' }, 413);
    if (env.LEAD_LIMITER) {
      const result = await env.LEAD_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
      if (!result.success) return json({ error: 'Muitas tentativas. Aguarde um minuto e tente novamente.' }, 429);
    }
    let lead;
    try {
      const body = await request.text();
      if (new TextEncoder().encode(body).length > 8192) return json({ error: 'Envio muito grande.' }, 413);
      lead = validateLead(JSON.parse(body), origin);
    } catch (error) { return json({ error: error instanceof SyntaxError ? 'Envio inválido.' : error.message }, 400); }
    try {
      const hashBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(lead)));
      const payload_hash = Array.from(new Uint8Array(hashBytes), b => b.toString(16).padStart(2, '0')).join('');
      const columns = ['id', 'criado_em', 'nome', 'email', 'telefone', 'aceita_whatsapp', 'cidade', 'capital', ...UTMS, 'pagina_origem', 'user_agent', 'payload_hash'];
      const values = { ...lead, criado_em: new Date().toISOString(), user_agent: (request.headers.get('User-Agent') || '').slice(0, 1024), payload_hash };
      const result = await env.LEADS_DB.prepare(`INSERT INTO leads (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')}) ON CONFLICT(id) DO NOTHING`).bind(...columns.map(k => values[k])).run();
      if (!result.success) throw Error('D1 write failed');
      if (result.meta.changes === 0) {
        const existing = await env.LEADS_DB.prepare('SELECT payload_hash FROM leads WHERE id = ?').bind(lead.id).first();
        if (!existing || existing.payload_hash !== payload_hash) return json({ error: 'Envio já utilizado. Recarregue a página para tentar novamente.' }, 409);
      }
      return json({ ok: true, id: lead.id }, result.meta.changes === 0 ? 200 : 201);
    } catch { console.error('Falha ao gravar lead de franquias no D1.'); return json({ error: 'Não foi possível salvar seu cadastro. Tente novamente.' }, 503); }
  }
};
