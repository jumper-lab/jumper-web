import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import seo from '../data/seo.json' with { type: 'json' };
import { createHash } from 'node:crypto';

const option = name => process.argv.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const sha = spawnSync('git', ['rev-parse', '--short=12', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
const release = option('release') || `git-${sha}`;
if (!/^[a-z0-9-]{1,64}$/.test(release)) throw new Error('Invalid release identifier');
const output = path.resolve(option('output') || `/tmp/rodeio-wordpress-${release}`);
const build = process.argv.includes('--skip-build') ? { status: 0 } : spawnSync('npm', ['run', 'build'], { stdio: 'inherit', env: { ...process.env, SITE_URL: 'https://rodeiosp.com.br', BASE_PATH: '/', PUBLIC_LIVE_SITE: 'true' } });
if (build.status !== 0) process.exit(build.status || 1);
await fs.mkdir(output, { recursive: true });
const root = path.join(output, 'rodeio-2026');
const releaseRoot = path.join(root, 'releases', release);
const siteRoot = path.join(releaseRoot, 'site');
const pagesRoot = path.join(releaseRoot, 'pages');
await fs.mkdir(siteRoot, { recursive: true });
await fs.mkdir(pagesRoot, { recursive: true });
const prefix = `/wp-content/themes/rodeio-2026/releases/${release}/site`;
const assetDirs = ['_astro', 'photos', 'logos', 'fonts', 'cardapio-paginas'];
const assetFiles = ['cardapio-rodeio.pdf', 'og.jpg', 'logo.png', 'favicon.ico', 'apple-touch-icon.png'];
function rewrite(value) {
  for (const folder of assetDirs) value = value.replaceAll(`/${folder}/`, `${prefix}/${folder}/`);
  for (const file of assetFiles) value = value.replaceAll(`https://rodeiosp.com.br/${file}`, `https://rodeiosp.com.br${prefix}/${file}`).replace(new RegExp(`(?<![\\w/.-])/${file.replaceAll('.', '\\.')}\\b`, 'g'), `${prefix}/${file}`);
  return value.replaceAll('action="/api/eventos"', 'action="/wp-json/rodeio/v1/eventos"').replaceAll('action="/api/contato"', 'action="/wp-json/rodeio/v1/contato"');
}
const manifest = { release, sourceCommit: spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim(), files: {}, routes: {} };
async function write(target, bytes) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, bytes);
  const relative = path.relative(root, target).split(path.sep).join('/');
  manifest.files[relative] = { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}
async function visit(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const source = path.join(directory, entry.name);
    if (entry.isDirectory()) { await visit(source); continue; }
    const relative = path.relative('dist', source).split(path.sep).join('/');
    if (relative.endsWith('.html')) {
      if (relative === '404.html') continue;
      const route = relative === 'index.html' ? '' : relative.replace(/\/index\.html$/, '');
      const filename = route ? route.replaceAll('/', '--') + '.html.gz' : 'home.html.gz';
      const html = rewrite(await fs.readFile(source, 'utf8'));
      const expectedNoindex = route === 'em-breve' || seo.pages[route ? `/${route}/` : '/']?.index === false;
      if ((/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/.test(html) !== expectedNoindex) || /http:\/\/localhost|site\.jumper\.dev\.br|action="\/api\//.test(html)) throw new Error(`Preview reference in ${relative}`);
      await write(path.join(pagesRoot, filename), gzipSync(html, { level: 9 }));
      manifest.routes[route] = filename;
    } else if (!['robots.txt', 'sitemap-index.xml', 'sitemap-0.xml'].includes(relative)) {
      let bytes = await fs.readFile(source);
      if (/\.(?:js|css|svg)$/.test(relative)) bytes = Buffer.from(rewrite(bytes.toString('utf8')));
      await write(path.join(siteRoot, relative), bytes);
    }
  }
}
await visit('dist');
const business = { ...seo, organization: null, restaurants: {} };
for (const [route, filename] of Object.entries(manifest.routes)) {
  const { gunzipSync } = await import('node:zlib');
  const html = gunzipSync(await fs.readFile(path.join(pagesRoot, filename))).toString();
  const match = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
  if (!match) continue;
  const graph = JSON.parse(match[1])['@graph'] || [];
  if (route === '') business.organization = graph.find(node => node['@type'] === 'Organization');
  const restaurant = graph.find(node => node['@type'] === 'Restaurant');
  if (restaurant) business.restaurants[`/${route}/`] = restaurant;
}
if (!business.organization || Object.keys(business.restaurants).length !== 2) throw new Error('Missing business schema');
await write(path.join(releaseRoot, 'seo.json'), Buffer.from(JSON.stringify(business, null, 2)));
for (const name of ['functions.php', 'seo.php', 'index.php', 'style.css']) {
  let source = await fs.readFile(path.join('wordpress', name), 'utf8');
  source = source.replaceAll('__RELEASE__', release);
  await write(path.join(root, name), Buffer.from(source));
}
const functions = await fs.readFile(path.join(root, 'functions.php'), 'utf8');
for (const route of Object.keys(manifest.routes)) if (!functions.includes(`'${route}' =>`)) throw new Error(`Missing WordPress route: ${route}`);
await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`WordPress package: ${root}; ${Object.keys(manifest.routes).length} routes, ${Object.keys(manifest.files).length} files`);
