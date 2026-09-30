import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listSiteAssets, parseAllowedSlugs } from './preflight-hoster-dev.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const slug = parseAllowedSlugs(process.argv.slice(2));
const filename = join(projectRoot, 'config/dev-site-inventory.json');
const inventory = JSON.parse(await readFile(filename, 'utf8'));
inventory[slug] = await listSiteAssets(join(projectRoot, 'hoster-dist'), slug);
await writeFile(filename, `${JSON.stringify(inventory, null, 2)}\n`);
console.log(`Inventário do site ${slug} atualizado. Revise seu diff antes da PR; nenhum deploy foi feito.`);
