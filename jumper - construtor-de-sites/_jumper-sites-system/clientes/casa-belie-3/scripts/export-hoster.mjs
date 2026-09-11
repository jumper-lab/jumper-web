import { spawn } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(projectRoot, '../rodeio-restaurante/cloudflare/snapshots/casa-belie-3');
const port = 4393;
const origin = `http://127.0.0.1:${port}`;
const base = '/casabelie-3';
const routes = [
  '/',
  '/sobre/',
  '/festas/',
  '/espaco/',
  '/contato/',
  '/blog/',
  '/blog/por-que-a-casa-belie-nao-tem-telas/',
];

const server = spawn(process.execPath, ['dist/server/entry.mjs'], {
  cwd: projectRoot,
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let startupError = '';
server.stderr.on('data', (chunk) => { startupError += chunk; });

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${origin}${base}/`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`O servidor de exportação não iniciou. ${startupError}`);
}

try {
  await waitForServer();
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const route of routes) {
    const response = await fetch(`${origin}${base}${route}`);
    if (!response.ok) throw new Error(`Falha ao exportar ${route}: HTTP ${response.status}`);
    const target = route === '/' ? join(output, 'index.html') : join(output, route, 'index.html');
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, (await response.text()).replace(/[ \t]+$/gm, ''));
  }
  console.log(`Casa Beliê 3 exportada para o jumper-hoster: ${routes.length} páginas.`);
} finally {
  server.kill('SIGTERM');
}
