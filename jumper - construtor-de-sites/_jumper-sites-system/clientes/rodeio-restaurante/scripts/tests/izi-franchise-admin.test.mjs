import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import worker from '../../cloudflare/worker.mjs';

const base = 'https://site.jumper.dev.br/__jumper/izi-gym/lp-franquias/leads-live';
const secret = 'qa-admin-only';
const login = await worker.fetch(new Request('https://site.jumper.dev.br/__jumper/login', { method: 'POST', body: new URLSearchParams({password:secret,next:new URL(base).pathname}) }), { JUMPER_HOSTER_PASSWORD: secret });
const headers = { Cookie: login.headers.get('Set-Cookie').split(';')[0] };
const schema = await readFile(new URL('../../../izigym-franquias/migrations/0001_leads.sql', import.meta.url), 'utf8');
function fixture() {
 const sqlite = new DatabaseSync(':memory:'); sqlite.exec(schema);
 const insert = sqlite.prepare('INSERT INTO leads (id,criado_em,nome,email,telefone,aceita_whatsapp,cidade,capital,utm_source,utm_medium,utm_campaign,utm_content,utm_term,pagina_origem,user_agent,payload_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
 const rows = [
  ['before','2026-10-08T02:59:59.000Z','Antes',0,'São Paulo/SP','Sim'],
  ['a','2026-10-08T03:00:00.000Z','=QA <script>alert(1)</script>',1,'São Paulo/SP','Sim'],
  ['b','2026-10-09T02:59:59.000Z','QA mobile',0,'Curitiba/PR','Estou avaliando com sócios'],
  ['after','2026-10-09T03:00:00.000Z','Depois',1,'São Paulo/SP','Sim'],
 ];
 for (const [id,date,name,consent,city,capital] of rows) insert.run(id,date,name,'qa@example.invalid','11999990000',consent,city,capital,'teste','email','franquias','desktop','candidato','https://franquias.izigym.com.br/','QA Browser','hash');
 const db = {prepare(sql) { let values=[]; return {bind(...args){values=args;return this}, async first(){return sqlite.prepare(sql).get(...values)},async all(){return {results:sqlite.prepare(sql).all(...values)}}}}};
 const otherDb = {prepare(){throw new Error('Must not read Cerro Corá')}};
 return {sqlite,env:{JUMPER_HOSTER_PASSWORD:secret,IZI_FRANCHISE_DB:db,IZI_LEADS_DB:otherDb,IZI_LEADS_TEST_DB:otherDb}};
}

test('dashboard and CSV reject visitors without the administrative session, before reading D1',async()=>{
 const env={JUMPER_HOSTER_PASSWORD:secret,IZI_FRANCHISE_DB:{prepare(){throw new Error('Unauthorized query')}}};
 for(const suffix of ['', '.csv']) {
  const res=await worker.fetch(new Request(base+suffix),env); assert.equal(res.status,401); assert.equal(res.headers.get('Cache-Control'),'no-store, private');
  assert.doesNotMatch(await res.text(),/qa@example/);
 }
 const res=await worker.fetch(new Request(base,{method:'POST'}),env);assert.equal(res.status,405);
});

test('franchise dashboard queries the real schema, escapes content, and keeps its independent D1',async()=>{
 const {sqlite,env}=fixture();try {
  const res=await worker.fetch(new Request(base,{headers}),env);assert.equal(res.status,200);const html=await res.text();
  assert.match(html,/Cadastros da LP Franquias/);assert.match(html,/Capital disponível/);assert.match(html,/Aceita WhatsApp/);assert.match(html,/izi-lp-franquias-leads/);
  assert.match(html,/4553bc65-eeb8-4404-aa57-e44692bcc9a3\/studio/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>alert/);assert.doesNotMatch(html,/izi-lp-CerroCora-leads/);
  assert.match(html,/Atualizar cadastros da LP Franquias/);assert.match(html,/Baixar CSV da LP Franquias/);
 }finally{sqlite.close()}
});

test('São Paulo dates, capital, city and CSV use identical bound filters',async()=>{
 const {sqlite,env}=fixture();try {
  const query=new URLSearchParams({period:'custom',from:'2026-10-08',to:'2026-10-08',capital:'Sim',city:'São Paulo/SP'});
  const page=await worker.fetch(new Request(`${base}?${query}`,{headers}),env);assert.equal(page.status,200);const html=await page.text();
  assert.match(html,/<strong>1<\/strong> cadastro encontrado/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<td>Antes<\/td>|<td>Depois<\/td>|<td>QA mobile<\/td>/);
  assert.match(html,/city=S%C3%A3o\+Paulo%2FSP/);assert.match(html,/calendar-grid/);
  const csv=await worker.fetch(new Request(`${base}.csv?${query}`,{headers}),env);assert.equal(csv.status,200);const body=await csv.text();
  assert.match(csv.headers.get('Content-Disposition'),/izi-lp-franquias-leads-2026-10-08-a-2026-10-08\.csv/);
  assert.equal(body.trim().split('\r\n').length,2);assert.match(body,/"'\=QA/);assert.match(body,/"utm_campaign"/);assert.match(body,/"pagina_origem"/);assert.match(body,/"user_agent"/);assert.match(body,/"franquias"/);
 }finally{sqlite.close()}
});

test('invalid dates, other database names and injection attempts cannot expose other leads',async()=>{
 const {sqlite,env}=fixture();try {
  for(const query of ['database=izi-lp-CerroCora-leads','period=custom&from=2026-02-30&to=2026-03-01','period=custom&from=2026-10-09&to=2026-10-08'])assert.equal((await worker.fetch(new Request(`${base}?${query}`,{headers}),env)).status,400);
  const query=new URLSearchParams({capital:"' OR 1=1 --"});const res=await worker.fetch(new Request(`${base}?${query}`,{headers}),env);assert.equal(res.status,200);assert.match(await res.text(),/Nenhum cadastro encontrado/);
 }finally{sqlite.close()}
});

test('pagination displays 50 rows and CSV exports every matching lead',async()=>{
 const {sqlite,env}=fixture();try {
  for(let n=0;n<55;n++)sqlite.prepare("INSERT INTO leads SELECT ?,criado_em,?,email,telefone,aceita_whatsapp,cidade,capital,utm_source,utm_medium,utm_campaign,utm_content,utm_term,pagina_origem,user_agent,payload_hash FROM leads WHERE id='a'").run(`page-${n}`,`Paginação ${n}`);
  const res=await worker.fetch(new Request(base+'?page=2',{headers}),env);assert.equal(res.status,200);const html=await res.text();assert.match(html,/Página 2 de 2/);assert.equal((html.match(/<tr>/g)||[]).length,10);
  const csv=await worker.fetch(new Request(base+'.csv',{headers}),env);assert.equal((await csv.text()).trim().split('\r\n').length,60);
 }finally{sqlite.close()}
});

test('database failure returns an error instead of claiming an empty list',async()=>{
 const env={JUMPER_HOSTER_PASSWORD:secret,IZI_FRANCHISE_DB:{prepare(){throw new Error('D1 unavailable')}}};const res=await worker.fetch(new Request(base,{headers}),env);assert.equal(res.status,503);
});
