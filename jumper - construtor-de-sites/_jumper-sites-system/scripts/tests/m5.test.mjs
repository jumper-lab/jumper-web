import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createNotionBriefingPage } from '../../Quiz/Briefings/notion-client.mjs';
import { validateM5Scope } from '../m5-scope.mjs';
const quiz = fs.readFileSync(new URL('../../Quiz/Briefings/quiz.js', import.meta.url), 'utf8');
function browser() {
  const context = vm.createContext({ URL, Date, structuredClone, localStorage: {getItem:()=>null,setItem:()=>{}} });
  vm.runInContext(quiz.slice(0, quiz.indexOf('const stepContainer =')), context);
  return context;
}
const requested = {differentiatorEvidence:'Orientação individual após cada etapa',customerQuestions:'Como funciona? Começa com avaliação.',serviceProcess:'Avaliação, proposta e atendimento',secondaryPageGoal:'Detalhar o serviço para pedir orçamento',differentiator:'Atendimento próximo',typicalProblem:'Encontrar orientação',typicalResult:'Escolher o serviço adequado',servicesItems:'Atendimento com orientação',pricingDisplay:'nao-sei',primaryCTA:'nao-sei',story:'Negócio em início de operação',hasTestimonials:'nao',visualReferences:'Preciso de orientação',portfolioItemsDescription:'Produtos a enviar',portfolioMinItems:'A confirmar',preserveItems:'Marca',removeItems:'Nenhum definido',requestedPages:'Jumper propõe',existingFeatures:'Contato',model:'M5', reviewConfirmed:true, shortDescription:'Serviços locais', targetAudience:'Moradores', cityCoverage:'São Paulo', contactName:'Equipe teste', contactEmail:'fixture@example.org', contactUse:'depois', mainGoal:'nao-sei', priorityOffer:'Atendimento', businessNature:'C', personality:'nao-sei', materialsStatus:'later', aiImages:'nao-sei', usePexels:'nao-sei', secondaryPage:'nao-sei', businessName:'Fixture M5', existingSiteUrl:'https://example.org', reformulationReason:'Melhorar contatos', requestedPages:'Home e contato', preserveItems:'Logo', removeItems:'Nenhum', existingFeatures:'Formulário', blogMode:'sem-blog'};
function payload() {const c=browser();c.input=requested;vm.runInContext('Object.assign(state,input)',c);return JSON.parse(vm.runInContext('JSON.stringify(buildPayload())',c));}
test('wizard offers five models and M5-only intake, preserving all original branches',()=>{
 const c=browser();
 assert.equal(vm.runInContext('models.length',c),5);
 for(const model of ['M1','M2','M3','M4','M5']){
  vm.runInContext(`state.model = '${model}'`,c);
  const visible=Array.from(vm.runInContext('steps.filter(s=>!s.condition || s.condition()).map(s=>s.id)',c));
  assert.equal(visible.includes('m5-reformulation'),model==='M5');
  assert.equal(visible.includes('structure'),model!=='M1');
  assert.equal(visible.length,model==='M1'?12:model==='M5'?15:13);
 }
});
test('M5 payload preserves full request, keeps scope pending and enables blog only explicitly',()=>{
 const c=browser();c.input=requested;vm.runInContext('Object.assign(state,input)',c);
 assert.equal(vm.runInContext("stepError('m5-reformulation')",c),null);
 assert.equal(vm.runInContext('buildPayload().project_scope.reformulation.scope_status',c),'pending_review');
 assert.equal(vm.runInContext('buildPayload().content.blog.enabled',c),false);
 vm.runInContext('state.blogMode="blog-ativo"',c);
 assert.equal(vm.runInContext('buildPayload().content.blog.enabled',c),true);
 vm.runInContext('state.model="M1"',c);
 assert.equal(vm.runInContext('buildPayload().content.blog.enabled',c),false);
 assert.equal(vm.runInContext('buildPayload().project_scope.reformulation',c),null);
 vm.runInContext('state.model="M5";state.existingSiteUrl="javascript:alert(1)"',c);
 assert.ok(vm.runInContext("stepError('m5-reformulation')",c));
});
test('server creates M5 properties and lossless import blocks, never trusts public approval',async()=>{
 const saved=globalThis.fetch;let body;
 globalThis.fetch=async(url,options)=>{body=JSON.parse(options.body);return {ok:true,json:async()=>({id:'fixture',url:'https://example.org/fixture'})};};
 try {
  const p=payload();p.project_scope.reformulation.change='Atualizar conteúdo '.repeat(300);p.project_scope.reformulation.scope_status='approved';
  await createNotionBriefingPage(p,{notionToken:'fixture',databaseId:'fixture'});
  assert.equal(body.properties['Modelo contratado'].select.name,'M5 Reformulação Institucional');
  assert.equal(body.properties['Site atual M5'].url,'https://example.org');
  assert.equal(body.properties['Confirmo que este briefing é para Reformulação de Site Institucional Local'].checkbox,true);
  const chunks=body.children.filter(b=>b.type==='code').map(b=>b.code.rich_text[0].text.content);
  const parsed=JSON.parse(chunks.filter(s=>s.startsWith('JUMPER_PAYLOAD_JSON_PART')).map(s=>s.slice(s.indexOf('\n')+1)).join(''));
  assert.equal(parsed.project_scope.reformulation.change,p.project_scope.reformulation.change);
  assert.equal(parsed.project_scope.reformulation.scope_status,'pending_review');
  assert.match(chunks.filter(s=>s.startsWith('JUMPER_NORMALIZED_BRIEFING_MD_PART')).join(''),/Reformulação M5/);
 } finally {globalThis.fetch=saved;}
});
test('M5 refuses missing intake before network; M1–M4 mappings remain unchanged',async()=>{
 const saved=globalThis.fetch;let writes=0;
 globalThis.fetch=async(url,options)=>{writes++;const b=JSON.parse(options.body);assert.equal(Object.keys(b.properties).some(k=>k.includes(' M5')),false);return {ok:true,json:async()=>({id:'fixture'})};};
 try {
  for (const key of ['existing_site_url','reason']){
   const p=payload();delete p.project_scope.reformulation[key];await assert.rejects(createNotionBriefingPage(p,{notionToken:'fixture'}),e=>e.status===400);
  }
  assert.equal(writes,0);
  for(const model of ['M1','M2','M3','M4']){const p=payload();p.project_scope.model=model;p.project_scope.secondary_page='nao-sei';p.project_scope.secondary_page_goal='Explicar o serviço';if(model==='M3'){p.content.portfolio.items_description='Itens';p.content.portfolio.minimum_items='A confirmar';}await createNotionBriefingPage(p,{notionToken:'fixture'});}
  assert.equal(writes,4);
 } finally {globalThis.fetch=saved;}
});
function contract(){return {site:{model:'M5',reformulation:{existing_site_url:'https://example.org',scope_status:'approved',approved_by:'Fixture approver',approved_at:'2026-09-14T12:00:00Z',pages:[{path:'/',purpose:'Apresentação'}],features:[{name:'Contato',acceptance:'Envio confirmado'}],inventory:[{item:'Home antiga',action:'replace',reason:'Conteúdo desatualizado'}],url_map:[{from:'/',action:'keep',to:'/',reason:'Preservar acesso'}],backup_plan:'Cópia isolada antes da substituição',rollback_plan:'Restaurar a cópia e conferir contatos'}}};}
test('construction and delivery block unapproved or unevidenced M5',()=>{
 const c=contract();assert.deepEqual(validateM5Scope(c),[]);
 for(const field of ['approved_by','approved_at','pages','features','inventory','url_map','backup_plan','rollback_plan']){const bad=structuredClone(c);delete bad.site.reformulation[field];assert.ok(validateM5Scope(bad).length,field);}
 assert.ok(validateM5Scope({site:{model:'M5',reformulation:{scope_status:'pending_review'}}}).length);
 assert.ok(validateM5Scope(c,{},true).length);
 const pass={status:'passed',evidence:'Fixture only: verified by controlled test'};
 const audit={reformulation_checks:Object.fromEntries(['scope','content','urls','integrations','backup','rollback'].map(k=>[k,pass]))};
 audit.reformulation_checks.pages=[{path:'/',...pass}];audit.reformulation_checks.features=[{name:'Contato',...pass}];
 assert.deepEqual(validateM5Scope(c,audit,true),[]);
 audit.reformulation_checks.pages=[];assert.ok(validateM5Scope(c,audit,true).length);
 assert.deepEqual(validateM5Scope({site:{model:'M4'}}),[]);
});
test('CSV import detects M5 before catálogo/completo and keeps proposed scope pending',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'jumper-m5-'));
 try {
  const file=path.join(tmp,'fixture.csv');
  fs.writeFileSync(file,'Nome do Negócio,Modelo contratado,URL do site atual,Páginas desejadas\nFixture,M5 Reformulação catálogo completo,https://example.org,Home e contato\n');
  const result=spawnSync(process.execPath,[fileURLToPath(new URL('../briefing-to-prompt-pack.mjs',import.meta.url)),file,'--out',path.join(tmp,'clients')],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const folder=path.join(tmp,'clients/fixture/briefing');
  const config=JSON.parse(fs.readFileSync(path.join(folder,'jumper-config-sugerido.json')));
  assert.equal(config.site.model,'M5');assert.equal(config.site.reformulation.scope_status,'pending_review');
  assert.match(fs.readFileSync(path.join(folder,'prompt-build-client-site.md'),'utf8'),/M5 — REFORMULAÇÃO/);
 } finally {fs.rmSync(tmp,{recursive:true,force:true});}
});
