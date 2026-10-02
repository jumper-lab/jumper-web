import {chromium,firefox,webkit} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const root=process.env.RODEIO_ROOT,base=process.env.REVIEW_URL||'http://127.0.0.1:4326/rodeio',label=process.env.REVIEW_LABEL||'local',out=root+'/data/visual-review/classicos-fotos-qualidade/'+label;await fs.mkdir(out,{recursive:true});const results=[];
for(const[engine,type]of Object.entries({chromium,firefox,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{executablePath:process.env['REVIEW_'+engine.toUpperCase()+'_EXECUTABLE']})});
 const sizes=engine==='chromium'?[[320,740],[390,844],[768,1024],[1440,900],[1920,1080]]:[[390,844],[1440,900]];
 for(const[width,height]of sizes){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:2,reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const response=await page.goto(base+'/',{waitUntil:'networkidle'});assert.equal(response.status(),200);
 const section=page.locator('#classicos');for(const img of await section.locator('img').all()){await img.scrollIntoViewIfNeeded();await page.waitForFunction(el=>el.complete&&el.naturalWidth>0,await img.elementHandle(),{timeout:20000});}
 const photos=await section.locator('img').evaluateAll(images=>images.map(i=>({alt:i.alt,currentSrc:i.currentSrc,loading:i.loading,width:i.naturalWidth,height:i.naturalHeight,ready:i.complete&&i.naturalWidth>0,display:{width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height},fit:getComputedStyle(i).objectFit,ratio:i.width/i.height})));
 assert.equal(photos.length,2);assert.ok(photos[0].currentSrc.includes('home-picanha-fatiada'));assert.ok(photos[1].currentSrc.includes('home-arroz-rodeio'));for(const p of photos){assert.ok(p.currentSrc.endsWith('.avif'));assert.equal(p.loading,'lazy');assert.equal(p.ready,true);assert.equal(p.fit,'contain');assert.ok(Math.abs(p.display.width/p.display.height-p.width/p.height)<0.005,'native aspect ratio without clipping');const response=await page.request.get(p.currentSrc);assert.equal(response.status(),200);const bytes=await response.body();const encoded=await sharp(bytes).metadata();p.encoded={width:encoded.width,height:encoded.height,bytes:bytes.length};assert.ok(encoded.width>=Math.min(p.display.width*2,1920),'enough responsive pixels for DPR2');}
 assert.deepEqual(await section.locator('figcaption h3').allTextContents(),['Picanha fatiada','Arroz Rodeio']);assert.ok((await section.locator('figcaption').last().innerText()).includes('Biro-Biro'));assert.equal(await section.getByRole('link').getAttribute('href'),base.startsWith('http://127')?'/rodeio/cardapio/':'/rodeio/cardapio/');
 const layout=await section.locator('.photo-viewport').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}}));if(width>=760){assert.ok(Math.abs(layout[0].y-layout[1].y)<2);assert.ok(Math.abs(layout[0].height-layout[1].height)<2);}else assert.ok(layout[1].y>layout[0].y+layout[0].height);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual(errors,[]);
 const violations=engine==='chromium'&&[390,1440].includes(width)?(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})):[];assert.deepEqual(violations,[]);
 if(engine==='chromium'&&[390,1440].includes(width))await section.screenshot({path:out+'/'+width+'-classicos.jpg',type:'jpeg',quality:90,style:'header, .skip-link { visibility: hidden !important; }'});
 results.push({engine,width,height,status:response.status(),photos,layout,violations,errors,passed:true});await context.close();console.log(engine+' '+width+': fotos, legendas, layout e links corretos');
 }await browser.close();
}await fs.writeFile(out+'/report.json',JSON.stringify({date:new Date().toISOString(),base,checks:results},null,2));
