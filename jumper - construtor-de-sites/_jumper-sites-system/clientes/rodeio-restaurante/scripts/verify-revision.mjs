import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.PREVIEW_URL||'http://localhost:4321';
const pass=process.argv[2]||'pass1';const out=`data/visual-review/revision/${pass}`;await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report={date:new Date().toISOString(),base,pages:[],checks:[],failures:[]};
const routes=['/','/historia/','/cardapio/','/restaurantes/','/restaurantes/jardins/','/restaurantes/iguatemi/','/eventos/','/reservas/','/privacidade/','/404.html'];
for(const [width,height] of [[320,568],[390,844],[768,1024],[1024,768],[1440,900],[1920,1080],[1440,650],[844,390],[720,450]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});const page=await context.newPage();
 for(const route of routes){
  await page.goto(base+route);await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(async()=>{await Promise.all([...document.images].filter(im=>!im.closest('dialog')).map(async im=>{im.loading='eager';await im.decode().catch(()=>{});}));});
  const metrics=await page.evaluate(()=>{
   const hero=document.querySelector('.hero'),copy=document.querySelector('.hero-copy'),header=document.querySelector('.site-header'),head=header.getBoundingClientRect();
   const visible=el=>el?.checkVisibility({checkOpacity:true,checkVisibilityCSS:true});
   const bounds=el=>{if(!visible(el))return null;const b=el.getBoundingClientRect();return{top:b.top,bottom:b.bottom,left:b.left,right:b.right,height:b.height,width:b.width};};
   const rect=selector=>bounds(document.querySelector(selector));
   const r=hero.getBoundingClientRect();
   const controls=[...header.querySelectorAll('a,button')].filter(visible).map(el=>({name:el.textContent.trim()||el.querySelector('img')?.alt,rect:bounds(el)}));
   const copyElements=[...hero.querySelectorAll('.eyebrow,h1,.hero-description,.hero-actions a')].filter(visible).map(el=>({name:el.tagName+' '+el.className,rect:bounds(el)}));
   return {hero:{width:r.width,height:r.height},viewport:{width:innerWidth,height:innerHeight},pageOverflow:document.documentElement.scrollWidth>innerWidth,h1:document.querySelectorAll('h1').length,copyScroll:copy?copy.scrollHeight-copy.clientHeight:0,eyebrow:rect('.hero .eyebrow'),actions:rect('.hero-actions'),actionLinks:[...hero.querySelectorAll('.hero-actions a')].filter(visible).map(bounds),note:rect('.hero-note'),title:rect('.hero h1'),copyElements,headerControls:controls,headerBottom:head.bottom,headerTop:head.top,broken:[...document.images].filter(im=>!im.closest('dialog')&&im.offsetWidth>0&&!im.naturalWidth).map(im=>im.src)};
  });
  let violations=[];if([320,1440].includes(width)&&height!==650){const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();violations=axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}));}
  const record={route,width,height,...metrics,violations};report.pages.push(record);
  const tooClose=(a,b,gap=0)=>!(a.right+gap<=b.left||b.right+gap<=a.left||a.bottom+gap<=b.top||b.bottom+gap<=a.top);
  const outside=(r,top=metrics.headerBottom)=>r.top<top-1||r.bottom>height+1||r.left< -1||r.right>width+1;
  const failures=[];if(Math.abs(metrics.hero.height-height)>1||Math.abs(metrics.hero.width-width)>1)failures.push('hero dimensions');if(metrics.pageOverflow||metrics.broken.length||metrics.h1!==1||violations.length)failures.push('page/a11y');if(metrics.eyebrow?.top<metrics.headerBottom-1)failures.push('eyebrow behind header');if(!metrics.title||metrics.copyElements.some(el=>outside(el.rect)))failures.push('hero text/CTA clipping');if(metrics.actions&&(!metrics.actionLinks.length||metrics.actionLinks.some(r=>outside(r))))failures.push('CTA outside viewport');
  // Signature may be hidden or arranged alongside the CTA in an immersive hero.
  // Assert physical separation rather than requiring one vertical ordering.
  if(metrics.note&&metrics.actionLinks.some(r=>tooClose(metrics.note,r,16)))failures.push('note/CTA overlap');if(metrics.copyScroll>1)failures.push('internal hero scrolling');
  const controls=metrics.headerControls;if(controls.some(c=>c.rect.top<metrics.headerTop-1||c.rect.bottom>metrics.headerBottom+1||c.rect.left< -1||c.rect.right>width+1))failures.push('header control clipping');
  if(controls.some((c,i)=>controls.slice(i+1).some(other=>tooClose(c.rect,other.rect))))failures.push('header control overlap');
  if(failures.length)report.failures.push({route,width,height,failures,...metrics});
  const slug=route==='/'?'home':route.replace(/^\//,'').replace(/\/$/,'').replaceAll('/','-').replace('.html','');
  await page.screenshot({path:`${out}/${slug}-${width}x${height}.png`,fullPage:true});
  console.log(slug,width,height,failures.join(',')||'PASS');
 }
 await context.close();
}
async function check(name,fn){try{await fn();report.checks.push({name,passed:true});console.log('PASS',name);}catch(e){report.failures.push({name,error:String(e)});report.checks.push({name,passed:false});console.log('FAIL',name,String(e));}}
const context=await browser.newContext({viewport:{width:844,height:390},reducedMotion:'reduce'});const page=await context.newPage();
await check('Landscape menu: close remains visible, focus cycle, Escape',async()=>{
 await page.goto(base);await page.locator('[data-open-menu]').click();assert.equal(await page.locator('[data-open-menu]').getAttribute('aria-expanded'),'true');
 await page.locator('#navigation-dialog').evaluate(e=>e.scrollTop=e.scrollHeight);const close=await page.locator('[data-close-menu]').boundingBox();assert(close.y>=0&&close.y+close.height<=390);
 for(let i=0;i<15;i++){await page.keyboard.press('Tab');assert(await page.evaluate(()=>!!document.activeElement.closest('#navigation-dialog')));}
 await page.keyboard.press('Escape');await page.waitForFunction(()=>document.querySelector('[data-open-menu]').getAttribute('aria-expanded')==='false');assert.equal(await page.locator('[data-open-menu]').getAttribute('aria-expanded'),'false');assert(await page.locator('[data-open-menu]').evaluate(e=>e===document.activeElement));
});
await check('Gallery: high resolution, clear error, focus return',async()=>{
 await page.goto(base+'/restaurantes/iguatemi/');const link=page.locator('[data-gallery]').first();const href=await link.getAttribute('href');await link.click();await page.locator('#gallery-image').evaluate(im=>im.decode());assert.equal(await page.locator('#gallery-image').getAttribute('src'),new URL(href,base).href);assert((await page.locator('#gallery-image').evaluate(im=>im.naturalWidth))>=960);await page.keyboard.press('Escape');assert(await link.evaluate(e=>e===document.activeElement));
 await page.route('**'+href,route=>route.abort());await link.click();await page.waitForFunction(()=>document.querySelector('#gallery-status').textContent.includes('Não foi possível'));assert(await page.locator('#gallery-original').isVisible());await page.keyboard.press('Escape');await page.unroute('**'+href);
});
await check('Reservations: unit switching and timeout fallback without submission',async()=>{
 await page.goto(base+'/reservas/?unidade=iguatemi');assert.equal(await page.locator('[data-unit=iguatemi]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('iframe').count(),0);
 await page.route('**/reservation/schedule/**',async route=>{await new Promise(resolve=>setTimeout(resolve,14000));await route.abort();});
 await page.locator('#load-reservation').click();await page.waitForFunction(()=>document.querySelector('#load-reservation').textContent==='Tentar novamente',{},{timeout:15000});assert(await page.locator('#reservation-fallback').isVisible());await page.locator('[data-unit=jardins]').click();assert.equal(await page.locator('iframe').count(),0);assert.equal(await page.locator('#reservation-title').textContent(),'Sua mesa no Jardins');
 await page.unrouteAll({behavior:'ignoreErrors'});
});
await check('Map and direct fallback',async()=>{await page.goto(base+'/restaurantes/jardins/');assert.equal(await page.locator('iframe').count(),0);await page.locator('[data-map]').click();assert.equal(await page.locator('#map-slot iframe').count(),1);assert(await page.locator('#map-slot iframe').evaluate(e=>e===document.activeElement));});
await check('Internal links and metadata',async()=>{
 const seen=new Set();for(const route of routes){await page.goto(base+route);assert.equal(await page.locator('link[rel=canonical]').count(),1);assert((await page.locator('meta[name=robots]').getAttribute('content')).includes('noindex'));
 for(const href of await page.locator('a').evaluateAll(as=>as.map(a=>a.getAttribute('href')).filter(Boolean))){if(href.startsWith('#'))assert(await page.locator(href).count());else if(href.startsWith('/')&&!seen.has(href)){seen.add(href);assert((await context.request.get(base+href)).ok(),href);}}
 }
});
await check('No JavaScript: mobile navigation, gallery and reservations work as links',async()=>{
 const c=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const p=await c.newPage();await p.goto(base);await p.locator('.no-script-menu').click();await p.waitForURL('**/#site-navigation');assert.equal(await p.locator('#site-navigation a').count(),6);await p.goto(base+'/cardapio/');assert((await p.locator('[data-gallery]').first().getAttribute('href')).endsWith('.avif'));await p.goto(base+'/reservas/');assert.equal(await p.locator('noscript a').filter({hasText:'Reservar no Rodeio'}).count(),2);await c.close();
});
await check('Footer reservation CTA preserves the current unit and reservation anchor',async()=>{
 for(const unit of ['jardins','iguatemi']){
  await page.goto(base+'/restaurantes/'+unit+'/');assert.equal(await page.locator('.footer-reserve').getAttribute('href'),'/reservas/?unidade='+unit);await page.locator('.footer-reserve').click();await page.waitForURL('**/reservas/?unidade='+unit);assert.equal(await page.locator('[data-unit='+unit+']').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('iframe').count(),0);
 }
 await page.goto(base+'/reservas/');assert.equal(await page.locator('.footer-reserve').getAttribute('href'),'#escolher-unidade');await page.locator('.footer-reserve').click();await page.waitForURL('**/reservas/#escolher-unidade');assert(await page.locator('#escolher-unidade').evaluate(el=>{const r=el.getBoundingClientRect(),header=document.querySelector('.site-header').getBoundingClientRect();return r.top>=header.bottom-1&&r.top<innerHeight;}));
});
await check('Header transition widths 1199, 1200 and 1350 keep all controls separate',async()=>{
 for(const width of [1199,1200,1350]){
  await page.setViewportSize({width,height:900});await page.goto(base);await page.evaluate(()=>document.fonts.ready);
  const metrics=await page.evaluate(()=>{
   const header=document.querySelector('.site-header'),h=header.getBoundingClientRect();const controls=[...header.querySelectorAll('a,button')].filter(el=>el.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})).map(el=>({name:el.textContent.trim(),r:el.getBoundingClientRect().toJSON()}));
   return{width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,clipped:controls.filter(({r})=>r.top<h.top-1||r.bottom>h.bottom+1||r.left< -1||r.right>innerWidth+1),collisions:controls.flatMap((a,i)=>controls.slice(i+1).filter(b=>a.r.left<b.r.right&&a.r.right>b.r.left&&a.r.top<b.r.bottom&&a.r.bottom>b.r.top).map(b=>[a.name,b.name]))};
  });
  assert(!metrics.overflow&&!metrics.clipped.length&&!metrics.collisions.length,JSON.stringify(metrics));await page.screenshot({path:`${out}/header-${width}.png`,clip:{x:0,y:0,width,height:130}});
 }
 await page.setViewportSize({width:844,height:390});
});
await check('Normal motion remains, reduced motion cancels, history works',async()=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(base);await page.waitForFunction(()=>document.getAnimations().length>0);await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.getAnimations().length===0);await page.goto(base+'/historia/');await page.goBack();assert.equal(new URL(page.url()).pathname,'/');
});
await browser.close();await fs.writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log('FAILURES:',report.failures.length);process.exitCode=report.failures.length?1:0;
