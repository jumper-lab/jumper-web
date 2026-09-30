import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { activeDevVersion, checkLiveBoundaries, parseAllowedSlugs, runDevPreflight } from './preflight-hoster-dev.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(projectRoot, '../../../..');
const allowedSlug = parseAllowedSlugs(process.argv.slice(2));
const git = (...args) => execFileSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' }).trim();

execFileSync('node', ['scripts/verify-hoster-dev-config.mjs'], { cwd: projectRoot, stdio: 'inherit' });
const sha = git('rev-parse', 'HEAD');
const branch = git('branch', '--show-current');
const preflight = await runDevPreflight({ allowedSlug });
console.log(`${preflight.checked} assets dos outros sites dev conferidos com a publicação atual.`);
if (preflight.differences.length) {
  throw new Error(`Deploy dev bloqueado:\n${preflight.differences.join('\n')}`);
}
if (sha !== git('ls-remote', 'origin', `refs/heads/${branch}`).split(/\s+/)[0]) {
  throw new Error('A branch no GitHub mudou durante o preflight. Recomece.');
}
if (preflight.activeVersion !== activeDevVersion()) {
  throw new Error('O Worker dev mudou depois do preflight. Recomece.');
}

const deployment = spawnSync('npx', [
  '--no-install', 'wrangler', 'deploy', '--config', 'wrangler.dev.jsonc', '--strict',
  '--tag', `git-${sha}`, '--message', `jumper-web ${branch} ${sha} dev ${allowedSlug}`,
], { cwd: projectRoot, stdio: 'inherit' });
if (deployment.error) throw deployment.error;
if (deployment.status !== 0) process.exitCode = deployment.status || 1;
if (deployment.status === 0) {
  const after = await checkLiveBoundaries();
  if (after.differences.length || JSON.stringify(after.snapshot) !== JSON.stringify(preflight.liveSnapshot)) {
    throw new Error(`ATENÇÃO: uma área live mudou durante o deploy dev. Confira imediatamente hub, briefing, APIs e oficiais. ${after.differences.join('; ')}`);
  }
  console.log('Áreas live preservadas após o deploy dev. Confira também o site autorizado no navegador.');
}
