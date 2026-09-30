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
const iziOfficialSource = join(projectRoot, 'cloudflare', 'snapshots', 'izigym-official');
const iziOfficialTarget = join(target, '_official', 'izigym');
const belieSource = resolve(projectRoot, '../casa-belie/public');
const beliePages = join(projectRoot, 'cloudflare', 'snapshots', 'casa-belie');
const belieTarget = join(target, 'casabelie');
const belie2Source = resolve(projectRoot, '../casa-belie-2/public');
const belie2Pages = join(projectRoot, 'cloudflare', 'snapshots', 'casa-belie-2');
const belie2Target = join(target, 'casabelie-2');
const belie3Source = resolve(projectRoot, '../casa-belie-3/public');
const belie3Pages = join(projectRoot, 'cloudflare', 'snapshots', 'casa-belie-3');
const belie3Target = join(target, 'casabelie-3');
const briefingSource = resolve(projectRoot, '../../Quiz/Briefings');
const briefingTarget = join(target, 'briefing');
const iziLandingSource = resolve(projectRoot, '../izigym-lp/dist');
const iziLandingTarget = join(target, 'izigym-lp');
const iziVilaRomanaTarget = join(target, 'izigym-lp-vilaromana');
const iziCerroCoraTarget = join(target, 'cerrocora');

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
await cp(iziOfficialSource, iziOfficialTarget, { recursive: true });
await writeFile(
  join(iziOfficialTarget, 'index.shell'),
  await readFile(join(iziOfficialTarget, 'index.html')),
);
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
await cp(belie3Source, belie3Target, { recursive: true });
await cp(belie3Pages, belie3Target, { recursive: true });
await mkdir(briefingTarget, { recursive: true });
for (const file of ['index.html', 'styles.css', 'quiz.js']) {
  await cp(join(briefingSource, file), join(briefingTarget, file));
}
await cp(join(briefingSource, 'index.html'), join(target, 'briefing-page.shell'));
await cp(join(briefingSource, 'assets'), join(briefingTarget, 'assets'), { recursive: true });

// Keep the already published Vila Romana landing in the shared Worker asset bundle.
await cp(iziLandingSource, iziLandingTarget, { recursive: true });
await cp(iziLandingSource, iziVilaRomanaTarget, { recursive: true });
await rewriteTree(iziVilaRomanaTarget, [
  ['/izigym-lp/', '/izigym-lp-vilaromana/'],
]);
await cp(join(iziVilaRomanaTarget, 'simple', 'index.html'), join(iziVilaRomanaTarget, 'index.html'));
await mkdir(iziCerroCoraTarget, { recursive: true });
const cerroCoraHtml = await readFile(join(iziVilaRomanaTarget, 'index.html'), 'utf8');
await writeFile(
  join(iziCerroCoraTarget, 'index.html'),
  cerroCoraHtml.replaceAll('https://site.jumper.dev.br/izigym-lp-vilaromana/', 'https://cerrocora.izigym.com.br/'),
);

const registry = JSON.parse(await readFile(resolve(projectRoot, '../../jumper-hoster.registry.json'), 'utf8'));
for (const client of registry.clients) {
  for (const site of client.developmentSites) {
    if (site.url !== `https://site.jumper.dev.br/${site.slug}/`) {
      throw new Error(`A URL de desenvolvimento de ${site.slug} não corresponde ao slug registrado.`);
    }
    await readFile(join(target, site.slug, 'index.html'));
  }
}
await writeFile(join(target, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

console.log(`Jumper Hoster preparado: ${registry.clients.reduce((total, client) => total + client.developmentSites.length, 0)} sites em desenvolvimento e IZI Gym oficial. Hub publicado separadamente.`);
