import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareCerroCoraTracking} from './prepare-cerrocora-tracking.mjs';
import {preserveDevIziSnapshots} from './preserve-dev-izi-snapshots.mjs';
import {stageRodeioWordPressPreview} from './stage-rodeio-wordpress-preview.mjs';

const project = fileURLToPath(new URL('../', import.meta.url));
export async function stageIziRelease() {
  const root = resolve(project, 'hoster-dist');
  const snapshots = resolve(project, 'cloudflare/snapshots/izi-dev-preserved-2026-10-08');
  const manifest = JSON.parse(await readFile(resolve(snapshots, 'manifest.json')));
  await preserveDevIziSnapshots({root, snapshots, manifest, allowedSlug:null});
  const wordpress = resolve(project, 'wordpress/public-preview');
  await stageRodeioWordPressPreview({root, snapshot:wordpress, manifest:JSON.parse(await readFile(resolve(wordpress,'manifest.json')))});
  // Promote the reviewed development LP, preserving the official tracking kit.
  const source = await readFile(resolve(root,'izigym-lp-vilaromana/index.html'),'utf8');
  const tracking = JSON.parse(await readFile(resolve(project,'../izigym-lp/data/cerrocora-tracking.json')));
  const official = prepareCerroCoraTracking(source,tracking)
    .replaceAll('https://site.jumper.dev.br/izigym-lp-vilaromana/','https://cerrocora.izigym.com.br/');
  await writeFile(resolve(root,'cerrocora/index.html'),official);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await stageIziRelease();
