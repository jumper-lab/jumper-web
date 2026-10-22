import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.mjs';
const origin = 'https://franquias.izigym.com.br';
const data = () => ({submission_id:crypto.randomUUID(),nome:'TESTE QA NÃO CONTATAR',email:'qa@example.invalid',telefone:'(11) 99999-0000',aceita_whatsapp:false,cidade:'São Paulo',capital:'Estou avaliando com sócios',utm_source:'teste',utm_medium:'email',utm_campaign:'izi',utm_content:'desktop',utm_term:'franquias',pagina_origem:origin+'/?utm_source=teste'});
function database() {
 const rows = new Map();
 return {rows, prepare(sql) { return {bind(...values) { return {
  async run() {
   if (sql.startsWith('INSERT')) {
    const columns = sql.match(/\(([^)]+)\)/)[1].split(','), row=Object.fromEntries(columns.map((key,index)=>[key,values[index]])), exists=rows.has(row.id);
    if(!exists)rows.set(row.id,{...row,sults_enviado_em:null,sults_tentativas:0,sults_ultimo_erro:null});
    return {success:true,meta:{changes:exists?0:1}};
   }
   if (sql.startsWith('UPDATE')) {
    const id=values.at(-1), row=rows.get(id);if(!row)return {success:true,meta:{changes:0}};
    row.sults_tentativas+=1;
    if(sql.includes('sults_enviado_em = ?')){row.sults_enviado_em=values[0];row.sults_ultimo_erro=null;}else{row.sults_ultimo_erro=values[0];}
    return {success:true,meta:{changes:1}};
   }
   throw Error('Unexpected SQL');
  },
  async first(){return rows.get(values[0]);}
 };}};}};
}
function request(payload, options={}) {return new Request(origin+'/api/lead',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','User-Agent':'QA Desktop',...options.headers},body:JSON.stringify(payload)});}
function webhook(responses=[{status:200,body:{status:'success'}}]) {
 const calls=[];
 return {calls,fetch:async(url,options)=>{calls.push({url,options});const next=responses.shift()||{status:200,body:{status:'success'}};if(next.error)throw next.error;return Response.json(next.body,{status:next.status});}};
}
test('saves complete lead with UTMs, unchecked WhatsApp and server timestamp/UA',async()=>{
 const db=database(), hook=webhook(), payload=data(); const r=await worker.fetch(request(payload),{LEADS_DB:db,N8N_FETCH:hook.fetch});assert.equal(r.status,201);assert.equal((await r.json()).ok,true);
 const row=db.rows.get(payload.submission_id);assert.equal(row.nome,payload.nome);assert.equal(row.telefone,'11999990000');assert.equal(row.aceita_whatsapp,0);assert.equal(row.user_agent,'QA Desktop');assert.equal(row.utm_term,'franquias');assert.equal(row.utm_content,'desktop');assert.ok(Date.parse(row.criado_em));
 assert.ok(Date.parse(row.sults_enviado_em));assert.equal(row.sults_tentativas,1);assert.equal(row.sults_ultimo_erro,null);assert.equal(hook.calls.length,1);
 assert.equal(hook.calls[0].url,'https://nilton.jumper.studio/webhook/izi-gym-franquias-lead');
 const sent=JSON.parse(hook.calls[0].options.body);assert.equal(sent.submission_id,payload.submission_id);assert.equal(sent.telefone,'11999990000');assert.equal(sent.aceita_whatsapp,false);assert.equal(sent.utm_source,'teste');
});
test('same submission retry is idempotent; changed data cannot overwrite existing lead',async()=>{
 const db=database(), hook=webhook(), env={LEADS_DB:db,N8N_FETCH:hook.fetch}, payload=data(); await worker.fetch(request(payload),env);assert.equal((await worker.fetch(request(payload),env)).status,200);assert.equal(db.rows.size,1);assert.equal(hook.calls.length,1);
 assert.equal((await worker.fetch(request({...payload,nome:'Outra pessoa'}),env)).status,409);assert.equal(db.rows.get(payload.submission_id).nome,payload.nome);assert.equal(hook.calls.length,1);
});
test('a failed n8n delivery remains in D1 and the same submission retries only the pending delivery',async()=>{
 const db=database(), hook=webhook([{status:503,body:{status:'error'}},{status:200,body:{status:'success'}}]), env={LEADS_DB:db,N8N_FETCH:hook.fetch}, payload=data();
 const first=await worker.fetch(request(payload),env);assert.equal(first.status,503);assert.equal((await first.json()).ok,undefined);assert.equal(db.rows.size,1);
 const pending=db.rows.get(payload.submission_id);assert.equal(pending.sults_enviado_em,null);assert.equal(pending.sults_tentativas,1);assert.equal(pending.sults_ultimo_erro,'Falha no webhook do n8n.');
 const retry=await worker.fetch(request(payload),env);assert.equal(retry.status,200);assert.equal((await retry.json()).ok,true);assert.equal(hook.calls.length,2);assert.ok(Date.parse(pending.sults_enviado_em));assert.equal(pending.sults_tentativas,2);assert.equal(pending.sults_ultimo_erro,null);
});
test('rejects missing fields, malformed email/phone/capital/consent and oversized UTM',async()=>{
 for(const patch of [{nome:''},{email:'abc'},{telefone:'123'},{cidade:''},{capital:'Outro'},{aceita_whatsapp:'on'},{utm_source:'x'.repeat(513)},{pagina_origem:'https://evil.example/'},{submission_id:'not-a-uuid'}]) {
  const db=database(); assert.equal((await worker.fetch(request({...data(),...patch}),{LEADS_DB:db})).status,400);assert.equal(db.rows.size,0);
 }
});
test('rejects cross-site, non-JSON, oversized and limited requests without writing',async()=>{
 const db=database();assert.equal((await worker.fetch(request(data(),{headers:{Origin:'https://evil.example'}}),{LEADS_DB:db})).status,403);
 assert.equal((await worker.fetch(request(data(),{headers:{'Content-Type':'text/plain'}}),{LEADS_DB:db})).status,415);
 assert.equal((await worker.fetch(request({...data(),extra:'x'.repeat(9000)}),{LEADS_DB:db})).status,413);
 assert.equal((await worker.fetch(request(data()),{LEADS_DB:db,LEAD_LIMITER:{limit:async()=>({success:false})}})).status,429);assert.equal(db.rows.size,0);
});
test('D1 failure does not report successful conversion',async()=>{
 const hook=webhook(), r=await worker.fetch(request(data()),{LEADS_DB:{prepare(){throw Error('offline');}},N8N_FETCH:hook.fetch});assert.equal(r.status,503);assert.equal((await r.json()).ok,undefined);assert.equal(hook.calls.length,0);
});
test('no public read route or list of leads',async()=>{
 assert.equal((await worker.fetch(new Request(origin+'/api/lead'),{})).status,405);assert.equal((await worker.fetch(new Request(origin+'/api/leads'),{})).status,404);
});
