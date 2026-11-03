import {createHash} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const project = fileURLToPath(new URL('../',import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function inventory(root, prefixes=['_official/izigym','cerrocora']) {
  const result={};
  async function visit(path) {
    for(const entry of await readdir(resolve(root,path),{withFileTypes:true})) {
      const name=path+'/'+entry.name;
      if(entry.isDirectory()) await visit(name);
      else if(entry.isFile()) result[name]=hash(await readFile(resolve(root,name)));
      else throw new Error('Asset não regular: '+name);
    }
  }
  for(const prefix of prefixes) await visit(prefix);
  return Object.fromEntries(Object.entries(result).sort());
}
export async function validateIziRelease(root=resolve(project,'hoster-dist'), releaseName='izi-official-2026-11-01') {
  if (!['izi-official-2026-11-01','cerrocora-bioimpedancia-2026-11-03'].includes(releaseName)) throw new Error('Revisão IZI desconhecida.');
  const release=JSON.parse(await readFile(resolve(project,`data/releases/${releaseName}.json`)));
  if(JSON.stringify(await inventory(root))!==JSON.stringify(release.assets)) throw new Error('Pacote oficial difere da revisão: assets adicionados, removidos ou alterados.');
  // The historical two-site promotion required matching dev and official plans.
  // A Cerro-only release pins both official bundles without promoting dev changes.
  if (releaseName === 'izi-official-2026-11-01') for(const relative of ['src/data/plans.ts','src/components/gym/FAQSection.tsx']) {
    const a=await readFile(resolve(project,'../izigym-site',relative),'utf8');
    const b=await readFile(resolve(project,'../izigym-site-dev',relative),'utf8');
    if(a.replaceAll('\r\n','\n')!==b.replaceAll('\r\n','\n')) throw new Error('Ajuste dev não promovido: '+relative);
  }
  const bytes=await readFile(resolve(project,'../izigym-lp/src/pages/simple.astro'));
  if(hash(bytes)!==release.lpSourceSha256) throw new Error('Fonte oficial da LP difere da revisão.');
  console.log('Pacote IZI corresponde ao manifesto revisado.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const flags=process.argv.slice(2);
  if (flags.length>1 || flags.some(flag=>!flag.startsWith('--release='))) throw new Error('Argumento de revisão inválido.');
  await validateIziRelease(undefined, flags[0]?.slice('--release='.length));
}
