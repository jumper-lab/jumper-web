import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { protectedPages } from './preflight-hoster.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(projectRoot, '../../../..');
const git = (...args) => execFileSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' }).trim();
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

if (git('branch', '--show-current') !== 'main') throw new Error('Deploy permitido somente de main. Faça PR e merge antes.');
if (git('status', '--porcelain', '--untracked-files=normal')) throw new Error('Há alterações locais. Faça o deploy de um checkout limpo.');
const sha = git('rev-parse', 'HEAD');
if (sha !== git('ls-remote', 'origin', 'refs/heads/main').split(/\s+/)[0]) throw new Error('O main local não corresponde ao GitHub.');

const config = JSON.parse(await readFile(join(projectRoot, 'wrangler.hub.jsonc'), 'utf8'));
const routes = config.routes.map((route) => route.pattern).sort();
const expectedRoutes = ['site.jumper.dev.br/', 'site.jumper.dev.br/hub-assets/*'].sort();
if (JSON.stringify(routes) !== JSON.stringify(expectedRoutes)) throw new Error('As rotas do hub mudaram; revise antes de publicar.');
for (const path of ['index.html', 'hub-assets/hub-redesign.css', 'hub-assets/favicon-jumper.png']) {
  await readFile(join(projectRoot, 'hub-dist', path));
}

async function livePages() {
  const result = new Map();
  for (const [name, url] of protectedPages) {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
    if (response.status !== 200) throw new Error(`${name}: HTTP ${response.status} antes/depois do deploy.`);
    result.set(name, digest(Buffer.from(await response.arrayBuffer())));
  }
  return result;
}

const before = await livePages();
if (sha !== git('ls-remote', 'origin', 'refs/heads/main').split(/\s+/)[0]) throw new Error('O GitHub main mudou durante a verificação.');
const deployment = spawnSync('npx', [
  '--no-install', 'wrangler', 'deploy', '--config', 'wrangler.hub.jsonc', '--strict',
  '--tag', `git-${sha}`, '--message', `jumper-hub from jumper-web main ${sha}`,
], { cwd: projectRoot, stdio: 'inherit' });
if (deployment.error) throw deployment.error;
if (deployment.status !== 0) process.exit(deployment.status || 1);

const root = await fetch('https://site.jumper.dev.br/', { redirect: 'manual', signal: AbortSignal.timeout(20000) });
if (root.status !== 401 || root.headers.get('X-Jumper-Surface') !== 'jumper-hub') {
  throw new Error(`Deploy do hub não confirmado: raiz HTTP ${root.status} sem marcador do Worker separado.`);
}
const css = await fetch('https://site.jumper.dev.br/hub-assets/hub-redesign.css', { signal: AbortSignal.timeout(20000) });
if (css.status !== 200 || css.headers.get('X-Jumper-Surface') !== 'jumper-hub') {
  throw new Error(`Deploy do hub não confirmado: CSS HTTP ${css.status}.`);
}
const after = await livePages();
for (const [name, original] of before) {
  if (after.get(name) !== original) throw new Error(`Atenção: ${name} mudou durante o deploy do hub. Não publique o hoster.`);
}
console.log('Hub publicado separadamente; login, CSS e páginas dos sites conferidos.');
