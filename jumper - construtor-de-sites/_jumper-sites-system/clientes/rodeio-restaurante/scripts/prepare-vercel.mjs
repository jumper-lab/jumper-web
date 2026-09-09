/**
 * Prepare the existing, validated static build for `vercel deploy --prebuilt`.
 * Does not build, deploy, authenticate, change indexing, or copy the workspace.
 * Usage: SITE_URL=https://rodeio-restaurante.vercel.app node scripts/prepare-vercel.mjs [--check]
 * API: https://vercel.com/docs/build-output-api/configuration
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const output = path.join(root, '.vercel', 'output');
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--check')) throw new Error('Argumento desconhecido. Use apenas --check para validar sem copiar.');
const checkOnly = args.includes('--check');
if (!process.env.SITE_URL) throw new Error('Defina SITE_URL com a origem HTTPS que foi usada no build.');
const site = new URL(process.env.SITE_URL);
if (site.protocol !== 'https:' || site.username || site.password || site.pathname !== '/' || site.search || site.hash || /^(localhost|127\.|0\.0\.0\.0|\[?::1\]?$)/i.test(site.hostname)) {
  throw new Error('SITE_URL deve ser uma origem pública HTTPS, sem caminho, credenciais ou parâmetros.');
}

const allowedExtensions = new Set(['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg', '.ico', '.woff', '.woff2', '.txt', '.xml', '.webmanifest']);
const textExtensions = new Set(['.html', '.css', '.js', '.svg', '.txt', '.xml', '.webmanifest']);
const forbiddenParts = /^(?:\..*|briefing|data|src|scripts|node_modules|originais|entrada)$/i;
const files = [];
async function collect(directory, relative = '') {
  for (const entry of await fs.readdir(directory, {withFileTypes: true})) {
    const rel = path.posix.join(relative, entry.name);
    if (forbiddenParts.test(entry.name) || entry.isSymbolicLink()) throw new Error(`Arquivo interno ou link simbólico em dist: ${rel}`);
    if (entry.isDirectory()) await collect(path.join(directory, entry.name), rel);
    else if (entry.isFile()) {
      if (!allowedExtensions.has(path.extname(entry.name).toLowerCase())) throw new Error(`Tipo de arquivo não autorizado no build: ${rel}`);
      if (rel.startsWith('_astro/') && !/\.[A-Za-z0-9_-]{6,}\./.test(entry.name)) throw new Error(`Asset sem fingerprint na pasta com cache immutable: ${rel}`);
      files.push(rel);
    } else throw new Error(`Entrada não regular em dist: ${rel}`);
  }
}
const distStat = await fs.lstat(dist);
if (!distStat.isDirectory() || distStat.isSymbolicLink()) throw new Error('dist deve ser um diretório real com o build estático.');
await collect(dist);
for (const required of ['index.html', '404.html', 'robots.txt', 'sitemap-index.xml']) {
  if (!files.includes(required)) throw new Error(`Build incompleto: ${required} ausente.`);
}
let pageCount = 0;
for (const relative of files) {
  const extension = path.extname(relative).toLowerCase();
  if (!textExtensions.has(extension)) continue;
  const text = await fs.readFile(path.join(dist, relative), 'utf8');
  if (/(?:https?:\/\/)(?:localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|\[::1\])(?=[:/\s"'<]|$)/i.test(text)) throw new Error(`URL local no artefato público: ${relative}`);
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) throw new Error(`Chave privada detectada no artefato: ${relative}`);
  if (extension === '.html') {
    pageCount++;
    const canonical = text.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
    if (!canonical || new URL(canonical).origin !== site.origin) throw new Error(`Canonical não corresponde a SITE_URL: ${relative}`);
    for (const match of text.matchAll(/<meta\b[^>]*property=["']og:(?:url|image)["'][^>]*content=["']([^"']+)["']/gi)) {
      if (new URL(match[1]).origin !== site.origin) throw new Error(`Open Graph não corresponde a SITE_URL: ${relative}`);
    }
  }
  if (relative.startsWith('sitemap') && extension === '.xml') {
    for (const match of text.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      if (new URL(match[1]).origin !== site.origin) throw new Error(`Sitemap não corresponde a SITE_URL: ${relative}`);
    }
  }
}

const settings = JSON.parse(await fs.readFile(path.join(root, 'vercel.json'), 'utf8'));
const routes = settings.headers.map(rule => ({
  src: rule.source,
  headers: Object.fromEntries(rule.headers.map(({key, value}) => [key, value])),
  continue: true,
}));
routes.push({handle: 'filesystem'}, {src: '/(.*)', status: 404, dest: '/404.html'});
const config = {version: 3, routes};
console.log(`Build validado: ${pageCount} páginas, ${files.length} arquivos; origem ${site.origin}. Indexação preservada conforme o build.`);
if (checkOnly) {
  console.log('Modo --check: nenhum arquivo de publicação foi criado ou alterado.');
  process.exit(0);
}

// Stage the complete package first; keep the previous package until copying succeeds.
const vercel = path.dirname(output);
await fs.mkdir(vercel, {recursive: true});
if ((await fs.lstat(vercel)).isSymbolicLink()) throw new Error('.vercel não pode ser um link simbólico.');
const stage = await fs.mkdtemp(path.join(vercel, 'output-staging-'));
try {
  const staticDir = path.join(stage, 'static');
  await fs.mkdir(staticDir);
  for (const relative of files) {
    const source = path.join(dist, relative);
    if (!(await fs.lstat(source)).isFile()) throw new Error(`Arquivo alterado durante preparação: ${relative}`);
    const destination = path.join(staticDir, relative);
    await fs.mkdir(path.dirname(destination), {recursive: true});
    await fs.copyFile(source, destination);
  }
  await fs.writeFile(path.join(stage, 'config.json'), JSON.stringify(config, null, 2) + '\n');
  try {
    if ((await fs.lstat(output)).isSymbolicLink()) throw new Error('.vercel/output não pode ser um link simbólico.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await fs.rm(output, {recursive: true, force: true});
  await fs.rename(stage, output);
  console.log('Pacote preparado em .vercel/output, somente com arquivos públicos de dist/. Nenhum deploy executado.');
} catch (error) {
  await fs.rm(stage, {recursive: true, force: true});
  throw error;
}
