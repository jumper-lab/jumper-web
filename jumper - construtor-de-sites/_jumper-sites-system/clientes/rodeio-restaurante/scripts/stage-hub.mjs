import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(projectRoot, 'hub-dist');
const publicAssets = join(target, 'hub-assets');
const registry = JSON.parse(await readFile(resolve(projectRoot, '../../jumper-hoster.registry.json'), 'utf8'));
const template = await readFile(join(projectRoot, 'cloudflare/dashboard.html'), 'utf8');

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const cards = [];
for (const client of registry.clients) {
  if (typeof client.sourceLabel !== 'string' || !client.sourceLabel.trim()) {
    throw new Error(`A origem de ${client.name} não foi informada para o hub.`);
  }
  const links = [];
  for (const site of client.developmentSites) {
    if (site.url !== `https://site.jumper.dev.br/${site.slug}/`) {
      throw new Error(`A URL de desenvolvimento de ${site.slug} não corresponde ao slug registrado.`);
    }
  }
  if (client.hubLinks) {
    for (const item of client.hubLinks) {
      if (item.slug) {
        if (!client.developmentSites.some((site) => site.slug === item.slug)) {
          throw new Error(`O link ${item.slug} não corresponde a um site de desenvolvimento de ${client.name}.`);
        }
        links.push({ label: item.label, url: `/${item.slug}/`, external: false });
      } else {
        const linkUrl = new URL(item.url);
        if (linkUrl.protocol !== 'https:') throw new Error(`O link de ${client.name} precisa usar HTTPS.`);
        links.push({ label: item.label, url: linkUrl.href, external: true });
      }
    }
  } else {
    for (const site of client.developmentSites) {
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
  }
  const linksData = escapeHtml(JSON.stringify(links));
  cards.push(`<article class="card" style="--project:${escapeHtml(client.accent)}"><button class="card-open" type="button" aria-haspopup="dialog" aria-controls="client-links-dialog" data-client="${escapeHtml(client.name)}" data-category="${escapeHtml(client.category)}" data-accent="${escapeHtml(client.accent)}" data-links="${linksData}"><span class="tag">${escapeHtml(client.sourceLabel)}</span><h2>${escapeHtml(client.name)}</h2><span class="card-action"><span>Abrir links</span><span class="arrow" aria-hidden="true">→</span></span></button></article>`);
}

const dashboard = template.replace('<!-- JUMPER_CLIENT_CARDS -->', cards.join('\n'));
if (dashboard === template) throw new Error('O marcador de cards não foi encontrado no template do hub.');

await rm(target, { recursive: true, force: true });
await mkdir(publicAssets, { recursive: true });
await cp(join(projectRoot, 'cloudflare', 'favicon-jumper.png'), join(publicAssets, 'favicon-jumper.png'));
await cp(join(projectRoot, 'cloudflare', 'design-system', '3.15.0'), join(publicAssets, 'hub-design-system', '3.15.0'), { recursive: true });
await cp(join(projectRoot, 'cloudflare', 'hub-redesign.css'), join(publicAssets, 'hub-redesign.css'));
await writeFile(join(target, 'index.html'), dashboard);
console.log(`Hub preparado separadamente: ${registry.clients.length} cards.`);
