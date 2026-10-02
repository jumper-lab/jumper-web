import {chromium,firefox,webkit} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.REVIEW_URL||'http://127.0.0.1:4326/rodeio';
const out='data/visual-review/jardins-novo-acervo/'+(process.env.REVIEW_LABEL||'local');
await fs.mkdir(out,{recursive:true});
const report={date:new Date().toISOString(),base,note:'Desktop browser engines with emulated viewports; no physical device test. Gallery-only change.',checks:[]};
async function expectImage(page,index,total=77){
 await page.waitForFunction(({index,total})=>{
  const im=document.querySelector('#gallery-image');
  return document.querySelector('#gallery-count')?.textContent===index+' / '+total&&im?.complete&&im.naturalWidth>0&&!im.hidden&&document.querySelector('.gallery-stage').getAttribute('aria-busy')==='false';
 },{index,total},{timeout:30000});
 const state=await page.locator('#gallery-image').evaluate(el=>({src:el.src,width:el.naturalWidth,height:el.naturalHeight,alt:el.alt}));
 assert.ok(state.src.endsWith('.avif'));assert.ok(state.width>0&&state.height>0);return state;
}
for(const [engine,type]of Object.entries({chromium,firefox,webkit})){
 const path=process.env['REVIEW_'+engine.toUpperCase()+'_EXECUTABLE'];
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{}),...(path?{executablePath:path}:{})});
 for(const[width,height]of [[320,568],[390,844],[768,1024],[1440,900]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000,reducedMotion:width===320?'reduce':'no-preference'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  assert.equal((await page.goto(base+'/restaurantes/jardins/',{waitUntil:'networkidle'})).status(),200);
  const links=page.locator('#galeria [data-gallery]');
  assert.equal(await links.count(),77);
  const attrs=await links.evaluateAll(items=>items.map(a=>{const im=a.querySelector('img');return{href:a.href,alt:im.alt,lazy:im.loading,decoding:im.decoding,width:Number(im.getAttribute('width')),height:Number(im.getAttribute('height')),srcset:im.srcset,sizes:im.sizes,complete:im.complete&&im.naturalWidth>0}}));
  assert.equal(new Set(attrs.map(a=>a.href)).size,77);
  assert.equal(await links.filter({visible:true}).count(),12);
  assert.ok(attrs.every(a=>a.lazy==='lazy'&&a.decoding==='async'&&a.alt.includes('Rodeio Jardins')&&a.width>0&&a.height>0&&a.href.endsWith('.avif')&&a.srcset.includes('320w')&&a.sizes.includes('29vw')));
  const initiallyLoaded=attrs.filter(a=>a.complete).length;
  assert.ok(initiallyLoaded<20,'All 77 images must not load at the initial viewport');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  const first=links.first();await first.scrollIntoViewIfNeeded();
  await first.locator('img').evaluate(el=>{if(el.complete&&el.naturalWidth)return;return new Promise((res,rej)=>{el.addEventListener('load',res,{once:true});el.addEventListener('error',rej,{once:true});})});
  await page.waitForTimeout(1200);
  if(engine==='chromium'&&[390,1440].includes(width)){
   await page.locator('#gallery-heading').scrollIntoViewIfNeeded();
   await page.screenshot({path:out+'/gallery-'+engine+'-'+width+'.jpg',type:'jpeg',quality:85});
   const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   assert.deepEqual(axe.violations.map(v=>v.id),[]);
  }
  await first.click();assert.equal(await page.locator('#gallery-dialog').evaluate(el=>el.open),true);
  const opened=await expectImage(page,1);assert.equal(opened.src,attrs[0].href);
  const r=await page.locator('#gallery-dialog').evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}});
  assert.ok(r.x>=-1&&r.y>=-1&&r.x+r.width<=width+1&&r.y+r.height<=height+1);
  await page.locator('[data-gallery-next]').click();const second=await expectImage(page,2);assert.equal(second.src,attrs[1].href);
  if(width!==320){await page.waitForTimeout(500);assert.equal(await page.locator('[data-outgoing-photo]').count(),0)}
  await page.keyboard.press('ArrowLeft');await expectImage(page,1);
  await page.keyboard.press('ArrowLeft');const last=await expectImage(page,77);assert.equal(last.src,attrs[76].href);
  await page.locator('[data-gallery-next]').click();await expectImage(page,1);
  if(engine==='chromium'&&[390,1440].includes(width)){
   await page.waitForTimeout(450);
   await page.screenshot({path:out+'/lightbox-'+engine+'-'+width+'.jpg',type:'jpeg',quality:85});
   const axe=await new AxeBuilder({page}).include('#gallery-dialog').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   assert.deepEqual(axe.violations.map(v=>v.id),[]);
  }
  await page.locator('[data-close-gallery]').click();await page.waitForFunction(()=>!document.querySelector('#gallery-dialog').open);
  assert.equal(await first.evaluate(el=>document.activeElement===el),true);
  await first.click();await expectImage(page,1);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#gallery-dialog').open);
  const more=page.locator('[data-show-more-photos]');
  if(engine==='chromium'&&width===390)await more.click();else await more.evaluate(b=>b.click());assert.equal(await links.filter({visible:true}).count(),24);assert.equal(await page.locator('[data-gallery-shown]').textContent(),'24');
  for(let i=0;i<5;i++)await more.evaluate(b=>b.click());
  assert.equal(await links.filter({visible:true}).count(),77);assert.equal(await more.isHidden(),true);assert.equal(await page.locator('[data-gallery-shown]').textContent(),'77');
  assert.deepEqual(errors,[]);
  report.checks.push({engine,width,height,count:77,uniqueLightboxImages:77,initiallyLoaded,dialog:r,first:opened,last,passed:true});
  console.log(engine+' '+width+'x'+height+': 77 photos, lazy loading, lightbox, wraparound and focus passed; initially loaded '+initiallyLoaded);
  await context.close();
 }
 await browser.close();
}
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage();
await page.goto(base+'/restaurantes/iguatemi/',{waitUntil:'networkidle'});assert.equal(await page.locator('#galeria [data-gallery]').count(),5);
await browser.close();report.iguatemiCount=5;
const fallback=await chromium.launch({channel:'chrome',headless:true}),noScript=await fallback.newContext({javaScriptEnabled:false}),fallbackPage=await noScript.newPage();
await fallbackPage.goto(base+'/restaurantes/jardins/',{waitUntil:'networkidle'});assert.equal(await fallbackPage.locator('#galeria [data-gallery]').filter({visible:true}).count(),77);assert.equal(await fallbackPage.locator('[data-show-more-photos]').isHidden(),true);await fallback.close();report.noScriptAllPhotos=true;
await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));
