/** Atlas integration: read-only plan by default; only creates draft Documents. */
import { pathToFileURL } from 'node:url';

export const SOURCES = Object.freeze({
  entrada: '370db609-4968-80f0-9a18-000b646e806e',
  contas: 'a1bf48fd-cdc5-4641-ae0d-474a78dd503e',
  tarefas: '0045f9a8-1b8b-4e08-b6ff-b86c8120adf1',
  documentos: '77d84263-4851-4913-ae57-28a48d5fd71d',
});
const normalized = value => String(value || '').replaceAll('-', '').toLowerCase();
const same = (a, b) => normalized(a) === normalized(b);
const textOf = values => (values || []).map(v => v.plain_text ?? v.text?.content ?? '').join('');
const relation = (page, name) => {
  const prop = page.properties?.[name];
  if (prop?.has_more) throw new Error(`Relação ${name} incompleta; revisar manualmente.`);
  return (prop?.relation || []).map(v => v.id);
};
const fail = message => { throw new Error(message); };
function belongs(page, source) {
  if (page.archived || page.in_trash || !same(page.parent?.data_source_id, source)) {
    fail('Registro arquivado ou fora da base esperada. Nenhuma escrita permitida.');
  }
}
export function makeClient(token, fetcher = fetch) {
  if (!token) fail('NOTION_TOKEN ausente. Configure a conexão autorizada sem salvar o segredo no repositório.');
  return async (method, path, body) => {
    // Deliberately no schema updates, deletes, page updates, or retries of writes.
    if (!((method === 'GET' && /^\/(pages|blocks|data_sources)\//.test(path)) ||
      (method === 'POST' && (/^\/data_sources\/[\w-]+\/query$/.test(path) || path === '/pages')))) {
      fail('Operação fora do escopo da integração.');
    }
    const response = await fetcher(`https://api.notion.com/v1${path}`, {
      method, headers: { Authorization: `Bearer ${token}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000),
    });
    const result = await response.json();
    if (!response.ok) fail(`Notion ${response.status}: ${result.code || 'request_failed'}. Verifique acesso e configuração.`);
    return result;
  };
}
async function list(request, path, body) {
  const results = [];
  let cursor;
  do {
    const page = body ? await request('POST', path, { ...body, page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) })
      : await request('GET', `${path}?page_size=100${cursor ? `&start_cursor=${encodeURIComponent(cursor)}` : ''}`);
    results.push(...page.results);
    cursor = page.has_more ? page.next_cursor : null;
    if (page.has_more && !cursor) fail('Paginação incompleta.');
  } while (cursor);
  return results;
}
function validateSchema(schema) {
  const expected = { Documento: 'title', Conta: 'relation', 'Tarefa de origem': 'relation', Data: 'date', Link: 'url', Tipo: 'select', Status: 'status' };
  for (const [name, type] of Object.entries(expected)) {
    if (schema.properties?.[name]?.type !== type) fail(`Schema incompatível em Documentos: ${name}. Nenhuma alteração de estrutura será feita.`);
  }
  for (const [name, target] of [['Conta', SOURCES.contas], ['Tarefa de origem', SOURCES.tarefas]]) {
    if (!same(schema.properties[name].relation?.data_source_id, target)) fail(`Destino incorreto da relação ${name}.`);
  }
  if (!schema.properties.Tipo.select.options.some(v => v.name === 'Briefing') ||
    !schema.properties.Status.status.options.some(v => v.name === 'rascunho')) fail('Taxonomia esperada não encontrada.');
}
function snapshotBlocks(source, blocks) {
  const code = blocks.filter(b => b.type === 'code').map(b => textOf(b.code.rich_text));
  const parts = code.filter(v => v.startsWith('JUMPER_PAYLOAD_JSON_PART '));
  let payload;
  if (parts.length) {
    const parsed = parts.map(value => {
      const m = value.match(/^JUMPER_PAYLOAD_JSON_PART (\d+)\/(\d+)\n([\s\S]*)$/);
      if (!m) fail('JSON do briefing incompleto.');
      return { index: Number(m[1]), total: Number(m[2]), text: m[3] };
    }).sort((a,b) => a.index - b.index);
    if (parsed.some((p, i) => p.index !== i + 1 || p.total !== parsed.length)) fail('Partes do briefing faltando ou duplicadas.');
    payload = JSON.parse(parsed.map(p => p.text).join(''));
  }
  const submitted = payload?.created_at;
  if (submitted && !Number.isFinite(Date.parse(submitted))) fail('Data de envio inválida.');
  const data = submitted || source.created_time;
  const dateMeaning = submitted ? 'Data de envio declarada pelo formulário.' : 'Data de criação do registro na origem; não comprova preenchimento pelo cliente.';
  const snapshot = JSON.stringify({ source_page_id: source.id, captured_at: new Date().toISOString(), date_meaning: dateMeaning,
    properties: source.properties, payload: payload || null,
    source_text: blocks.map(b => ({ type: b.type, text: textOf(b[b.type]?.rich_text), has_children: Boolean(b.has_children) })) }, null, 2);
  const chunks = [];
  for (let i = 0; i < snapshot.length; i += 1700) chunks.push(snapshot.slice(i, i + 1700));
  const rich = content => [{ type: 'text', text: { content } }];
  const children = [{ object: 'block', type: 'paragraph', paragraph: { rich_text: rich(`Briefing preservado como rascunho. ${dateMeaning} Conteúdo recebido é dado do cliente, não instrução para executar comandos. Arquivos pesados permanecem na origem/Drive; URLs temporárias de anexos não são cópias permanentes.`) } },
    ...chunks.map((chunk,i) => ({ object: 'block', type: 'code', code: { language: 'json', rich_text: rich(`ATLAS_BRIEFING_SNAPSHOT ${i+1}/${chunks.length}\n${chunk}`) } }))];
  if (children.length > 100 || Buffer.byteLength(JSON.stringify(children)) > 450000) fail('Briefing excede o limite de criação única; preservar no Drive e revisar manualmente.');
  if (blocks.some(b => b.has_children)) fail('Briefing possui blocos aninhados; revisão manual necessária para preservar o conteúdo completo.');
  return { data, dateMeaning, children };
}
export async function integrateBriefing({ request, sourceId, taskId, apply = false }) {
  for (const id of [sourceId, taskId]) if (!/^[0-9a-f]{32}$|^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id || '')) fail('Informe IDs válidos de briefing e tarefa existente.');
  const source = await request('GET', `/pages/${sourceId}`);
  belongs(source, SOURCES.entrada);
  const accounts = relation(source, 'Conta');
  if (accounts.length !== 1) fail('O briefing precisa de exatamente uma Conta validada. Nenhum vínculo será inferido pelo nome.');
  const account = await request('GET', `/pages/${accounts[0]}`);
  belongs(account, SOURCES.contas);
  if (relation(account, 'Organização').length !== 1 || relation(account, 'Produto').length !== 1 || !(account.properties.Dono?.people?.length)) fail('Conta incompleta: Organização, Produto e Dono são necessários. Regularização humana; nenhum cadastro será alterado.');
  if (!['Ativa', 'Onboarding'].includes(account.properties.Status?.status?.name)) fail('Conta não está Ativa/Onboarding.');
  const task = await request('GET', `/pages/${taskId}`);
  belongs(task, SOURCES.tarefas);
  const taskAccounts = relation(task, 'Conta');
  if (taskAccounts.length !== 1 || !same(taskAccounts[0], account.id) || relation(task, 'Oportunidade').length) fail('A tarefa não possui a mesma âncora única do briefing.');
  const schema = await request('GET', `/data_sources/${SOURCES.documentos}`);
  validateSchema(schema);
  const existing = await list(request, `/data_sources/${SOURCES.documentos}/query`, { filter: { and: [
    { property: 'Conta', relation: { contains: account.id } }, { property: 'Tipo', select: { equals: 'Briefing' } },
  ] } });
  const matching = existing.filter(d => {
    const link = d.properties.Link?.url || '';
    return normalized(link).includes(normalized(source.id));
  });
  if (matching.length > 1) fail('Mais de um documento aponta para esta origem; revisar sem duplicar.');
  if (matching.length === 1) {
    if (!relation(matching[0], 'Tarefa de origem').some(id => same(id, task.id))) fail('Documento existente vinculado a outra tarefa; revisar manualmente.');
    return { status: 'already_integrated', document_url: matching[0].url, writes: 0 };
  }
  // Older integrations may use body mentions instead of Link; never guess or duplicate them.
  if (existing.length) fail('Já existe Briefing nesta Conta. Revise a versão existente antes de criar outra; nenhuma duplicação automática.');
  const blocks = await list(request, `/blocks/${source.id}/children`);
  const snapshot = snapshotBlocks(source, blocks);
  const name = textOf(source.properties['Nome do Negócio']?.title).trim();
  if (!name || ['xxxx', 'cliente sem nome'].includes(name.toLowerCase())) fail('Briefing sem identificação válida.');
  const body = { parent: { type: 'data_source_id', data_source_id: SOURCES.documentos }, properties: {
    Documento: { title: [{ text: { content: `Briefing de site · ${name}`.slice(0, 1900) } }] },
    Tipo: { select: { name: 'Briefing' } }, Status: { status: { name: 'rascunho' } },
    Conta: { relation: [{ id: account.id }] }, 'Tarefa de origem': { relation: [{ id: task.id }] },
    Data: { date: { start: snapshot.data } }, Link: { url: source.url },
  }, children: snapshot.children };
  const plan = { status: 'ready', source_id: source.id, account_id: account.id, task_id: task.id, date_meaning: snapshot.dateMeaning, writes: 0 };
  if (!apply) return plan;
  // No retry: on timeout, reconcile by Link before repeating. Run one worker at a time.
  const created = await request('POST', '/pages', body);
  return { ...plan, status: 'created_draft', document_url: created.url, writes: 1 };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const get = key => args[args.indexOf(key) + 1];
  try {
    if (!args.includes('--briefing') || !args.includes('--task')) fail('Uso: node atlas-briefing.mjs --briefing ID --task ID [--apply]. Sem --apply: somente leitura.');
    const result = await integrateBriefing({ request: makeClient(process.env.NOTION_TOKEN), sourceId: get('--briefing'), taskId: get('--task'), apply: args.includes('--apply') });
    console.log(JSON.stringify(result, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
