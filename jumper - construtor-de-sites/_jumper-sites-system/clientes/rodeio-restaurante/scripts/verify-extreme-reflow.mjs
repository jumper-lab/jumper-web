import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const base=process.env.PREVIEW_URL||'http://localhost:4321';
const pass=process.argv[2];
const browser=await chromium.launch({channel:'chrome',headless:true});const checks=[];
for(const [width,height] of [[360,225],[390,320]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
 for(const route of ['/','/eventos/','/reservas/','/restaurantes/jardins/']){
  await page.goto(base+route);await page.evaluate(()=>document.fonts.ready);await page.locator('.hero-actions a').first().focus();
  const metrics=await page.evaluate(()=>{
   const copy=document.querySelector('.hero-copy').getBoundingClientRect(),action=document.querySelector('.hero-actions a').getBoundingClientRect(),header=document.querySelector('.site-header').getBoundingClientRect(),hero=document.querySelector('.hero').getBoundingClientRect();
   return{viewport:[innerWidth,innerHeight],hero:hero.height,heroWidth:hero.width,overflow:document.documentElement.scrollWidth>innerWidth,actionVisible:action.top>=Math.max(copy.top,header.bottom)-1&&action.bottom<=Math.min(copy.bottom,innerHeight)+1&&action.left>=-1&&action.right<=innerWidth+1,copyHeight:copy.height,actionHeight:action.height};
  });
  assert.equal(metrics.hero,height);assert.equal(metrics.heroWidth,width);assert.equal(metrics.overflow,false);assert(metrics.actionVisible,JSON.stringify({route,...metrics}));checks.push({route,...metrics});
 }
 await page.close();
}
await fs.mkdir('data/visual-review/revision',{recursive:true});
await fs.writeFile(`data/visual-review/revision/extreme-reflow${pass?'-'+pass:''}.json`,JSON.stringify({date:new Date().toISOString(),base,method:'Viewports equivalentes a zoom forte; foco por teclado no CTA deve permanecer visível abaixo do cabeçalho e dentro da tela. Rolagem interna do texto permitida somente nestas alturas extremas para preservar o hero100vh.',checks},null,2));await browser.close();console.log('PASS: 8 extreme reflow/focus conditions');
