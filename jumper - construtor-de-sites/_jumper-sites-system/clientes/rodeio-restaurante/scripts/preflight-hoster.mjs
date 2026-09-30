import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(projectRoot, '../../../..');
const assetsRoot = join(projectRoot, 'hoster-dist');
const cloudflareAccountId = 'e23efa36a1e09015eebb2b36bdfcf201';
const workerName = 'jumper-hoster';

// These pages are outside the hub. A hub-only deploy must preserve their bodies.
export const protectedPages = [
  ['Rodeio dev', 'https://site.jumper.dev.br/rodeio/', 'rodeio/index.html'],
  ['IZI Gym dev', 'https://site.jumper.dev.br/izigym/', 'izigym/index.html'],
  ['IZI Gym LP v1', 'https://site.jumper.dev.br/izigym-lp/', 'izigym-lp/index.html'],
  ['IZI Gym LP v2', 'https://site.jumper.dev.br/izigym-lp-vilaromana/', 'izigym-lp-vilaromana/index.html'],
  ['Casa Beliê v1', 'https://site.jumper.dev.br/casabelie/', 'casabelie/index.html'],
  ['Casa Beliê v2', 'https://site.jumper.dev.br/casabelie-2/', 'casabelie-2/index.html'],
  ['Casa Beliê v3', 'https://site.jumper.dev.br/casabelie-3/', 'casabelie-3/index.html'],
  ['IZI Gym oficial', 'https://www.izigym.com.br/', '_official/izigym/index.shell'],
  ['Cerro Corá oficial', 'https://cerrocora.izigym.com.br/', 'cerrocora/index.html'],
];

const criticalWorkerFeatures = [
  'cerrocora.izigym.com.br',
  'IZI_LEADS_DB',
  'IZI_LEADS_TEST_DB',
  'JUMPER_BRIEFING_DRAFTS',
  'JUMPER_HUB_OPERATIONS',
  '/api/izigym/leads',
];

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

