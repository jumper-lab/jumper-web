import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {validateGuidedIntake} from '../../Quiz/Briefings/intake-validation.mjs';
import {createNotionBriefingPage} from '../../Quiz/Briefings/notion-client.mjs';
const source=fs.readFileSync(new URL('../../Quiz/Briefings/quiz.js',import.meta.url),'utf8');
const fixture={differentiatorEvidence:'Orientação individual após cada etapa',customerQuestions:'Como funciona? Começa com avaliação.',serviceProcess:'Avaliação, proposta e atendimento',secondaryPageGoal:'Detalhar o serviço para pedir orçamento',differentiator:'Atendimento próximo',typicalProblem:'Encontrar orientação',typicalResult:'Escolher o serviço adequado',servicesItems:'Atendimento com orientação',pricingDisplay:'nao-sei',primaryCTA:'nao-sei',story:'Negócio em início de operação',hasTestimonials:'nao',visualReferences:'Preciso de orientação',portfolioItemsDescription:'Produtos a enviar',portfolioMinItems:'A confirmar',preserveItems:'Marca',removeItems:'Nenhum definido',requestedPages:'Jumper propõe',existingFeatures:'Contato',model:'M1',businessName:'Teste de formulário',shortDescription:'Serviços por atendimento',targetAudience:'Moradores',cityCoverage:'São Paulo',contactName:'Equipe de teste',contactEmail:'teste@example.org',contactUse:'depois',mainGoal:'nao-sei',priorityOffer:'Atendimento',businessNature:'C',personality:'nao-sei',materialsStatus:'later',aiImages:'nao-sei',usePexels:'nao-sei',secondaryPage:'nao-sei',existingSiteUrl:'https://example.org',reformulationReason:'Atualizar informações',reviewConfirmed:true};
function browser(overrides={},storage={getItem:()=>null,setItem:()=>{}}){const c=vm.createContext({URL,Date,structuredClone,localStorage:storage});vm.runInContext(source.slice(0,source.indexOf('const stepContainer =')),c);c.input={...fixture,...overrides};vm.runInContext('Object.assign(state,input)',c);return c;}
const run=(c,s)=>JSON.parse(vm.runInContext(`JSON.stringify(${s})`,c));
test('all models accept essential answers and explicitly defer unknown decisions',()=>{
 for(const model of ['M1','M2','M3','M4','M5']){const c=browser({model});assert.deepEqual(run(c,'visibleSteps().map(s=>stepError(s.id)).filter(Boolean)'),[]);const p=run(c,'buildPayload()');assert.deepEqual(validateGuidedIntake(p),[]);assert.equal(p.assets.ai_placeholder_permission,'nao-sei');assert.equal(p.project_scope.use_pexels_as_placeholder,false);assert.equal(p.operations.contact_publication,'depois');assert.equal(p.production_handoff.status,'needs_review');}
});
test('turning off modules or changing model removes stale conditional content from delivery',()=>{
 const c=browser({model:'M5',wantsGallery:'sim',wantsTeam:'sim',wantsBooking:'sim',blogMode:'blog-ativo',portfolioItemsDescription:'Catálogo',teamList:'Pessoa',appointmentLink:'https://example.org/agenda',blogInitialPosts:'Artigo',businessNature:'A',showAddress:'sim-mapa',address:'Rua teste',materialsStatus:'link',materialsFolder:'https://example.org/materials'});
 assert.equal(run(c,'buildPayload().content.blog.enabled'),true);
 vm.runInContext('Object.assign(state,{model:"M1",businessNature:"D",materialsStatus:"later"})',c);
 const p=run(c,'buildPayload()');assert.equal(p.content.blog.enabled,false);assert.equal(p.content.blog.initial_posts_raw,'');assert.equal(p.content.portfolio.items_description,'');assert.equal(p.content.team.members_raw,'');assert.equal(p.content.conversion.appointment_link,'');assert.equal(p.location.address,'');assert.equal(p.assets.materials_folder,'');assert.equal(p.project_scope.reformulation,null);
});
test('conditional questions only render for the corresponding choices',()=>{
 const c=browser({model:'M2'});let html=run(c,'structureMarkup()');assert.match(html,/secondaryPage/);assert.doesNotMatch(html,/name="blogMode"|name="teamList"|name="portfolioItemsDescription"|name="appointmentLink"/);
 vm.runInContext('Object.assign(state,{model:"M5",wantsGallery:"sim",wantsTeam:"sim",wantsBooking:"sim",blogMode:"blog-ativo"})',c);html=run(c,'structureMarkup()');for(const name of ['blogMode','teamList','portfolioItemsDescription','appointmentLink','blogInitialPosts'])assert.ok(html.includes(`name="${name}"`));
});
test('missing contact, alternate contact, consent and invalid links fail before sending',async()=>{
 const c=browser();const p=run(c,'buildPayload()');
 for(const change of [p=>p.client.contact.email='',p=>p.operations.contact_publication='outro',p=>p.assets.ai_placeholder_permission='',p=>p.project_scope.model_confirmation=false,p=>{p.assets.availability='link';p.assets.materials_folder='javascript:alert(1)';}]){const bad=structuredClone(p);change(bad);assert.ok(validateGuidedIntake(bad).length);await assert.rejects(createNotionBriefingPage(bad,{notionToken:'unused'}),e=>e.status===400);}
});
test('draft recovery whitelists fields, removes secrets and never restores submission authorization',()=>{
 const c=browser();c.raw={...fixture,submitted:true,reviewConfirmed:true,blogAdminPassword:'secret',unexpected:'discard',uploadedFiles:{name:'fake.png'}};
 const s=run(c,'sanitizeDraft(raw)');assert.equal(s.businessName,fixture.businessName);assert.equal(s.reviewConfirmed,false);assert.equal(s.submitted,false);assert.equal(s.blogAdminPassword,'');assert.equal(s.unexpected,undefined);assert.deepEqual(s.uploadedFiles,{});
});
test('legacy draft preserves answers but requires explicit new image decisions',()=>{
 const old={...fixture,model:'M5',usePexels:'sim',teamSection:'sim-nomes',materialsFolder:'https://example.org/pasta'};
 const c=vm.createContext({URL,Date,structuredClone,localStorage:{getItem:key=>key.endsWith('v2')?JSON.stringify(old):null}});vm.runInContext(source.slice(0,source.indexOf('const stepContainer =')),c);
 const s=run(c,'state');assert.equal(s.businessName,fixture.businessName);assert.equal(s.legacyDraft,true);assert.equal(s.usePexels,'');assert.equal(s.aiImages,'');assert.equal(s.reviewConfirmed,false);assert.equal(s.materialsStatus,'link');
});
test('blocked browser storage still allows completion and offers downloadable recovery',()=>{
 const c=browser({}, {getItem:()=>{throw Error('blocked')},setItem:()=>{throw Error('blocked')}});vm.runInContext('saveState()',c);assert.equal(run(c,'storageAvailable'),false);assert.deepEqual(validateGuidedIntake(run(c,'buildPayload()')),[]);
});
test('strategic depth requires content while accepting older open forms',()=>{
 const p=run(browser(),'buildPayload()');assert.equal(p.briefing_depth,'strategic-v3');
 for(const mutate of [p=>p.content.audience.typical_problem='',p=>p.content.services.items_raw='',p=>p.content.positioning.story='',p=>p.creative_direction.visual_references='',p=>{p.content.social_proof.testimonials_available='sim';p.content.social_proof.testimonials_permission='';}]){const bad=structuredClone(p);mutate(bad);assert.ok(validateGuidedIntake(bad).length);delete bad.briefing_depth;assert.deepEqual(validateGuidedIntake(bad),[]);}
 assert.ok(validateGuidedIntake(run(browser({model:'M5',removeItems:''}),'buildPayload()')).length);
});
test('strategic answers and public profile survive canonical payload and Notion import blocks',async()=>{
 const p=run(browser({googleBusiness:'https://example.org/profile',voiceTone:'formal-cortes',hasTestimonials:'sim',testimonials:'Avaliação real de teste',testimonialsPermission:'nao-sei'}),'buildPayload()');
 assert.equal(p.location.google_business,'https://example.org/profile');assert.ok(p.production_handoff.pending_decisions.some(x=>x.includes('autorização dos depoimentos')));
 const saved=globalThis.fetch;let body;
 globalThis.fetch=async(url,options)=>{body=JSON.parse(options.body);return {ok:true,json:async()=>({id:'fixture'})};};
 try{await createNotionBriefingPage(p,{notionToken:'fixture',databaseId:'fixture'});assert.equal(body.properties['Tom de voz'].select.name,'Formal e cortês');
 const chunks=body.children.filter(b=>b.type==='code').map(b=>b.code.rich_text[0].text.content);
 const parsed=JSON.parse(chunks.filter(s=>s.startsWith('JUMPER_PAYLOAD_JSON_PART')).map(s=>s.slice(s.indexOf('\n')+1)).join(''));
 assert.deepEqual(parsed.content.audience,p.content.audience);assert.deepEqual(parsed.content.services,p.content.services);assert.equal(parsed.content.social_proof.testimonials_permission,'nao-sei');assert.equal(parsed.briefing_depth,'strategic-v3');
 const md=chunks.filter(s=>s.startsWith('JUMPER_NORMALIZED_BRIEFING_MD_PART')).map(s=>s.slice(s.indexOf('\n')+1)).join('');assert.match(md,/Autorização dos depoimentos:\*\* nao-sei/);assert.match(md,/Estrutura e Conteúdo por Modelo/);assert.match(md,/Perfil público Google:\*\* https:\/\/example.org\/profile/);
 }finally{globalThis.fetch=saved;}
});
test('M1 preserves an explicit booking link and removes it when the action changes',()=>{
 const c=browser({model:'M1',primaryCTA:'agendamento',appointmentLink:'https://example.org/book'});
 assert.equal(run(c,'buildPayload().content.conversion.appointment_link'),'https://example.org/book');
 assert.match(run(c,'steps.find(s=>s.id==="offer").render()'),/name="appointmentLink"/);
 vm.runInContext('state.primaryCTA="whatsapp"',c);
 assert.equal(run(c,'buildPayload().content.conversion.appointment_link'),'');
});
test('M2 purpose and displayed prices are required, reviewed and pruned when inactive',()=>{
 const c=browser({model:'M2',secondaryPage:'outra',secondaryPageGoal:'Casos de trabalho',pricingDisplay:'todos',pricingDetails:'Avaliação: R$ 100'});
 let p=run(c,'buildPayload()');assert.deepEqual(validateGuidedIntake(p),[]);assert.equal(p.project_scope.secondary_page_goal,'Casos de trabalho');
 assert.ok(run(c,'reviewGroups()').some(x=>x[2].includes('Casos de trabalho')));
 vm.runInContext('state.pricingDetails=""',c);assert.equal(run(c,'stepError("offer").field'),'pricingDetails');assert.ok(validateGuidedIntake(run(c,'buildPayload()')).length);
 vm.runInContext('Object.assign(state,{model:"M1",pricingDisplay:"sem-precos",pricingDetails:"R$ 100"})',c);p=run(c,'buildPayload()');assert.equal(p.content.services.pricing_details,'');assert.equal(p.project_scope.secondary_page_goal,'');
});
test('v2 submissions stay compatible but v3 requires concrete context',()=>{
 const p=run(browser(),'buildPayload()');delete p.content.positioning.differentiator_evidence;delete p.content.audience.questions_raw;delete p.content.services.process_raw;
 assert.ok(validateGuidedIntake(p).length);p.briefing_depth='strategic-v2';assert.deepEqual(validateGuidedIntake(p),[]);
});
test('server replaces public editorial approval and exposes pending specifics in full briefing',async()=>{
 const p=run(browser({differentiator:'Qualidade',differentiatorEvidence:'Não sei',primaryCTA:'whatsapp'}),'buildPayload()');p.production_handoff.content_review={status:'approved',issues:[]};
 const original=globalThis.fetch;let body;globalThis.fetch=async(url,options)=>{body=JSON.parse(options.body);return {ok:true,json:async()=>({id:'fixture'})};};
 try{await createNotionBriefingPage(p,{notionToken:'fixture'});const chunks=body.children.filter(b=>b.type==='code').map(b=>b.code.rich_text[0].text.content);const json=JSON.parse(chunks.filter(s=>s.startsWith('JUMPER_PAYLOAD_JSON_PART')).map(s=>s.slice(s.indexOf('\n')+1)).join(''));const review=json.production_handoff.content_review;assert.equal(review.status,'needs_editorial_review');assert.ok(review.issues.some(x=>x.includes('afirmação ampla')));assert.ok(review.issues.some(x=>x.includes('Evidência do diferencial')));assert.ok(review.issues.some(x=>x.includes('CTA WhatsApp')));const md=chunks.filter(s=>s.startsWith('JUMPER_NORMALIZED_BRIEFING_MD_PART')).map(s=>s.slice(s.indexOf('\n')+1)).join('');assert.match(md,/Revisão editorial antes da construção/);assert.ok(md.includes(p.content.audience.questions_raw));assert.ok(md.includes(p.content.services.process_raw));}finally{globalThis.fetch=original;}
});
test('changing an answer invalidates previous confirmation, while unchanged navigation preserves it',()=>{
 const c=browser();c.form={elements:[{name:'differentiator',type:'textarea'}]};
 c.FormData=class {has(k){return k==='differentiator'}get(){return fixture.differentiator}};
 vm.runInContext('updateStateFromForm()',c);assert.equal(run(c,'state.reviewConfirmed'),true);
 c.FormData=class {has(k){return k==='differentiator'}get(){return 'Resposta alterada'}};
 vm.runInContext('updateStateFromForm()',c);assert.equal(run(c,'state.reviewConfirmed'),false);
});
