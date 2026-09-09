// Astro can emit imported lossless masters alongside derivatives. Publish only referenced assets.
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..','dist');
const walk=async dir=>(await Promise.all((await fs.readdir(dir,{withFileTypes:true})).map(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]))).flat();
const files=await walk(root);
const textFiles=files.filter(f=>/\.(html|css|js|json|svg|xml|txt)$/.test(f));
const content=(await Promise.all(textFiles.map(f=>fs.readFile(f,'utf8')))).join('\n');
const masters=files.filter(f=>path.dirname(f)===path.join(root,'_astro')&&f.endsWith('.webp'));
let removed=0,bytes=0;
for(const file of masters){if(content.includes(path.basename(file)))continue;bytes+=(await fs.stat(file)).size;await fs.unlink(file);removed++;}
console.log(`Excluded ${removed} unreferenced source images (${Math.round(bytes/1024/1024)} MB); published derivatives preserved.`);
