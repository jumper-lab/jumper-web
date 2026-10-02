import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { developmentSlugs } from '../cloudflare/dev-worker.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(projectRoot, '../../../..');
const assetsRoot = join(projectRoot, 'hoster-dist');
const inventoryPath = join(projectRoot, 'config/dev-site-inventory.json');
const workerName = 'jumper-hoster-dev';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

const liveBoundaries = [
  ['hub', 'https://site.jumper.dev.br/', 401],
  ['briefing', 'https://site.jumper.dev.br/briefing/', 200],
  ['briefing CSS', 'https://site.jumper.dev.br/briefing/styles.css', 200],
  ['briefing JS', 'https://site.jumper.dev.br/briefing/quiz.js', 200],
  ['briefing API', 'https://site.jumper.dev.br/briefing/api/briefings', 405],
  ['autenticação', 'https://site.jumper.dev.br/__jumper/system-status', 401],
  ['API de leads', 'https://site.jumper.dev.br/api/izigym/leads', 401],
  ['IZI Gym oficial', 'https://www.izigym.com.br/', 200],
  ['LP Cerro Corá oficial', 'https://cerrocora.izigym.com.br/', 200],
];

export async function checkLiveBoundaries(fetchPublished = fetch) {
  const snapshot = {};
  const differences = [];
  for (const [name, url, status] of liveBoundaries) {
    try {
      const response = await fetchPublished(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
      if (response.status !== status || response.headers.get('X-Jumper-Worker') === workerName) {
        differences.push(`${name}: área live respondeu de forma inesperada (HTTP ${response.status})`);
        continue;
      }
      snapshot[name] = `${response.status}:${digest(Buffer.from(await response.arrayBuffer()))}`;
    } catch (error) {
      differences.push(`${name}: não foi possível conferir (${error.message})`);
    }
  }
  return { snapshot, differences };
}

export function parseAllowedSlugs(args) {
  const flags = args.filter((arg) => arg.startsWith('--allow='));
  if (flags.length !== 1 || args.length !== 1) {
    throw new Error('Informe exatamente um site dev: --allow=<slug>. Nunca use uma liberação global.');
  }
  const slug = flags[0].slice('--allow='.length);
  if (!developmentSlugs.includes(slug)) throw new Error(`Caminho dev não autorizado: ${slug}`);
  return slug;
}

export async function listSiteAssets(root, slug) {
  const base = join(root, slug);
  const files = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const name = join(directory, entry.name);
      if (entry.isDirectory()) await walk(name);
      else if (entry.isFile()) files.push(relative(root, name).split(sep).join('/'));
      else throw new Error(`Asset não regular no pacote dev: ${name}`);
    }
  }
  await walk(base);
  files.sort();
  if (!files.includes(`${slug}/index.html`)) throw new Error(`Página inicial ausente no pacote dev: ${slug}`);
  return files;
}

export async function compareUntouchedSites({ allowedSlug, root = assetsRoot, fetchPublished = fetch, concurrency = 8, inventory, baselineInventory } = {}) {
  if (allowedSlug !== null && !developmentSlugs.includes(allowedSlug)) throw new Error(`Caminho dev não autorizado: ${allowedSlug}`);
  const expected = inventory || JSON.parse(await readFile(inventoryPath, 'utf8'));
  const paths = [];
  const differences = [];
  for (const slug of developmentSlugs) {
    const candidates = await listSiteAssets(root, slug);
    const recorded = expected[slug];
    if (!Array.isArray(recorded) || recorded.some((path) => typeof path !== 'string' || !path.startsWith(`${slug}/`))) {
      differences.push(`${slug}: inventário inválido ou ausente`);
      continue;
    }
    if (slug !== allowedSlug && baselineInventory && JSON.stringify(recorded) !== JSON.stringify(baselineInventory[slug])) {
      differences.push(`${slug}: inventário de outro site mudou em relação ao main`);
    }
    const candidateSet = new Set(candidates);
    const recordedSet = new Set(recorded);
    for (const path of recordedSet) if (!candidateSet.has(path)) differences.push(`${path}: removido do pacote; revise o inventário em PR`);
    for (const path of candidateSet) if (!recordedSet.has(path)) differences.push(`${path}: novo no pacote; revise o inventário em PR`);
    if (slug !== allowedSlug) paths.push(...candidates);
  }
  for (const slug of Object.keys(expected)) {
    if (!developmentSlugs.includes(slug)) differences.push(`${slug}: slug inesperado no inventário`);
  }
  let next = 0;
  async function compareNext() {
    while (next < paths.length) {
      const path = paths[next++];
      const encodedPath = path.split('/').map(encodeURIComponent).join('/');
      const url = new URL(`/${encodedPath}`, 'https://site.jumper.dev.br');
      try {
        const candidate = await readFile(join(root, path));
        const sitePrefix = `/${path.split('/')[0]}/`;
        let currentUrl = url;
        let response;
        for (let redirects = 0; redirects < 4; redirects += 1) {
          response = await fetchPublished(currentUrl.href, {
            redirect: 'manual',
            headers: {
              'Cache-Control': 'no-cache',
              ...(process.env.HOSTER_DEV_AUDIT_TOKEN ? { 'X-Jumper-Dev-Audit-Token': process.env.HOSTER_DEV_AUDIT_TOKEN } : {}),
            },
            signal: AbortSignal.timeout(30000),
          });
          if (![301, 302, 303, 307, 308].includes(response.status)) break;
          const location = response.headers.get('Location');
          if (!location) throw new Error('redirecionamento sem destino');
          const nextUrl = new URL(location, currentUrl);
          if (nextUrl.origin !== url.origin || !nextUrl.pathname.startsWith(sitePrefix)) {
            throw new Error('redirecionamento saiu do site dev; token não enviado');
          }
          currentUrl = nextUrl;
        }
        if ([301, 302, 303, 307, 308].includes(response.status)) throw new Error('redirecionamentos demais');
        if (response.status !== 200 || response.headers.get('X-Jumper-Worker') !== workerName) {
          differences.push(`${path}: página publicada não veio do ${workerName} (HTTP ${response.status})`);
          continue;
        }
        const published = Buffer.from(await response.arrayBuffer());
        if (digest(candidate) !== digest(published)) differences.push(`${path}: pacote difere do dev publicado`);
      } catch (error) {
        differences.push(`${path}: não foi possível comparar (${error.message})`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, paths.length) }, () => compareNext()));
  return { checked: paths.length, differences: differences.sort() };
}

