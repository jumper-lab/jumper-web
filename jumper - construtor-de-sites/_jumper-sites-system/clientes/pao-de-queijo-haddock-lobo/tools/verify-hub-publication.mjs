import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const build = process.env.JUMPER_HUB_BUILD || join(root, 'dist');
const origin = 'https://site.jumper.dev.br';
const prefix = '/pao-de-queijo-haddock-lobo/';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { date: new Date().toISOString(), url: origin + prefix, assets: [], errors: [] };
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.isFile()) files.push(relative(build, path).split(sep).join('/'));
    else throw new Error(`Arquivo não regular: ${path}`);
  }
}
async function get(path) {
  let url = new URL(prefix + path, origin);
  for (let count = 0; count < 5; count += 1) {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(30000), headers: { 'Cache-Control': 'no-cache' } });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const next = new URL(response.headers.get('Location'), url);
    if (next.origin !== origin || !next.pathname.startsWith(prefix)) throw new Error('Redirecionamento fora do preview');
    url = next;
  }
  throw new Error('Redirecionamentos demais');
}
await walk(build);
let index = 0;
async function compare() {
  while (index < files.length) {
    const path = files[index++];
    try {
      const response = await get(path);
      if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
      if (response.headers.get('X-Jumper-Worker') !== 'jumper-hoster-dev') throw new Error('Worker incorreto');
      const bytes = Buffer.from(await response.arrayBuffer());
      const expected = await readFile(join(build, path));
      if (digest(bytes) !== digest(expected)) throw new Error('Bytes diferentes do build aprovado');
      if (path.endsWith('.html') && !response.headers.get('X-Robots-Tag')?.includes('noindex')) throw new Error('Preview indexável');
      report.assets.push({ path, bytes: bytes.length, sha256: digest(bytes), status: response.status });
    } catch (error) { report.errors.push(`${path}: ${error.message}`); }
  }
}
await Promise.all(Array.from({ length: 8 }, compare));
for (const path of ['', 'sobre/', 'lojas/', 'menu/']) {
  try {
    const response = await get(path);
    const html = await response.text();
    if (response.status !== 200 || !html.includes(`rel="canonical" href="${origin}${prefix}${path}"`)) throw new Error('Rota ou canonical incorreto');
    if (!html.includes('name="robots" content="noindex,follow"')) throw new Error('Meta noindex ausente');
  } catch (error) { report.errors.push(`${path || '/'}: ${error.message}`); }
}
report.assets.sort((a, b) => a.path.localeCompare(b.path));
report.status = report.errors.length ? 'failed' : 'passed';
const output = join(root, 'data/visual-review/hub-publication');
await mkdir(output, { recursive: true });
await writeFile(join(output, 'public-assets-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, files: report.assets.length, url: report.url, errors: report.errors }, null, 2));
if (report.errors.length) process.exitCode = 1;