export async function compareProtectedPages(readCandidate, fetchLive = fetch) {
  const differences = [];
  for (const [name, url, asset] of protectedPages) {
    let candidate;
    try {
      candidate = await readCandidate(asset);
    } catch {
      differences.push(`${name}: arquivo ausente no pacote (${asset})`);
      continue;
    }
    try {
      const response = await fetchLive(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
      if (response.status !== 200) {
        differences.push(`${name}: resposta publicada HTTP ${response.status}`);
        continue;
      }
      const current = Buffer.from(await response.arrayBuffer());
      if (digest(candidate) !== digest(current)) {
        differences.push(`${name}: conteúdo publicado difere do pacote (${digest(current).slice(0, 12)} ≠ ${digest(candidate).slice(0, 12)})`);
      }
    } catch (error) {
      differences.push(`${name}: não foi possível conferir a URL publicada (${error.message})`);
    }
  }
  return differences;
}

function git(...args) {
  return execFileSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' }).trim();
}

function assertGitHubFirst() {
  const branch = git('branch', '--show-current');
  if (branch && branch !== 'main') throw new Error('Deploy permitido somente de main. Faça PR e merge antes.');
  if (git('status', '--porcelain', '--untracked-files=normal')) throw new Error('Há alterações locais rastreadas ou não rastreadas. Use um checkout limpo.');
  const local = git('rev-parse', 'HEAD');
  const remote = git('ls-remote', 'origin', 'refs/heads/main').split(/\s+/)[0];
  if (local !== remote) throw new Error('main local não corresponde ao main atual do GitHub. Atualize o checkout.');
}

async function cloudflareAccountGet(path) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error('CLOUDFLARE_API_TOKEN não está configurado no ambiente.');
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Consulta à Cloudflare falhou (HTTP ${response.status}).`);
  return response;
}

const cloudflareGet = (path) => cloudflareAccountGet(`/workers/scripts/${workerName}${path}`);

export function compareDomains(configured, published) {
  const differences = [];
  for (const domain of published) {
    if (!configured.includes(domain)) differences.push(`Domínio ativo ausente no wrangler.jsonc (${domain})`);
  }
  for (const domain of configured) {
    if (!published.includes(domain)) differences.push(`Domínio novo no wrangler.jsonc exige revisão (${domain})`);
  }
  return differences;
}

async function domainDifferences() {
  const response = await cloudflareAccountGet('/workers/domains');
  const payload = await response.json();
  if (!payload.success || !Array.isArray(payload.result)) throw new Error('Cloudflare não confirmou os domínios do Worker.');
  const published = payload.result.filter((domain) => domain.service === workerName).map((domain) => domain.hostname);
  const config = await readFile(join(projectRoot, 'wrangler.jsonc'), 'utf8');
  const configured = [...config.matchAll(/"pattern"\s*:\s*"([^"]+)"/g)].map((match) => match[1]);
  return compareDomains(configured, published);
}

export async function activeVersion() {
  if (!process.env.CLOUDFLARE_API_TOKEN) {
    const deployments = wranglerJson('deployments', 'list');
    if (!Array.isArray(deployments) || !deployments.length) throw new Error('Wrangler não confirmou o deployment atual.');
    const deployment = deployments.sort((a, b) => a.created_on.localeCompare(b.created_on)).at(-1);
    if (deployment.versions?.length !== 1 || deployment.versions[0].percentage !== 100) {
      throw new Error('O Worker não tem uma única versão ativa a 100%.');
    }
    return { deploymentId: deployment.id, versionId: deployment.versions[0].version_id };
  }
  const payload = await (await cloudflareGet('/deployments')).json();
  if (!payload.success) throw new Error('Cloudflare não confirmou o deployment atual.');
  const deployment = payload.result?.deployments?.[0];
  if (!deployment || deployment.versions?.length !== 1 || deployment.versions[0].percentage !== 100) {
    throw new Error('O Worker não tem uma única versão ativa a 100%.');
  }
  return { deploymentId: deployment.id, versionId: deployment.versions[0].version_id };
}

function wranglerJson(...args) {
  return JSON.parse(execFileSync('npx', ['--no-install', 'wrangler', ...args, '--json'], { cwd: projectRoot, encoding: 'utf8' }));
}

function configuredBindingIds(config) {
  const bindings = [...config.matchAll(/"binding"\s*:\s*"([^"]+)"\s*,\s*"database_name"\s*:\s*"[^"]+"\s*,\s*"database_id"\s*:\s*"([^"]+)"/g)];
  return new Map(bindings.map(([, name, id]) => [name, id]));
}

async function bindingDifferences(versionId) {
  const version = wranglerJson('versions', 'view', versionId);
  const active = new Map((version.resources?.bindings || []).filter((binding) => binding.type === 'd1').map((binding) => [binding.name, binding.database_id]));
  const config = await readFile(join(projectRoot, 'wrangler.jsonc'), 'utf8');
  const configured = configuredBindingIds(config);
  const activeKv = new Map((version.resources?.bindings || []).filter((binding) => binding.type === 'kv_namespace').map((binding) => [binding.name, binding.namespace_id]));
  const configuredKv = new Map([...config.matchAll(/"binding"\s*:\s*"([^"]+)"\s*,\s*"id"\s*:\s*"([a-f0-9]+)"/g)].map(([, name, id]) => [name, id]));
  return [
    ...[...active].flatMap(([name, id]) => configured.get(name) === id ? [] : [`D1: vínculo ativo ${name} (${id}) difere do pacote`]),
    ...[...activeKv].flatMap(([name, id]) => configuredKv.get(name) === id ? [] : [`KV: vínculo ativo ${name} (${id}) difere do pacote`]),
  ];
}

async function liveWorkerFeatures() {
  const form = await (await cloudflareGet('/content/v2')).formData();
  const module = form.get('worker.js');
  if (!module || typeof module.text !== 'function') throw new Error('Cloudflare não retornou o módulo principal do Worker.');
  return module.text();
}

export async function runPreflight({ enforceGit = true, candidateAssets = assetsRoot } = {}) {
  if (enforceGit) assertGitHubFirst();
  const before = await activeVersion();
  const candidateWorker = await readFile(join(projectRoot, 'cloudflare/worker.mjs'), 'utf8');
  const differences = criticalWorkerFeatures
    .filter((feature) => !candidateWorker.includes(feature))
    .map((feature) => `Worker: recurso crítico ausente no código candidato (${feature})`);
  if (process.env.CLOUDFLARE_API_TOKEN) {
    const liveWorker = await liveWorkerFeatures();
    differences.push(...criticalWorkerFeatures
      .filter((feature) => liveWorker.includes(feature) && !candidateWorker.includes(feature))
      .map((feature) => `Worker: recurso ativo ausente no código candidato (${feature})`));
    differences.push(...await domainDifferences());
  }
  differences.push(...await bindingDifferences(before.versionId));
  differences.push(...await compareProtectedPages((asset) => readFile(join(candidateAssets, asset))));
  const after = await activeVersion();
  if (before.versionId !== after.versionId || before.deploymentId !== after.deploymentId) {
    differences.push('Cloudflare recebeu outro deploy durante a verificação. Recomece a auditoria.');
  }
  return { activeVersion: after.versionId, differences };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await runPreflight({ enforceGit: !process.argv.includes('--audit') });
    console.log(`Worker ativo: ${result.activeVersion}`);
    if (result.differences.length) {
      for (const difference of result.differences) console.error(`BLOQUEADO: ${difference}`);
      process.exitCode = 1;
    } else {
      console.log('Preflight aprovado: páginas protegidas e recursos críticos preservados.');
    }
  } catch (error) {
    console.error(`BLOQUEADO: ${error.message}`);
    process.exitCode = 1;
  }
}
