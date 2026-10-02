import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const prefix=(process.env.BASE_PATH||'').replace(/\/$/,'');
const origin=process.env.SITE_URL||'https://paodequeijohaddocklobo.com.br';
const errors=[];
const walk=async directory=>(await Promise.all((await fs.readdir(directory,{withFileTypes:true})).map(async entry=>entry.isDirectory()?walk(path.join(directory,entry.name)):path.join(directory,entry.name)))).flat();
const files=await walk(path.join(root,'dist'));
const pages=['index.html','sobre/index.html','lojas/index.html','menu/index.html'];
const assets=[];
for(const page of pages){
  const html=await fs.readFile(path.join(root,'dist',page),'utf8');
  const route=page==='index.html'?'/':'/'+page.replace(/index.html$/,'');
  const canonical=new URL(prefix+route,origin).href;
  if(!html.includes(`rel="canonical" href="${canonical}"`)) errors.push(`${page}: canonical`);
  for(const attribute of html.matchAll(/(?:src|href)="(\/[^"\s]*)"/g)){
    const url=attribute[1].split('#')[0].split('?')[0];
    if(prefix && !url.startsWith(prefix+'/')) errors.push(`${page}: caminho fora do prefixo: ${url}`);
    const relative=prefix?url.slice(prefix.length):url;
    const target=path.join(root,'dist',relative,relative.endsWith('/')?'index.html':'');
    try{await fs.access(target)}catch{errors.push(`${page}: destino inexistente ${url}`)}
  }
  for(const set of html.matchAll(/srcset="([^"]+)"/g)) for(const option of set[1].split(',')) {
    const url=option.trim().split(' ')[0];
    if(prefix && !url.startsWith(prefix+'/')) errors.push(`${page}: srcset fora do prefixo`);
    try{await fs.access(path.join(root,'dist',prefix?url.slice(prefix.length):url))}catch{errors.push(`${page}: srcset inexistente ${url}`)}
  }
  if(/renata@|pri@|briefing-payload|briefing_normalizado/i.test(html)) errors.push(`${page}: dado interno`);
}
for(const file of files) {
  const relative=path.relative(path.join(root,'dist'),file);
  const bytes=await fs.readFile(file);
  if(file.endsWith('.webp') && bytes.length>400*1024) errors.push(`${relative}: imagem acima de 400KB`);
  if(file.endsWith('.woff2') || file.endsWith('.js') || file.endsWith('.css')) assets.push({file:relative,bytes:bytes.length,gzip_bytes:gzipSync(bytes).length});
  if(/(?:briefing|visual-quality-audit|README|node_modules|\.ttf$)/.test(relative)) errors.push(`Arquivo interno não deve estar em dist: ${relative}`);
}
if(assets.filter(a=>a.file.endsWith('.woff2')).length!==5) errors.push('Quantidade de fontes diferente das cinco aprovadas');
const report={status:errors.length?'failed':'passed',prefix:prefix||'/',origin,pages:pages.length,webp_files:files.filter(f=>f.endsWith('.webp')).length,assets,errors};
await fs.writeFile(path.join(root,'data/visual-review',prefix?'prefix-output-report.json':'output-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(errors.length)process.exitCode=1;
