import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { activeVersion, runPreflight } from './preflight-hoster.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(projectRoot, '../../../..');
const git = (...args) => execFileSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' }).trim();

if (git('branch', '--show-current') !== 'main') throw new Error('Deploy permitido somente de main.');
if (git('status', '--porcelain', '--untracked-files=normal')) {
  throw new Error('Há arquivos locais alterados ou não rastreados. Faça o deploy de um checkout limpo.');
}
const sha = git('rev-parse', 'HEAD');
if (sha !== git('ls-remote', 'origin', 'refs/heads/main').split(/\s+/)[0]) {
  throw new Error('O main local não corresponde ao GitHub. Atualize o checkout.');
}

// The prior npm preflight is intentional; repeat it immediately before upload.
const result = await runPreflight();
if (result.differences.length) throw new Error(`Preflight bloqueou o deploy:\n${result.differences.join('\n')}`);
if (sha !== git('ls-remote', 'origin', 'refs/heads/main').split(/\s+/)[0]) {
  throw new Error('O GitHub main mudou durante a verificação. Recomece o deploy.');
}
const immediatelyBefore = await activeVersion();
if (immediatelyBefore.versionId !== result.activeVersion) {
  throw new Error('Outro deploy alterou o Worker depois do preflight. Recomece o deploy.');
}

const deployment = spawnSync('npx', [
  '--no-install', 'wrangler', 'deploy', '--strict', '--tag', `git-${sha}`,
  '--message', `jumper-web main ${sha}`,
], { cwd: projectRoot, stdio: 'inherit' });
if (deployment.error) throw deployment.error;
if (deployment.status !== 0) process.exitCode = deployment.status || 1;
