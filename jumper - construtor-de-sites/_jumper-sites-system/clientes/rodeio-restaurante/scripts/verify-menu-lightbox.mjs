import {chromium,firefox,webkit} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.REVIEW_URL||'http://127.0.0.1:4326/rodeio';
const out=`data/visual-review/menu-lightbox/${process.env.REVIEW_LABEL||'local'}`;
await fs.mkdir(out,{recursive:true});
const report={date:new Date().toISOString(),base,note:'Real LiveMenu iframe integration in desktop browser engines with emulated viewports; no physical-device test. Third-party frame content is outside the host accessibility audit.',checks:[]};
async function bounds(page,width,height){
 const state=await page.locator('#digital-menu-dialog').evaluate(el=>{const r=el.getBoundingClientRect(),f=el.querySelector('iframe').getBoundingClientRect(),c=el.querySelector('[data-close-digital-menu]').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,frame:{x:f.x,y:f.y,width:f.width,height:f.height},close:{x:c.x,y:c.y,width:c.width,height:c.height},overflow:el.scrollWidth>el.clientWidth+1,locked:getComputedStyle(document.body).overflow==='hidden'};});
 assert.equal(state.overflow,false);assert.equal(state.locked,true);assert.ok(state.x>=0&&state.y>=0&&state.x+state.width<=width+1&&state.y+state.height<=height+1);
 if(width<1200){assert.ok(Math.abs(state.width-(width-16))<1);assert.ok(Math.abs(state.height-(height-16))<1);}else{assert.ok(state.width<=1040&&state.width<width*.9);assert.ok(state.height<=800&&state.height<height*.9);}
 assert.ok(state.close.height>=44&&state.close.y>=0&&state.close.y+state.close.height<height);assert.ok(state.frame.height>100&&state.frame.width>250);return state;
}
for(const[engine,type]of Object.entries({chromium,firefox,webkit})){
 const executablePath=process.env[`REVIEW_${engine.toUpperCase()}_EXECUTABLE`];
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{}),...(executablePath?{executablePath}:{})});
 const cases=[[320,568,'/cardapio/'],[390,844,'/cardapio/'],[844,390,'/cardapio/'],[1440,900,'/cardapio/'],[390,844,'/restaurantes/jardins/'],[390,844,'/restaurantes/iguatemi/'],[390,844,'/em-breve/']];
 for(const[width,height,route]of cases){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<1200,reducedMotion:width===390&&route==='/cardapio/'?'no-preference':'reduce'});const page=await context.newPage();const errors=[];const requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('livemenu.app'))requests.push(r.url())});
  assert.equal((await page.goto(base+route,{waitUntil:'networkidle'})).status(),200);
  const original=page.url(),dialog=page.locator('#digital-menu-dialog');assert.equal(await dialog.locator('iframe').count(),0);assert.deepEqual(requests,[]);
  const links=page.locator('a[aria-controls="digital-menu-dialog"]');assert.equal(await links.count(),route==='/cardapio/'?3:1);
  const opener=links.first();await opener.click();const scrollAtOpen=await page.evaluate(()=>scrollY);assert.equal(page.url(),original);assert.equal(await dialog.evaluate(el=>el.open),true);
  const menuFrame=dialog.locator('iframe');assert.equal(await menuFrame.getAttribute('title'),'Cardápio digital do Rodeio');const state=await bounds(page,width,height);
  const remote=page.frameLocator('#digital-menu-dialog iframe');await remote.getByText('Menu Principal',{exact:true}).first().waitFor({state:'visible',timeout:30000});
  await remote.getByText('Provoleta',{exact:true}).first().waitFor({state:'attached',timeout:30000});
  assert.equal(await page.locator('[data-menu-status]').isHidden(),true);
  let interaction=false;
  if(width===390&&route==='/cardapio/'){
   await remote.getByText('Churrascos do Rodeio',{exact:true}).first().click();
   await remote.getByText('Picanha Fatiada',{exact:false}).first().waitFor({state:'visible',timeout:20000});interaction=true;
   await page.setViewportSize({width,height:644});await bounds(page,width,644);await page.setViewportSize({width,height});await bounds(page,width,height);
   const result=await new AxeBuilder({page}).include('#digital-menu-dialog').exclude('iframe').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();assert.deepEqual(result.violations.map(v=>v.id),[]);
  }
  if(route==='/cardapio/'&&[390,1440].includes(width))await page.screenshot({path:`${out}/${engine}-${width}.jpg`,type:'jpeg',quality:85});
  await page.locator('[data-close-digital-menu]').click();await page.waitForFunction(()=>!document.querySelector('#digital-menu-dialog').open&&document.querySelectorAll('#digital-menu-dialog iframe').length===0);
  assert.equal(page.url(),original);assert.equal(await page.evaluate(()=>scrollY),scrollAtOpen);assert.equal(await opener.evaluate(el=>document.activeElement===el),true);assert.notEqual(await page.evaluate(()=>getComputedStyle(document.body).overflow),'hidden');
  // Reopen for Escape, without waiting for remote assets; closing removes the frame.
  await opener.click();await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#digital-menu-dialog').open&&document.querySelectorAll('#digital-menu-dialog iframe').length===0);
  if(route==='/cardapio/'&&width===390){
   for(const link of await links.all()){await link.click();assert.equal(await dialog.evaluate(el=>el.open),true);await page.locator('[data-close-digital-menu]').click();await page.waitForFunction(()=>!document.querySelector('#digital-menu-dialog').open);}
  }
  if(width===1440){await opener.click();await page.mouse.click(10,10);await page.waitForFunction(()=>!document.querySelector('#digital-menu-dialog').open);}
  const thirdPartyErrors=errors.filter(message=>message.includes('clarity.ms/collect')&&message.includes('access control'));
  assert.deepEqual(errors.filter(message=>!thirdPartyErrors.includes(message)),[]);report.checks.push({engine,width,height,route,state,liveMenuLoaded:true,categoryInteraction:interaction,thirdPartyErrors,passed:true});console.log(`${engine} ${width}x${height} ${route}: iframe real, layout, controls and cleanup pass`);await context.close();
 }
 await browser.close();
}
// Without JavaScript, anchors still navigate directly to the supplied menu.
const browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto(base+'/cardapio/');assert.equal(await page.locator('a[href^="https://beta.livemenu.app/"]').count(),4);assert.equal(await page.locator('#digital-menu-dialog iframe').count(),0);await browser.close();report.noScriptFallback=true;
await fs.writeFile(`${out}/report.json`,JSON.stringify(report,null,2));
