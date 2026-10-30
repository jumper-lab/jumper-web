import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const hash=b=>createHash('sha256').update(b).digest('hex');
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const safe=name=>typeof name==='string'&&!name.startsWith('/')&&!name.includes('\\')&&!name.split('/').some(p=>!p||p==='.'||p==='..');
/** Overlay only the reviewed Rodeio snapshot. No network, credentials or other client writes. */
export async function stageRodeioWordPressPreview({root,snapshot,manifest}){
 if(manifest.source!=='https://rodeiosp.com.br'||manifest.base!=='/rodeio/'||!Array.isArray(manifest.routes))throw new Error('Invalid Rodeio snapshot');
 const pages=new Set(manifest.routes.map(route=>route==='/'?'index.html':route.replace(/^\/|\/$/g,'')+'/index.html'));
 const prepared=[];
 for(const [name,record] of Object.entries(manifest.files)){
  if(!safe(name)||(!pages.has(name)&&!/^_wordpress\/(?:_astro\/)?[\w.-]+$/.test(name)))throw new Error('Snapshot path outside Rodeio: '+name);
  const bytes=await readFile(join(snapshot,'files',name));if(hash(bytes)!==record.sha256)throw new Error('Snapshot hash mismatch: '+name);
  if(name.endsWith('.html')){const text=bytes.toString();if(!/<meta name="robots" content="noindex,nofollow">/.test(text)||/\/wp-(?:content|json|admin)\//.test(text))throw new Error('Unsafe preview HTML: '+name);if(/action="(?!\/rodeio\/api\/(?:eventos|contato)")/.test(text))throw new Error('Unexpected form endpoint: '+name);}
  prepared.push({name,bytes});
 }
 if([...pages].some(name=>!manifest.files[name]))throw new Error('Missing Rodeio page');
 for(const [name,record] of Object.entries(manifest.publicAssets)){
  if(!safe(name)||!/^((photos|logos|cardapio-paginas)\/|[\w.-]+$)/.test(name))throw new Error('Invalid public asset');
  if(hash(await readFile(join(root,'rodeio',name)))!==record.sha256)throw new Error('Live public asset mismatch: '+name);
 }
 for(const {name,bytes} of prepared){const target=join(root,'rodeio',name);await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes);}
 return {pages:pages.size,files:prepared.length,publicAssets:Object.keys(manifest.publicAssets).length};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const snapshot=join(project,'wordpress/public-preview');const manifest=JSON.parse(await readFile(join(snapshot,'manifest.json'),'utf8'));
 console.log('Rodeio dev synchronized:',await stageRodeioWordPressPreview({root:join(project,'hoster-dist'),snapshot,manifest}));
}
