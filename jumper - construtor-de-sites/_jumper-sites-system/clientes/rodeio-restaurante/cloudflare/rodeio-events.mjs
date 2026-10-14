const endpoint = 'https://rodeiosp.com.br/wp-admin/admin-ajax.php';
const reply = (success,message,status=200) => Response.json({success,message},{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
// Only the existing events form is forwarded; clients cannot choose a destination.
export async function rodeioEvents(request, upstreamFetch=fetch) {
  if (request.method !== 'POST') return reply(false,'Método não permitido.',405);
  const origin=request.headers.get('Origin');
  if (origin && origin!==new URL(request.url).origin) return reply(false,'Origem não permitida.',403);
  if (!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded')) return reply(false,'Formato inválido.',415);
  if (Number(request.headers.get('Content-Length'))>8192) return reply(false,'Solicitação muito longa.',413);
  const body=await request.text();
  if (body.length>8192) return reply(false,'Solicitação muito longa.',413);
  const fields=new URLSearchParams(body);
  if (fields.get('website')) return reply(false,'Não foi possível enviar.',400);
  const name=(fields.get('name')||'').trim(), email=(fields.get('email')||'').trim();
  const unit=fields.get('unit'), phone=fields.get('phone')||'', company=fields.get('company')||'', message=fields.get('message')||'';
  if (!name || name.length>120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length>180 || !['jardins','iguatemi'].includes(unit) || phone.length>40 || company.length>120 || message.length>180) return reply(false,'Confira os campos antes de enviar.',400);
  try {
    const nonceResponse=await upstreamFetch(endpoint,{method:'POST',body:new URLSearchParams({action:'forminator_get_nonce',form_id:'364'}),signal:AbortSignal.timeout(8000)});
    const nonce=await nonceResponse.json();
    if (!nonceResponse.ok || nonce.success!==true || typeof nonce.data!=='string' || !nonce.data) throw new Error('Unavailable nonce');
    const payload=new URLSearchParams({
      'name-1':name,'email-1':email,'phone-1':phone,'text-1':company,'select-1':unit==='jardins'?'one':'two','textarea-1':message,
      forminator_nonce:nonce.data,form_id:'364',page_id:'257',form_type:'default',render_id:'0',
      action:'forminator_submit_form_custom-forms',_wp_http_referer:'/eventos/',current_url:'https://rodeiosp.com.br/eventos/',referer_url:'https://rodeiosp.com.br/eventos/'
    });
    const response=await upstreamFetch(endpoint,{method:'POST',body:payload,signal:AbortSignal.timeout(12000)});
    const result=await response.json();
    if (!response.ok || result.success!==true || result.data?.success!==true) return reply(false,'Não foi possível confirmar o envio. Confira os campos ou ligue (11) 3474-1333.',502);
    return reply(true,'Solicitação enviada.');
  } catch {
    return reply(false,'Não foi possível confirmar o envio. Antes de tentar novamente, fale com a equipe pelo (11) 3474-1333.',502);
  }
}
