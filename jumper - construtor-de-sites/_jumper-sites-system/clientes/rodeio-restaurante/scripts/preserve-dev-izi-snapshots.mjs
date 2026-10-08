import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { developmentSlugs } from '../cloudflare/dev-worker.mjs';
import { parseAllowedSlugs } from './preflight-hoster-dev.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const snapshotRoot = join(projectRoot, 'cloudflare/snapshots/izi-dev-preserved-2026-10-08');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const preservedSlugs = ['izigym-lp', 'izigym-lp-vilaromana'];

function scopedPath(root, name, slug) {
  if (!preservedSlugs.includes(slug) || typeof name !== 'string' || !name.startsWith(`${slug}/`) || name.split('/').some(part => !part || part === '.' || part === '..') || name.includes('\\')) {
    throw new Error(`Caminho inválido no snapshot dev: ${name}`);
  }
  return join(root, name);
}

export async function preserveDevIziSnapshots({ root, snapshots, manifest, allowedSlug }) {
  if (allowedSlug !== null && !developmentSlugs.includes(allowedSlug)) throw new Error('Slug dev não autorizado.');
  const replacements = manifest.replacements.filter(record => record.slug !== allowedSlug);
  const removals = manifest.remove.filter(record => record.slug !== allowedSlug);
  const prepared = [];
  // Validate every source and generated candidate before modifying the build.
  for (const record of replacements) {
    const target = scopedPath(root, record.path, record.slug);
    const source = scopedPath(snapshots, record.snapshot, record.slug);
    const bytes = await readFile(source);
    if (digest(bytes) !== record.snapshotSha256) throw new Error(`Snapshot dev alterado: ${record.path}`);
    try {
      const candidate = digest(await readFile(target));
      if (candidate !== record.generatedSha256 && candidate !== record.snapshotSha256) throw new Error(`Build não reconhecido: ${record.path}`);
    } catch (error) {
      if (error.code !== 'ENOENT' || record.generatedSha256 !== null) throw error;
    }
    prepared.push({ target, bytes });
  }
  const toRemove = [];
  for (const record of removals) {
    const target = scopedPath(root, record.path, record.slug);
    try {
      if (digest(await readFile(target)) !== record.generatedSha256) throw new Error(`Asset não reconhecido: ${record.path}`);
      toRemove.push(target);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  for (const { target, bytes } of prepared) { await mkdir(dirname(target), { recursive: true }); await writeFile(target, bytes); }
  for (const target of toRemove) await rm(target);
  return { replacements: prepared.length, removals: toRemove.length, allowedSlug };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const allowedSlug = args.length === 1 && args[0] === '--worker-only' ? null : parseAllowedSlugs(args);
    const manifest = JSON.parse(await readFile(join(snapshotRoot, 'manifest.json'), 'utf8'));
    const result = await preserveDevIziSnapshots({ root: join(projectRoot, 'hoster-dist'), snapshots: snapshotRoot, manifest, allowedSlug });
    console.log(`Build dev: ${result.replacements} arquivos das prévias IZI preservados; ${result.removals} assets exclusivos da versão oficial retirados das prévias. Preflight estrito continua obrigatório.`);
  } catch (error) { console.error(`Build dev bloqueado: ${error.message}`); process.exitCode = 1; }
}
