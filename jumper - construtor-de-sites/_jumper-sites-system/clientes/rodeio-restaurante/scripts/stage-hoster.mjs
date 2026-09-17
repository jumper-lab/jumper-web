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
await cp(join(projectRoot, 'cloudflare', 'favicon-jumper.png'), join(target, 'favicon-jumper.png'));
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

const dashboardTemplate = await readFile(join(projectRoot, 'cloudflare', 'dashboard.html'), 'utf8');
const registry = JSON.parse(await readFile(resolve(projectRoot, '../../jumper-hoster.registry.json'), 'utf8'));

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const cards = [];
for (const client of registry.clients) {
  const links = [];
  for (const site of client.developmentSites) {
    if (site.url !== `https://site.jumper.dev.br/${site.slug}/`) {
      throw new Error(`A URL de desenvolvimento de ${site.slug} não corresponde ao slug registrado.`);
    }
    await readFile(join(target, site.slug, 'index.html'));
    links.push({ label: site.label, url: `/${site.slug}/`, external: false });
  }
  for (const resource of client.resourceLinks ?? []) {
    const resourceUrl = new URL(resource.url);
    if (resourceUrl.protocol !== 'https:') throw new Error(`O recurso de ${client.name} precisa usar HTTPS.`);
    links.push({ label: resource.label, url: resourceUrl.href, external: true });
  }
  if (client.officialSite) {
    const officialUrl = new URL(client.officialSite.url);
    if (officialUrl.protocol !== 'https:') throw new Error(`O site oficial de ${client.name} precisa usar HTTPS.`);
    links.push({ label: client.officialSite.label, url: officialUrl.href, external: true });
  }
  const linksData = escapeHtml(JSON.stringify(links));
  cards.push(`<article class="card" style="--project:${escapeHtml(client.accent)}"><button class="card-open" type="button" aria-haspopup="dialog" aria-controls="client-links-dialog" data-client="${escapeHtml(client.name)}" data-category="${escapeHtml(client.category)}" data-accent="${escapeHtml(client.accent)}" data-links="${linksData}"><span class="tag">${escapeHtml(client.category)}</span><h2>${escapeHtml(client.name)}</h2><p class="description">${escapeHtml(client.description)}</p><span class="card-action"><span>Abrir links</span><span class="arrow" aria-hidden="true">→</span></span></button></article>`);
}
const dashboard = dashboardTemplate.replace('<!-- JUMPER_CLIENT_CARDS -->', cards.join('\n'));
if (dashboard === dashboardTemplate) throw new Error('O marcador de cards não foi encontrado no template do hub.');
await writeFile(join(target, 'index.html'), dashboard);
await writeFile(join(target, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

console.log(`Jumper Hoster preparado: ${registry.clients.length} clientes, ${registry.clients.reduce((total, client) => total + client.developmentSites.length, 0)} sites em desenvolvimento e IZI Gym oficial.`);
