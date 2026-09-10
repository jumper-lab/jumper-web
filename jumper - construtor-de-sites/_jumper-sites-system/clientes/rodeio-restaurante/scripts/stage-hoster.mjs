import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(projectRoot, 'dist');
const target = join(projectRoot, 'hoster-dist');
const clientTarget = join(target, 'rodeio');
const fontsTarget = join(target, 'fonts');
const iziSource = join(projectRoot, 'cloudflare', 'snapshots', 'izigym');
const iziTarget = join(target, 'izigym');
const belieSource = resolve(projectRoot, '../casa-belie/public');
const beliePages = join(projectRoot, 'cloudflare', 'snapshots', 'casa-belie');
const belieTarget = join(target, 'casabelie');
const belie2Source = resolve(projectRoot, '../casa-belie-2/public');
const belie2Pages = join(projectRoot, 'cloudflare', 'snapshots', 'casa-belie-2');
const belie2Target = join(target, 'casabelie-2');

const textExtensions = new Set(['.html', '.css', '.js', '.mjs', '.xml', '.txt', '.webmanifest']);

async function rewriteTree(root, replacements) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      await rewriteTree(path, replacements);
    } else if (textExtensions.has(extname(entry.name))) {
      let contents = await readFile(path, 'utf8');
      for (const [from, to] of replacements) contents = contents.replaceAll(from, to);
      await writeFile(path, contents);
    }
  }
}

await rm(target, { recursive: true, force: true });
await mkdir(clientTarget, { recursive: true });
await cp(source, clientTarget, { recursive: true });
await cp(join(projectRoot, 'cloudflare', 'fonts'), fontsTarget, { recursive: true });
await cp(iziSource, iziTarget, { recursive: true });
await rewriteTree(iziTarget, [
  ['/cdn-cgi/', '/izigym/cdn-cgi/'],
  ['/assets/', '/izigym/assets/'],
  ['/images/', '/izigym/images/'],
  ['/brand/', '/izigym/brand/'],
  ['/favicon.png', '/izigym/favicon.png'],
  ['/placeholder.svg', '/izigym/placeholder.svg'],
]);
await cp(belieSource, belieTarget, { recursive: true });
await cp(beliePages, belieTarget, { recursive: true });
await cp(
  join(projectRoot, 'cloudflare', 'snapshots', 'festa-belie-momento-2.mp4'),
  join(belieTarget, 'videos', 'festa-belie-momento-2.mp4'),
);
await cp(belie2Source, belie2Target, { recursive: true });
await cp(belie2Pages, belie2Target, { recursive: true });

const dashboard = await readFile(join(projectRoot, 'cloudflare', 'dashboard.html'), 'utf8');
const registry = JSON.parse(await readFile(resolve(projectRoot, '../../jumper-hoster.registry.json'), 'utf8'));
for (const site of registry.sites) {
  if (!dashboard.includes(`href="/${site.slug}/"`)) {
    throw new Error(`O site ${site.slug} está no registro, mas não possui card no hub.`);
  }
  await readFile(join(target, site.slug, 'index.html'));
}
await writeFile(join(target, 'index.html'), dashboard);
await writeFile(join(target, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

console.log('Jumper Hoster preparado: Rodeio, IZI Gym e duas versões da Casa Beliê.');
