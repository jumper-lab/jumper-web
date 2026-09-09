import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const selected=JSON.parse(await fs.readFile(path.join(root,'briefing/entrada/photo-refresh-selection.json'),'utf8'));
const old={iguatemiMesa:'iguatemi-mesa',fachada:'fachada',jardins:'jardins',iguatemi:'iguatemi',mesa:'mesa',picanha:'picanha',servico:'servico',sobremesa:'sobremesa',historia:'historia',origem:'origem',bar:'bar',reservas:'reservas'};
const sources=[...Object.entries(old).map(([key,name])=>({key,local:`briefing/entrada/originais/${name}.jpg`})),...selected];
const dir=path.join(root,'briefing/entrada/matrizes');await fs.mkdir(dir,{recursive:true});
const report=[];
for(const {key,local} of sources){
 const target=path.join(dir,key+'.webp');
 const original=await sharp(path.join(root,local)).metadata();
 if(!await fs.stat(target).then(()=>true,()=>false)) await sharp(path.join(root,local)).rotate().resize({width:2560,height:3840,fit:'inside',withoutEnlargement:true}).webp({lossless:true,effort:2}).toFile(target);
 const output=await sharp(target).metadata();report.push({key,source:local,original:[original.width,original.height],master:[output.width,output.height],bytes:output.size});console.log(key,output.width,output.height);
}
await fs.writeFile(path.join(root,'src/lib/photos.ts'),sources.map(({key})=>`import ${key} from '../../briefing/entrada/matrizes/${key}.webp';`).join('\n')+`\nexport const photos = {${sources.map(s=>s.key).join(',')}};\nexport type PhotoName = keyof typeof photos;\n`);
await fs.writeFile(path.join(root,'data/photo-masters.json'),JSON.stringify(report,null,2));
