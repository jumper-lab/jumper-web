import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const projects = [
  {
    slug: 'casabelie',
    snapshot: 'casa-belie',
    production: 'https://casa-belie-923c9fi4v-jumper-studios-projects-2fd4229e.vercel.app',
    routes: ['/', '/sobre/', '/festas/', '/espaco/', '/novidades/', '/blog/', '/blog/por-que-uma-festa-sem-telas-cria-memorias/', '/blog/como-escolher-uma-casa-de-festas-em-laranjeiras/', '/contato/', '/politica-de-privacidade/'],
  },
  {
    slug: 'casabelie-2',
    snapshot: 'casa-belie-2',
    production: 'https://casa-belie-2-mc9j18431-jumper-studios-projects-2fd4229e.vercel.app',
    routes: ['/', '/sobre/', '/festas/', '/espaco/', '/blog/', '/blog/por-que-a-casa-belie-nao-tem-telas/', '/contato/'],
  },
];

function prefixPublicPaths(html, slug) {
  const publicRoots = ['_astro', '_image', 'images', 'videos', 'favicon.png', 'apple-touch-icon.png', 'icon-512.png', 'og.png', 'sobre', 'festas', 'espaco', 'novidades', 'blog', 'contato', 'politica-de-privacidade'];
  for (const root of publicRoots) {
    const escaped = root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`([\\s\\"'=,(])/${escaped}`, 'g'), `$1/${slug}/${root}`);
  }
  return html.replaceAll('href="/"', `href="/${slug}/"`);
}

function normalizeText(contents) {
  return `${contents.split('\n').map((line) => line.trimEnd()).join('\n').trimEnd()}\n`;
}

for (const project of projects) {
  const outputRoot = join(projectRoot, 'cloudflare', 'snapshots', project.snapshot);
  for (const route of project.routes) {
    const response = await fetch(`${project.production}${route}`);
    if (!response.ok) throw new Error(`Falha ao capturar ${project.slug}${route}: ${response.status}`);
    const relative = route === '/' ? 'index.html' : join(route.slice(1), 'index.html');
    const destination = join(outputRoot, relative);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, normalizeText(prefixPublicPaths(await response.text(), project.slug)));
  }
  console.log(`${project.slug}: ${project.routes.length} páginas capturadas da Vercel.`);
}