function git(...args) {
  return execFileSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' }).trim();
}

function assertPushedCleanBranch() {
  const branch = git('branch', '--show-current');
  if (!branch || branch === 'main') throw new Error('Teste o site dev a partir de uma branch publicada, antes do merge.');
  if (git('status', '--porcelain', '--untracked-files=normal')) throw new Error('Checkout contém alterações locais; publique a branch e use um checkout limpo.');
  const remote = git('ls-remote', 'origin', `refs/heads/${branch}`).split(/\s+/)[0];
  if (git('rev-parse', 'HEAD') !== remote) throw new Error('A branch local não corresponde à branch no GitHub.');
  const main = git('ls-remote', 'origin', 'refs/heads/main').split(/\s+/)[0];
  if (git('rev-parse', 'origin/main') !== main) throw new Error('Atualize origin/main antes de conferir o dev.');
  try {
    git('merge-base', '--is-ancestor', main, 'HEAD');
  } catch {
    throw new Error('A branch não contém o main atual. Rebase ou reconcilie antes do deploy dev.');
  }
  const filename = relative(repositoryRoot, inventoryPath).split(sep).join('/');
  return JSON.parse(git('show', `origin/main:${filename}`));
}

function assertCleanMain() {
  if (git('branch', '--show-current') !== 'main') throw new Error('Deploy somente do código do Worker exige main limpo.');
  if (git('status', '--porcelain', '--untracked-files=normal')) throw new Error('Checkout contém alterações locais.');
  const remote = git('ls-remote', 'origin', 'refs/heads/main').split(/\s+/)[0];
  if (git('rev-parse', 'HEAD') !== remote) throw new Error('O main local não corresponde ao GitHub.');
  const filename = relative(repositoryRoot, inventoryPath).split(sep).join('/');
  return JSON.parse(git('show', `HEAD:${filename}`));
}

export function activeDevVersion() {
  const deployments = JSON.parse(execFileSync('npx', ['--no-install', 'wrangler', 'deployments', 'list', '--name', workerName, '--json'], {
    cwd: projectRoot, encoding: 'utf8',
  }));
  const latest = deployments.sort((a, b) => a.created_on.localeCompare(b.created_on)).at(-1);
  if (!latest || latest.versions?.length !== 1 || latest.versions[0].percentage !== 100) {
    throw new Error('O Worker dev não tem uma única versão ativa a 100%.');
  }
  return latest.versions[0].version_id;
}

export async function runDevPreflight({ allowedSlug, root = assetsRoot, enforceGit = true, fetchPublished = fetch } = {}) {
  const baselineInventory = enforceGit ? (allowedSlug === null ? assertCleanMain() : assertPushedCleanBranch()) : undefined;
  const before = activeDevVersion();
  const result = await compareUntouchedSites({ allowedSlug, root, fetchPublished, baselineInventory });
  const live = await checkLiveBoundaries(fetchPublished);
  result.differences.push(...live.differences);
  const after = activeDevVersion();
  if (before !== after) result.differences.push('O Worker dev mudou durante a verificação. Recomece.');
  return { ...result, activeVersion: after, liveSnapshot: live.snapshot };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const audit = process.argv.includes('--audit');
    const flags = process.argv.slice(2).filter((arg) => arg !== '--audit');
    const allowedSlug = flags.length === 1 && flags[0] === '--worker-only' ? null : parseAllowedSlugs(flags);
    const result = await runDevPreflight({ allowedSlug, enforceGit: !audit });
    console.log(`Worker dev ativo: ${result.activeVersion}; ${result.checked} assets de outros sites conferidos.`);
    if (result.differences.length) {
      for (const difference of result.differences) console.error(`BLOQUEADO: ${difference}`);
      process.exitCode = 1;
    } else {
      console.log(allowedSlug === null
        ? `Preflight dev aprovado: todos os ${developmentSlugs.length} sites preservados. Nenhum deploy foi feito.`
        : `Preflight dev aprovado somente para ${allowedSlug}. Nenhum deploy foi feito.`);
    }
  } catch (error) {
    console.error(`BLOQUEADO: ${error.message}`);
    process.exitCode = 1;
  }
}
