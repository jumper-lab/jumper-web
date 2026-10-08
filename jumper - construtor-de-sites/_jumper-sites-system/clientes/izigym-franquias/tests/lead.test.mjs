import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.mjs';
const origin = 'https://franquias.izigym.com.br';
const data = () => ({submission_id:crypto.randomUUID(),nome:'TESTE QA NÃO CONTATAR',email:'qa@example.invalid',telefone:'(11) 99999-0000',aceita_whatsapp:false,cidade:'São Paulo',capital:'Estou avaliando com sócios',utm_source:'teste',utm_medium:'email',utm_campaign:'izi',utm_content:'desktop',utm_term:'franquias',pagina_origem:origin+'/?utm_source=teste'});
function database() {
 const rows = new Map();
 return {rows, prepare(sql) { return {bind(...values) { return { async run() { const columns = sql.match(/\(([^)]+)\)/)[1].split(','); const row=Object.fromEntries(columns.map((k,i)=>[k,values[i]])); const exists=rows.has(row.id); if(!exists)rows.set(row.id,row);return {success:true,meta:{changes:exists?0:1}}; }, async first(){return rows.get(values[0]);} };}};}};
}
function request(payload, options={}) {return new Request(origin+'/api/lead',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','User-Agent':'QA Desktop',...options.headers},body:JSON.stringify(payload)});}
test('saves complete lead with UTMs, unchecked WhatsApp and server timestamp/UA',async()=>{
 const db=database(), payload=data(); const r=await worker.fetch(request(payload),{LEADS_DB:db});assert.equal(r.status,201);assert.equal((await r.json()).ok,true);
 const row=db.rows.get(payload.submission_id);assert.equal(row.nome,payload.nome);assert.equal(row.telefone,'11999990000');assert.equal(row.aceita_whatsapp,0);assert.equal(row.user_agent,'QA Desktop');assert.equal(row.utm_term,'franquias');assert.equal(row.utm_content,'desktop');assert.ok(Date.parse(row.criado_em));
});
test('same submission retry is idempotent; changed data cannot overwrite existing lead',async()=>{
 const db=database(), payload=data(); await worker.fetch(request(payload),{LEADS_DB:db});assert.equal((await worker.fetch(request(payload),{LEADS_DB:db})).status,200);assert.equal(db.rows.size,1);
 assert.equal((await worker.fetch(request({...payload,nome:'Outra pessoa'}),{LEADS_DB:db})).status,409);assert.equal(db.rows.get(payload.submission_id).nome,payload.nome);
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
 const r=await worker.fetch(request(data()),{LEADS_DB:{prepare(){throw Error('offline');}}});assert.equal(r.status,503);assert.equal((await r.json()).ok,undefined);
});
test('no public read route or list of leads',async()=>{
 assert.equal((await worker.fetch(new Request(origin+'/api/lead'),{})).status,405);assert.equal((await worker.fetch(new Request(origin+'/api/leads'),{})).status,404);
});
