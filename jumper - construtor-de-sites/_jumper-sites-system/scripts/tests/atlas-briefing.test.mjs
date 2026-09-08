import test from 'node:test';
import assert from 'node:assert/strict';
import { integrateBriefing, SOURCES, makeClient } from '../atlas-briefing.mjs';
import { createNotionBriefingPage } from '../../Quiz/Briefings/notion-client.mjs';
const ids = ['11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','33333333-3333-3333-3333-333333333333'];
const rel = (...ids) => ({ relation: ids.map(id=>({id})) });
function fixture() {
  const [sourceId, accountId, taskId] = ids;
  const source = { id: sourceId, url: `https://www.notion.so/${sourceId.replaceAll('-','')}`, created_time:'2026-09-08T12:00:00Z', parent:{data_source_id:SOURCES.entrada}, properties:{Conta:rel(accountId),'Nome do Negócio':{title:[{plain_text:'Cliente validado'}]}} };
  const account = { id:accountId, parent:{data_source_id:SOURCES.contas}, properties:{Organização:rel('org'),Produto:rel('product'),Dono:{people:[{id:'owner'}]},Status:{status:{name:'Ativa'}}} };
  const task = { id:taskId,parent:{data_source_id:SOURCES.tarefas},properties:{Conta:rel(accountId),Oportunidade:rel()}};
  const schema = {properties:Object.fromEntries(Object.entries({Documento:'title',Conta:'relation','Tarefa de origem':'relation',Data:'date',Link:'url',Tipo:'select',Status:'status'}).map(([k,type])=>[k,{type}]))};
  schema.properties.Conta.relation={data_source_id:SOURCES.contas};
  schema.properties['Tarefa de origem'].relation={data_source_id:SOURCES.tarefas};
  schema.properties.Tipo.select={options:[{name:'Briefing'}]}; schema.properties.Status.status={options:[{name:'rascunho'}]};
  const f = {source,account,task,schema,existing:[],blocks:[],calls:[]};
  f.request=async(method,path,body)=>{
    f.calls.push({method,path,body});
    if(method==='GET' && path.startsWith('/pages/')) return structuredClone([source,account,task].find(p=>path.endsWith(p.id)));
    if(method==='GET' && path.startsWith('/data_sources/')) return schema;
    if(path.endsWith('/query')) return {results:f.existing,has_more:false};
    if(path.startsWith('/blocks/')) return {results:f.blocks,has_more:false};
    if(method==='POST' && path==='/pages') {const d={id:'doc',url:'https://www.notion.so/doc',properties:body.properties};f.existing.push(d);return d;}
    throw Error('Unexpected request');
  };
  f.run=(apply=false)=>integrateBriefing({request:f.request,sourceId,taskId,apply});
  return f;
}
const writes=f=>f.calls.filter(c=>c.method==='POST' && c.path==='/pages');
test('default only plans, preserving all Atlas records',async()=>{const f=fixture();assert.equal((await f.run()).status,'ready');assert.equal(writes(f).length,0);});
test('apply creates only one draft and subsequent run reuses it',async()=>{const f=fixture();assert.equal((await f.run(true)).status,'created_draft');const body=writes(f)[0].body;assert.equal(body.properties.Status.status.name,'rascunho');assert.equal(body.properties.Tipo.select.name,'Briefing');assert.equal(body.properties['Tarefa de origem'].relation[0].id,ids[2]);assert.equal((await f.run(true)).status,'already_integrated');assert.equal(writes(f).length,1);});
for(const [label,mutate] of [
 ['no account',f=>f.source.properties.Conta=rel()],
 ['multiple accounts',f=>f.source.properties.Conta=rel(ids[1],ids[2])],
 ['missing product',f=>f.account.properties.Produto=rel()],
 ['wrong task',f=>f.task.properties.Conta=rel(ids[0])],
 ['dual anchor',f=>f.task.properties.Oportunidade=rel('opp')],
 ['closed account',f=>f.account.properties.Status.status.name='Encerrada'],
 ['archived source',f=>f.source.archived=true],
 ['wrong schema relation',f=>f.schema.properties.Conta.relation.data_source_id='wrong'],
 ['missing draft option',f=>f.schema.properties.Status.status.options=[]],
 ['legacy briefing already exists',f=>f.existing.push({properties:{Link:{url:null}}})],
 ['nested content',f=>f.blocks.push({type:'toggle',has_children:true,toggle:{rich_text:[]}})],
 ['incomplete payload',f=>f.blocks.push({type:'code',code:{rich_text:[{text:{content:'JUMPER_PAYLOAD_JSON_PART 1/2\n{}'}}]}})],
]) test(`${label}: refuses before writing`,async()=>{const f=fixture();mutate(f);await assert.rejects(f.run(true));assert.equal(writes(f).length,0);});
test('date comes from complete submitted payload',async()=>{const f=fixture();f.blocks=[{type:'code',code:{rich_text:[{text:{content:'JUMPER_PAYLOAD_JSON_PART 1/1\n{"created_at":"2026-09-01T10:00:00Z"}'}}]}}];await f.run(true);assert.equal(writes(f)[0].body.properties.Data.date.start,'2026-09-01T10:00:00Z');});
test('native forms preserve origin date with explicit qualification',async()=>{const f=fixture();const result=await f.run(true);assert.match(result.date_meaning,/não comprova/);assert.equal(writes(f)[0].body.properties.Data.date.start,f.source.created_time);});
test('transport forbids schema edits, page updates and deletes',async()=>{const req=makeClient('fake',()=>{throw Error('network must not run');});for(const [method,path] of [['PATCH','/pages/x'],['DELETE','/blocks/x'],['PATCH','/data_sources/x']]) await assert.rejects(req(method,path),/fora do escopo/);});
test('invalid intake rejected before network',async()=>{for(const value of [null,[],{}, {client:{name:'Test'},project_scope:{model:'M5'}}]) await assert.rejects(createNotionBriefingPage(value,{notionToken:'fake'}),e=>e.status===400);});

// Exercise the actual browser state update with successive visible form steps.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const quizSource = readFileSync(new URL('../../Quiz/Briefings/quiz.js', import.meta.url), 'utf8');
const updateFunction = quizSource.slice(quizSource.indexOf('function updateStateFromForm()'), quizSource.indexOf('function resetQuiz()'));
test('wizard preserves earlier checkboxes and permits clearing the visible group', () => {
  const context = {
    initialState: { modelConfirmation: [], integrations: [], businessName: '', uploadedFiles: {} },
    state: { modelConfirmation: ['M1'], integrations: ['none'], businessName: 'Test', uploadedFiles: {} },
    form: { elements: [{name:'businessName'}], querySelectorAll: () => [] },
    FormData: class { has(k) {return k === 'businessName';} get() {return 'Test updated';} getAll() {return [];} },
    saveState() {},
  };
  vm.createContext(context);
  vm.runInContext(updateFunction + ';updateStateFromForm();', context);
  assert.equal(context.state.modelConfirmation.join(','), 'M1');
  assert.equal(context.state.integrations.join(','), 'none');
  context.form.elements = [{name:'integrations'}];
  vm.runInContext('updateStateFromForm()', context);
  assert.equal(context.state.integrations.length, 0);
  assert.equal(context.state.modelConfirmation.join(','), 'M1');
});
