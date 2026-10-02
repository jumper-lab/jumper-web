import {chromium,firefox,webkit} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
const base=process.env.REVIEW_URL||'http://127.0.0.1:4324/rodeio';
const out='data/visual-review/diretrizes-2026-10-02';await fs.mkdir(out,{recursive:true});
const routes=['/','/historia/','/cardapio/','/eventos/','/reservas/','/restaurantes/','/restaurantes/jardins/','/restaurantes/iguatemi/','/em-breve/','/privacidade/'];
const report={date:new Date().toISOString(),base,checks:[],issues:[]};
const engines=process.env.REVIEW_ENGINES?.split(',')||['chromium'];
for(const engine of engines){
 const type={chromium,firefox,webkit}[engine];
 const executablePath=process.env[`REVIEW_${engine.toUpperCase()}_EXECUTABLE`];
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{}),...(executablePath?{executablePath}:{})});
 for(const [width,height] of engine==='chromium'?[[320,740],[390,844],[768,1024],[1024,768],[1440,900],[1920,1080]]:[[390,844],[1440,900]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of routes){
   errors.length=0;const response=await page.goto(base+route,{waitUntil:'networkidle'});
   await page.evaluate(async()=>{await document.fonts.ready;for(const img of document.querySelectorAll('img[src]')) {img.loading='eager';await img.decode().catch(()=>{});}});
   const state=await page.evaluate(()=>{
    const hero=document.querySelector('.hero');const copy=document.querySelector('.hero-copy');const h1=document.querySelector('h1');
    const bad=[...document.querySelectorAll('img[src]')].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src);
    const overflow=document.documentElement.scrollWidth>innerWidth+1;
    const headings=document.querySelectorAll('h1').length;
    const clipped=copy?copy.scrollHeight>copy.clientHeight+2:false;
    return {overflow,headings,bad,heroHeight:hero?.getBoundingClientRect().height,clipped,heading:h1?.textContent};
   });
   let violations=[];
   if((width===390||width===1440)&&engine==='chromium')violations=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}));
   const check={engine,width,height,route,status:response.status(),...state,errors:[...errors],violations,passed:response.status()===200&&!state.overflow&&!state.bad.length&&state.headings===1&&!errors.length&&!violations.length};report.checks.push(check);
   if(!check.passed||state.clipped)report.issues.push(check);
   if(engine==='chromium'&&(width===390||width===1440))await page.screenshot({path:`${out}/${width}-${route.replaceAll('/','')||'home'}.jpg`,fullPage:true,type:'jpeg',quality:85});
  }
  if(width<1200){await page.goto(base+'/');await page.locator('[data-open-menu]').click();const links=await page.locator('#navigation-dialog nav a').count();await page.keyboard.press('Escape');report.checks.push({engine,width,interaction:'seven-link-menu',links,passed:links===7&&!(await page.locator('#navigation-dialog').isVisible())});}
  await page.goto(base+'/reservas/?unidade=iguatemi');report.checks.push({engine,width,interaction:'reservation-direct-link',passed:(await page.locator('#selected-address').textContent()).includes('2232')&&(await page.locator('#selected-district').textContent()).includes('Jardim Paulistano')});
  await page.goto(base+'/restaurantes/jardins/');await page.locator('[data-gallery]').first().click();await page.waitForFunction(()=>document.querySelector('#gallery-image')?.getAttribute('src'));await page.locator('[data-gallery-next]').click();await page.waitForFunction(()=>document.querySelector('#gallery-count')?.textContent?.startsWith('2 /'));await page.keyboard.press('Escape');report.checks.push({engine,width,interaction:'lightbox',passed:!(await page.locator('#gallery-dialog').isVisible())});
  await context.close();console.log(`Conferido: ${engine} ${width}×${height}`);
 }
 await browser.close();
}
report.summary={checks:report.checks.length,failed:report.checks.filter(c=>!c.passed).length,clippedHeroes:report.issues.filter(c=>c.clipped).length};await fs.writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary));console.log(JSON.stringify(report.issues.map(({route,width,engine,clipped,overflow,violations,errors})=>({route,width,engine,clipped,overflow,violations,errors}))));if(report.summary.failed)process.exitCode=1;
