import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
for(const [width,height] of [[320,568],[320,780],[768,1000],[1024,768],[1440,1000],[1920,1080],[844,390]]){
 const page=await browser.newPage({viewport:{width,height}});
 for(const route of ['/','/historia/','/cardapio/','/reservas/','/privacidade/','/404.html']){
 await page.goto('http://localhost:4321'+route);
 await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(async()=>{await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));});
 const r=await page.locator('.hero').evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth}));
 assert.equal(r.height,height);assert.equal(r.width,width);assert.equal(r.overflow,false);results.push({route,...r});
 if(route==='/')await page.screenshot({path:`data/visual-review/hero-motion-${width}-${height}.png`});
 }
 await page.close();
}
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.addInitScript(()=>{window.motionEvidence=[];window.addEventListener('pagereveal',e=>window.motionEvidence.push({transition:!!e.viewTransition}));});
await page.goto('http://localhost:4321/');
await page.locator('.desktop-nav a[href="/historia/"]').click();
await page.waitForURL('**/historia/');
const transition=await page.evaluate(()=>window.motionEvidence);assert(transition.some(e=>e.transition));
await page.emulateMedia({reducedMotion:'reduce'});await page.reload();
assert.equal(await page.evaluate(()=>document.getAnimations().length),0);
await fs.writeFile('data/visual-review/motion-checks.json',JSON.stringify({results,transition,reducedMotion:true},null,2));
await browser.close();console.log('PASS: 42 hero dimensions, native page transition and reduced motion');
