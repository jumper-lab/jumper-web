import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const base=process.env.PREVIEW_URL||'http://localhost:4321';const pass=process.argv[2]||'pass1';
const out=path.resolve('data/visual-review');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});const report={pass,date:new Date().toISOString(),pages:[],interactions:[],failures:[]};
const routes=['/','/historia/','/cardapio/','/restaurantes/','/restaurantes/jardins/','/restaurantes/iguatemi/','/eventos/','/reservas/','/privacidade/','/404.html'];
for(const width of [320,768,1024,1440]){
 const context=await browser.newContext({viewport:{width,height:width===320?780:1000},deviceScaleFactor:1,reducedMotion:'reduce'});const page=await context.newPage();
 for(const route of routes){
  const response=await page.goto(base+route);await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(async()=>{const images=[...document.images];images.forEach(im=>im.loading='eager');await Promise.all(images.map(im=>im.decode().catch(()=>{})));});
  const metrics=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,broken:[...document.images].filter(im=>im.offsetWidth>0&&!im.closest('dialog')&&(!im.complete||!im.naturalWidth)).map(im=>im.src),overflow:[...document.querySelectorAll('main *')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.right>innerWidth+1||b.left< -1)}).map(e=>e.tagName+'.'+e.className).slice(0,12)}));
  const name=route==='/'?'home':route.replace(/^\//,'').replace(/\/$/,'').replaceAll('/','-').replace('.html','');
  await page.screenshot({path:path.join(out,`${name}-${width}-${pass}.png`),fullPage:true});
  let accessibility=[];if(width===320||width===1440){const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();accessibility=result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));}
  const record={route,width,status:response.status(),...metrics,accessibility};report.pages.push(record);
  if(metrics.scrollWidth>width||metrics.h1!==1||metrics.broken.length||metrics.overflow.length||accessibility.length)report.failures.push(record);
  console.log(name,width,'overflow',metrics.scrollWidth-width,'axe',accessibility.length,'broken',metrics.broken.length);
 }
 await context.close();
}
const context=await browser.newContext({viewport:{width:390,height:844}});const page=await context.newPage();
async function check(name,fn){try{await fn();report.interactions.push({name,passed:true});console.log('PASS',name);}catch(e){const r={name,passed:false,error:String(e)};report.interactions.push(r);report.failures.push(r);console.log('FAIL',name,String(e));}}
function assert(v,m){if(!v)throw Error(m);}
await check('Menu mobile, contenção de foco e Escape',async()=>{await page.goto(base);await page.locator('[data-open-menu]').click();assert(await page.locator('#navigation-dialog').evaluate(d=>d.open),'menu closed');for(let i=0;i<10;i++){await page.keyboard.press('Tab');assert(await page.evaluate(()=>!!document.activeElement?.closest('#navigation-dialog')),'focus escaped');}await page.keyboard.press('Escape');assert(!await page.locator('#navigation-dialog').evaluate(d=>d.open),'Escape failed');assert(await page.locator('[data-open-menu]').evaluate(b=>b===document.activeElement),'focus not restored');});
await check('Galeria abre, exibe foto e fecha com Escape',async()=>{await page.goto(base+'/cardapio/');await page.locator('[data-gallery]').first().click();await page.locator('#gallery-image').evaluate(im=>im.decode());assert(await page.locator('#gallery-dialog').evaluate(d=>d.open),'gallery closed');await page.keyboard.press('Escape');assert(!await page.locator('#gallery-dialog').evaluate(d=>d.open),'gallery remained open');});
await check('Reserva seleciona unidade via URL sem carregar terceiros antes do clique',async()=>{await page.goto(base+'/reservas/?unidade=iguatemi');assert(await page.locator('[data-unit=iguatemi]').getAttribute('aria-pressed')==='true','URL unit not selected');assert(await page.locator('#reservation-fallback').getAttribute('href')==='https://rodeiosp.com.br/reservas/iguatemi/','wrong fallback');assert(await page.locator('iframe').count()===0,'eager iframe');await page.locator('[data-unit=jardins]').click();assert(await page.locator('#selected-address').textContent()==='Rua Haddock Lobo, 1448','wrong address');await page.locator('#load-reservation').click();await page.locator('#widget-slot iframe').waitFor();assert((await page.locator('iframe').getAttribute('src')).includes('56c778030896b3cd13c609e5'),'wrong widget');await page.locator('[data-unit=iguatemi]').click();assert(await page.locator('iframe').count()===0,'stale iframe');assert(await page.locator('#load-reservation').isVisible(),'cannot reload');});
await check('Mapa carregado somente por clique',async()=>{await page.goto(base+'/restaurantes/jardins/');assert(await page.locator('#map-slot iframe').count()===0,'map eager');await page.locator('[data-map]').click();assert(await page.locator('#map-slot iframe').count()===1,'map absent');});
await check('Links internos e âncoras válidos',async()=>{const visited=new Set();for(const route of routes){await page.goto(base+route);const links=await page.locator('a').evaluateAll(as=>as.map(a=>a.getAttribute('href')).filter(Boolean));for(const href of links){if(href.startsWith('#'))assert(await page.locator(href).count()>0,'anchor '+href+' missing');else if(href.startsWith('/')&&!visited.has(href)){visited.add(href);const r=await context.request.get(base+href);assert(r.ok(),'link '+href+' returned '+r.status());}}}});
await browser.close();await fs.writeFile(path.join(out,`verification-${pass}.json`),JSON.stringify(report,null,2));console.log('Failures:',report.failures.length);process.exitCode=report.failures.length?1:0;
