import { spawn, execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = resolve(projectRoot, '../../../..');
const operationsBinding = 'JUMPER_HUB_OPERATIONS';
const mode = process.argv[2];
const suppliedFlags = process.argv.slice(3);
if (!['live', 'dev', 'dev-worker'].includes(mode)) throw new Error('Modo de deploy inválido.');
if (mode !== 'dev' && suppliedFlags.length) throw new Error('Este modo não aceita flags adicionais.');
const worker = mode === 'live' ? 'jumper-hoster' : 'jumper-hoster-dev';
const flags = mode === 'dev-worker' ? ['--worker-only'] : suppliedFlags;
const key = `deploy/${worker}/${randomUUID()}`;
const commitSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).trim();
const startedAt = new Date().toISOString();
let phase = 'Preparando o pacote';
let writes = Promise.resolve();
let reportedHeartbeatFailure = false;

function command(binary, args, { quiet = false } = {}) {
  return new Promise((resolveCommand, reject) => {
    const child = spawn(binary, args, { cwd: projectRoot, stdio: quiet ? 'ignore' : 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolveCommand() : reject(new Error(`${binary} ${args[0]} terminou com código ${code}.`)));
  });
}

function updateMarker() {
  const value = JSON.stringify({ source: worker, phase, startedAt, updatedAt: new Date().toISOString(), commitSha });
  writes = writes.catch(() => {}).then(() => command('npx', [
    '--no-install', 'wrangler', 'kv', 'key', 'put', key, value,
    '--binding', operationsBinding, '--config', 'wrangler.jsonc', '--remote', '--ttl', '180',
  ], { quiet: true }));
  return writes;
}

async function stage(label, binary, args) {
  phase = label;
  await updateMarker();
  await command(binary, args);
}

async function main() {
  await updateMarker();
  const heartbeat = setInterval(() => {
    updateMarker().catch(() => {
      if (!reportedHeartbeatFailure) console.error('Atenção: a Sala de Máquinas não recebeu uma atualização deste deploy.');
      reportedHeartbeatFailure = true;
    });
  }, 45_000);
  try {
    await stage('Gerando o pacote', 'npm', ['run', 'build:cloudflare']);
    await stage('Conferindo páginas e versões antes da publicação', 'node', [
      mode === 'live' ? 'scripts/preflight-hoster.mjs' : 'scripts/preflight-hoster-dev.mjs', ...flags,
    ]);
    await stage('Publicando na Cloudflare', 'node', [
      mode === 'live' ? 'scripts/deploy-hoster.mjs' : 'scripts/deploy-hoster-dev.mjs', ...flags,
    ]);
    await stage('Verificando a publicação', 'node', [
      mode === 'live' ? 'scripts/preflight-hoster.mjs' : 'scripts/preflight-hoster-dev.mjs', '--audit', ...flags,
    ]);
  } finally {
    clearInterval(heartbeat);
    await writes.catch(() => {});
    await command('npx', ['--no-install', 'wrangler', 'kv', 'key', 'delete', key,
      '--binding', operationsBinding, '--config', 'wrangler.jsonc', '--remote'], { quiet: true }).catch(() => {
      console.error('Atenção: marcador temporário não pôde ser removido; ele expira automaticamente.');
    });
  }
}

main().catch((error) => { console.error(`Deploy interrompido: ${error.message}`); process.exitCode = 1; });
