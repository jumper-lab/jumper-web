import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {preserveDevIziSnapshots} from './preserve-dev-izi-snapshots.mjs';
import {stageRodeioWordPressPreview} from './stage-rodeio-wordpress-preview.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
export async function stageIziRelease() {
  const root = resolve(project, 'hoster-dist');
  // Keep the compiled official Clixx form. Its JS/CSS must survive the
  // restoration of the independently maintained development landing pages.
  let official = await readFile(resolve(root, 'cerrocora/index.html'), 'utf8');
  const assets = [...new Set([...official.matchAll(/(?:src|href)="(\/izigym-lp-vilaromana\/_astro\/[\w.-]+)"/g)].map(match => match[1]))];
  if (assets.length !== 2) throw new Error('Cerro Corá: esperado um módulo e uma folha de estilos oficiais.');
  await mkdir(resolve(root, 'cerrocora/_astro'), {recursive:true});
  for (const asset of assets) {
    const destination = asset.replace('/izigym-lp-vilaromana/', '/cerrocora/');
    await writeFile(resolve(root, destination.slice(1)), await readFile(resolve(root, asset.slice(1))));
    official = official.replaceAll(asset, destination);
  }
  await writeFile(resolve(root, 'cerrocora/index.html'), official);
  const snapshots = resolve(project, 'cloudflare/snapshots/izi-dev-preserved-2026-10-08');
  const manifest = JSON.parse(await readFile(resolve(snapshots, 'manifest.json')));
  await preserveDevIziSnapshots({root, snapshots, manifest, allowedSlug:null});
  const wordpress = resolve(project, 'wordpress/public-preview');
  await stageRodeioWordPressPreview({root, snapshot:wordpress, manifest:JSON.parse(await readFile(resolve(wordpress,'manifest.json')))});
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await stageIziRelease();
