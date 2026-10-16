import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {validateGuidedIntake} from '../../Quiz/Briefings/intake-validation.mjs';
import {validateM5Intake} from '../../Quiz/Briefings/m5-validation.mjs';
import {createNotionBriefingPage} from '../../Quiz/Briefings/notion-client.mjs';
import {validateM5Scope} from '../m5-scope.mjs';
import worker from '../../clientes/rodeio-restaurante/cloudflare/worker.mjs';
import {validateBriefingSecrets} from '../../clientes/rodeio-restaurante/scripts/preflight-hoster.mjs';
const source=fs.readFileSync(new URL('../../Quiz/Briefings/quiz.js',import.meta.url),'utf8');
const fixtureSource=fs.readFileSync(new URL('./guided-intake.test.mjs',import.meta.url),'utf8');
const base=vm.runInNewContext('('+fixtureSource.match(/const fixture=(.*);\nfunction browser/)[1]+')');
const seed={...base,model:'M5',m5ProjectType:'creation',m5Profile:'audiovisual',existingSiteUrl:'',requestedPages:'Home, Roteiro, Direção, Bio',m5PageDetails:'Home: destaques; Roteiro: obras escritas; Direção: filmes dirigidos; Bio: foto, texto e links',m5Features:'Quatro vídeos principais e links profissionais',m5HomeVideoCount:'Cerca de quatro',m5HomeVideos:'Trabalhos 1 a 4, na ordem indicada na pasta autorizada',m5VideoPlayback:'autoplay-muted',m5VideoMobile:'poster-click',m5WorkCredits:'trabalho-audiovisual-especifico; Roteiro: função e créditos a conferir na pasta',m5Awards:'sim',m5AwardsDetails:'Obra 1, prêmio de teste, ano e arte autorizada na pasta',m5BioText:'Trajetória profissional em texto aprovado',m5BioPhoto:'https://example.org/foto-autorizada.jpg',m5ProfessionalLinks:'Instagram: https://example.org/perfil; IMDb: https://example.org/imdb; e-mail e WhatsApp públicos a conferir'};
function browser(overrides={}){const c=vm.createContext({URL,Date,structuredClone,localStorage:{getItem:()=>null,setItem:()=>{}}});vm.runInContext(source.slice(0,source.indexOf('const stepContainer =')),c);c.seed={...seed,...overrides};vm.runInContext('state=Object.assign(structuredClone(initialState),seed)',c);return c;}
const run=(c,e)=>JSON.parse(vm.runInContext('JSON.stringify('+e+')',c));
const payload=overrides=>run(browser(overrides),'buildPayload()');
test('M5 creation asks for page/content scope and audiovisual data without an old website',()=>{
 const c=browser();const steps=run(c,'visibleSteps().map(s=>s.id)');assert.equal(steps.length,17);assert.ok(!steps.includes('m5-reformulation'));assert.deepEqual(run(c,'visibleSteps().map(s=>stepError(s.id)).filter(Boolean)'),[]);
 const p=run(c,'buildPayload()');assert.equal(p.project_scope.project_type,'creation');assert.equal(p.project_scope.reformulation,null);assert.deepEqual(validateM5Intake(p),[]);assert.deepEqual(validateGuidedIntake(p),[]);
 const html=run(c,'steps.find(s=>s.id==="m5-scope").render()');assert.ok(html.includes('name="m5PageDetails"'));assert.ok(!html.includes('name="preserveItems"'));assert.ok(!run(c,'structureMarkup()').includes('name="portfolioMinItems"'));
});
test('M5 reformulation keeps old-site URL and preservation requirements',()=>{
 const c=browser({m5ProjectType:'reformulation',existingSiteUrl:'https://example.org/atual'});assert.equal(run(c,'visibleSteps().length'),18);assert.deepEqual(run(c,'visibleSteps().map(s=>stepError(s.id)).filter(Boolean)'),[]);let p=run(c,'buildPayload()');assert.equal(p.project_scope.reformulation.existing_site_url,'https://example.org/atual');
 vm.runInContext('state.existingSiteUrl=""',c);assert.ok(run(c,'stepError("m5-reformulation")'));assert.ok(validateM5Intake(run(c,'buildPayload()')).length);
 vm.runInContext('state.removeItems=""',c);assert.ok(run(c,'stepError("m5-scope")'));assert.ok(validateGuidedIntake(run(c,'buildPayload()')).length);
});
test('audiovisual questions and data are conditional; M1-M4 do not inherit them',()=>{
 for(const model of ['M1','M2','M3','M4']){const c=browser({model});assert.ok(!run(c,'visibleSteps().map(s=>s.id)').includes('m5-videos'));assert.equal(run(c,'buildPayload().project_scope.custom'),null);}
 const c=browser();vm.runInContext('state.m5Profile="institutional"',c);const p=run(c,'buildPayload()');assert.equal(p.project_scope.custom.audiovisual,null);assert.ok(!JSON.stringify(p).includes(seed.m5WorkCredits));assert.equal(run(c,'state.m5WorkCredits'),seed.m5WorkCredits);
});
test('audiovisual intake requires playback, credits, Bio, links and conditional award details',()=>{
 for(const field of ['home_video_count','home_videos','playback','work_credits','bio_text','bio_photo','professional_links','awards_details']){const p=payload();p.project_scope.custom.audiovisual[field]='';assert.ok(validateM5Intake(p).length,field);}
 const p=payload({m5Awards:'nao'});assert.equal(p.project_scope.custom.audiovisual.awards_details,'');assert.deepEqual(validateM5Intake(p),[]);
 const c=browser({m5ProjectType:'',m5Profile:''});assert.equal(run(c,'stepError("m5-project").field'),'m5ProjectType');
});
test('M5 custom data survives Notion properties, full JSON and normalized text; approval is never public',async()=>{
 const original=globalThis.fetch;let body;globalThis.fetch=async(_url,options)=>{body=JSON.parse(options.body);return Response.json({id:'qa-local'});};
 try{const p=payload();p.project_scope.custom.scope_status='approved';await createNotionBriefingPage(p,{notionToken:'qa-only',databaseId:'qa-only'});assert.equal(body.properties['Modelo contratado'].select.name,'M5 Site Personalizado');assert.equal(body.properties['Tipo de projeto M5'].select.name,'Criação');assert.equal(body.properties['Confirmo que este briefing é para Reformulação de Site Institucional Local'].checkbox,false);assert.equal(body.properties['Site atual M5'],undefined);
 const chunks=body.children.filter(b=>b.type==='code').map(b=>b.code.rich_text[0].text.content);const full=JSON.parse(chunks.filter(s=>s.startsWith('JUMPER_PAYLOAD_JSON_PART')).map(s=>s.slice(s.indexOf('\n')+1)).join(''));assert.equal(full.project_scope.custom.scope_status,'pending_review');assert.deepEqual(full.project_scope.custom.audiovisual,p.project_scope.custom.audiovisual);assert.equal(full.project_scope.reformulation,null);
 const md=chunks.filter(s=>s.startsWith('JUMPER_NORMALIZED_BRIEFING_MD_PART')).map(s=>s.slice(s.indexOf('\n')+1)).join('');for(const value of ['Criação de site novo','Home, Roteiro, Direção, Bio',seed.m5AwardsDetails,seed.m5ProfessionalLinks])assert.ok(md.includes(value));
 }finally{globalThis.fetch=original;}
});
test('old M5 payloads remain valid reformulations and keep their original Notion model',async()=>{
 const p=payload({m5ProjectType:'reformulation',m5Profile:'institutional',existingSiteUrl:'https://example.org/atual'});delete p.project_scope.custom;delete p.project_scope.custom_version;delete p.project_scope.project_type;assert.deepEqual(validateM5Intake(p),[]);
 const original=globalThis.fetch;let body;globalThis.fetch=async(_url,o)=>{body=JSON.parse(o.body);return Response.json({id:'legacy-qa'});};try{await createNotionBriefingPage(p,{notionToken:'qa-only'});assert.equal(body.properties['Modelo contratado'].select.name,'M5 Reformulação Institucional');assert.equal(body.properties['Confirmo que este briefing é para Reformulação de Site Institucional Local'].checkbox,true);}finally{globalThis.fetch=original;}
});
function approvedCreation(){return {site:{model:'M5',project_type:'creation',custom_scope:{scope_status:'approved',approved_by:'Responsável de teste',approved_at:'2026-10-16T12:00:00Z',pages:[{path:'/',purpose:'Destaques'},{path:'/roteiro',purpose:'Obras escritas'},{path:'/direcao',purpose:'Filmes dirigidos'},{path:'/bio',purpose:'Trajetória, foto e links'}],features:[{name:'Vídeos da Home',acceptance:'Reprodução silenciosa, capa alternativa e clique no celular'}],rollback_plan:'Retirar a primeira publicação em caso de falha e restaurar a versão estável do pacote.'}}};}
test('a new-site scope requires approval, pages, acceptance and recovery without fictitious inventory',()=>{
 const c=approvedCreation();assert.deepEqual(validateM5Scope(c),[]);for(const key of ['approved_by','approved_at','pages','features','rollback_plan']){const bad=structuredClone(c);delete bad.site.custom_scope[key];assert.ok(validateM5Scope(bad).length,key);}const old=structuredClone(c);old.site.project_type='reformulation';assert.ok(validateM5Scope(old).some(e=>e.includes('URL')));
});
test('audiovisual delivery requires confirmed assets and actual media/accessibility test evidence',()=>{
 const c=approvedCreation(),r=c.site.custom_scope;r.profile='audiovisual';r.audiovisual={works:[{title:'Obra de teste',source:'https://example.org/filme.mp4',page:'/direcao',role:'Direção',credits:'Créditos aprovados em material de teste'}],home_videos:['Obra de teste'],playback:'autoplay-muted',mobile_strategy:'Capa e clique',fallback_strategy:'Capa e controle acessível',bio_text:'Bio aprovada',bio_photo:'https://example.org/foto.jpg',professional_links:[{label:'IMDb',url:'https://example.org/imdb'}],awards:[]};assert.deepEqual(validateM5Scope(c),[]);const pass={status:'passed',evidence:'Evidência fictícia restrita a esta unidade de teste'};const checks=Object.fromEntries(['scope','content','urls','integrations','rollback','media_rights','playback','mobile_performance','accessibility'].map(k=>[k,pass]));checks.pages=r.pages.map(p=>({path:p.path,...pass}));checks.features=r.features.map(f=>({name:f.name,...pass}));assert.deepEqual(validateM5Scope(c,{custom_checks:checks},true),[]);delete checks.playback;assert.ok(validateM5Scope(c,{custom_checks:checks},true).length);
});
test('Cloudflare receives the custom briefing and writes directly to Notion, without Vercel',async()=>{
 const original=globalThis.fetch;const urls=[];globalThis.fetch=async(url,o)=>{urls.push(url);assert.equal(JSON.parse(o.body).properties['Tipo de projeto M5'].select.name,'Criação');return Response.json({id:'qa-cloudflare-page'});};
 try{const r=await worker.fetch(new Request('https://site.jumper.dev.br/briefing/api/briefings',{method:'POST',body:JSON.stringify(payload())}),{NOTION_TOKEN:'qa-only',NOTION_DATABASE_ID:'qa-only'});assert.equal(r.status,201);assert.equal((await r.json()).notion_page_id,'qa-cloudflare-page');assert.deepEqual(urls,['https://api.notion.com/v1/pages']);}finally{globalThis.fetch=original;}
});
test('Cloudflare rejects malformed input and returns a recoverable error if the Notion secret is absent',async()=>{
 const url='https://site.jumper.dev.br/briefing/api/briefings';assert.equal((await worker.fetch(new Request(url),{})).status,405);for(const body of ['{','{}'])assert.equal((await worker.fetch(new Request(url,{method:'POST',body}),{})).status,400);const r=await worker.fetch(new Request(url,{method:'POST',body:JSON.stringify(payload())}),{});assert.equal(r.status,503);assert.equal((await r.json()).error,'briefing_unavailable');
});
test('CSV import detects personalized creation as M5 and does not require a previous site',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'jumper-m5-new-'));try{const file=path.join(dir,'novo.csv');fs.writeFileSync(file,'Nome do Negócio,Modelo contratado,Tipo de projeto M5,Perfil do site M5,Páginas solicitadas M5,Detalhamento das páginas M5,Recursos solicitados M5\nTeste criação,M5 Site Personalizado,Criação,Portfólio audiovisual,"Home, Roteiro, Direção, Bio",Conteúdo por página,Vídeos\n');const r=spawnSync(process.execPath,['scripts/briefing-to-prompt-pack.mjs',file,'--out',path.join(dir,'out')],{cwd:new URL('../../',import.meta.url),encoding:'utf8'});assert.equal(r.status,0,r.stderr);const folder=fs.readdirSync(path.join(dir,'out'))[0];const config=JSON.parse(fs.readFileSync(path.join(dir,'out',folder,'briefing','jumper-config-sugerido.json')));assert.equal(config.site.model,'M5');assert.equal(config.site.project_type,'creation');assert.equal(config.site.custom_scope.scope_status,'pending_review');assert.equal(config.site.reformulation,undefined);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('production preflight blocks switching transport without the Notion secret',()=>{
 assert.ok(validateBriefingSecrets([],true).length);
 assert.ok(validateBriefingSecrets([{name:'NOTION_TOKEN',type:'plain_text'}],true).length);
 assert.deepEqual(validateBriefingSecrets([{name:'NOTION_TOKEN',type:'secret_text'}],true),[]);
 assert.deepEqual(validateBriefingSecrets([],false),[]);
});
