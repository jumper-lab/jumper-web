import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'data/visual-review'),base=process.env.PREVIEW_URL||'http://127.0.0.1:4327',pass=process.env.JUMPER_PHOTO_PASS||'final';
const require=createRequire(import.meta.url),pw=require(process.env.JUMPER_PLAYWRIGHT||'/Users/marajah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
await fs.mkdir(out,{recursive:true});
const browser=await pw.chromium.launch({headless:true,...(!existsSync(pw.chromium.executablePath())?{channel:'chrome'}:{})});
const report={date:new Date().toISOString(),pass,checks:[],viewports:[],failures:[],errors:[],native_transition_skips:[]};
const check=(ok,label,data)=>{report.checks.push({ok,label,...(data?{data}:{})});if(!ok)report.failures.push(label);};
const watch=page=>page.on('pageerror',e=>{if(e.message==='Transition was aborted because of invalid state. ViewTransition opt-in disabled')report.native_transition_skips.push(e.message);else report.errors.push(e.message);});
try{
  for(const width of [320,390,768,1024,1440,1920]){
    const context=await browser.newContext({viewport:{width,height:width<700?844:960}}),page=await context.newPage();watch(page);
    await page.goto(base+'/menu/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
    for(const id of ['bebidas','smoothies']){
      await page.locator(`[data-category-link="${id}"]`).click();await page.waitForURL(base+`/menu/#${id}`);
      // Long native smooth-scrolls may still cross the previous category at 900ms.
      // Require the actual destination state, rather than sampling a fixed intermediate frame.
      await page.waitForFunction(id=>{
        const category=document.getElementById(id),expected=parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)+parseFloat(getComputedStyle(category).scrollMarginTop);
        return Math.abs(category.getBoundingClientRect().top-expected)<2&&document.querySelector(`[data-category-link="${id}"]`)?.getAttribute('aria-current')==='location';
      },id,{timeout:3500});
      const heading=page.locator(`#${id} .menu-category-heading`);await heading.locator('.photo').evaluate(async img=>{await img.decode();});
      const d=await heading.evaluate(h=>{const photo=h.querySelector('.photo'),frame=photo.parentElement,pr=frame.getBoundingClientRect(),title=h.querySelector('h3'),tr=title.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(title);const rr=range.getBoundingClientRect();return{src:photo.currentSrc,alt:photo.alt,loaded:photo.complete&&photo.naturalWidth>0,lazy:photo.loading==='lazy',local:new URL(photo.currentSrc).origin===location.origin,overflow:document.documentElement.scrollWidth-innerWidth,titleFits:rr.left>=tr.left-1&&rr.right<=pr.left+1,frame:{w:pr.width,h:pr.height},crop:getComputedStyle(photo).transform,clip:getComputedStyle(frame).overflow,selected:document.querySelector('[data-category-link][aria-current="location"]')?.dataset.categoryLink};});
      report.viewports.push({viewportWidth:width,id,...d});
      check(d.loaded&&d.local&&new URL(d.src).pathname.includes(`/images/${id}-`)&&d.lazy&&d.alt.length>20,`${id}@${width}: imagem local decodificada, lazy e alt contextual`);
      check(d.overflow<=1&&d.titleFits&&d.frame.w>=80&&d.frame.h>=80,`${id}@${width}: título sem colisão, moldura íntegra e sem overflow`,{frame:d.frame,titleFits:d.titleFits});
      check(d.selected===id,`${id}@${width}: índice acompanha a âncora com a foto presente`);
      if(id==='smoothies')check(d.crop!=='none'&&d.clip==='hidden',`smoothies@${width}: crop no próprio frame, sem carta/preços antigos na composição`);
      await heading.screenshot({path:path.join(out,`menu-photos-${pass}-${id}-${width}.png`)});
      await page.screenshot({path:path.join(out,`menu-photos-${pass}-${id}-viewport-${width}.png`)});
    }
    check(await page.locator('.menu-category-heading .category-image .photo').count()===8,`menu@${width}: oito categorias com fotos`);
    await page.getByLabel('Buscar no cardápio').fill('baunilha');
    check(await page.locator('#smoothies').isVisible()&&await page.locator('#smoothies .photo').count()===1&&await page.locator('[data-menu-item]:visible').count()===1,`menu@${width}: busca encontra Baunilha sem perder a foto`);
    await page.locator('[data-clear-search]').click();check(await page.locator('[data-menu-item]:visible').count()===83,`menu@${width}: limpar busca preserva os 83 itens`);
    await context.close();
  }
  for(const mode of ['no-js','reduced']){
    const context=await browser.newContext({viewport:{width:390,height:844},...(mode==='no-js'?{javaScriptEnabled:false}:{reducedMotion:'reduce'})}),page=await context.newPage();watch(page);
    await page.goto(base+'/menu/',{waitUntil:'networkidle'});
    for(const id of ['bebidas','smoothies']){const photo=page.locator(`#${id} .photo`);await photo.scrollIntoViewIfNeeded();await photo.evaluate(async e=>e.decode());check(await photo.isVisible(),`${mode}: foto ${id} disponível`);}
    await context.close();
  }
}catch(error){report.errors.push(error.stack||String(error));}
finally{await browser.close();await fs.writeFile(path.join(out,`menu-photos-${pass}-report.json`),JSON.stringify(report,null,2));}
console.log(JSON.stringify({checks:report.checks.length,viewports:report.viewports.length,failures:report.failures,errors:report.errors,native_transition_skips:report.native_transition_skips},null,2));if(report.failures.length||report.errors.length)process.exitCode=1;
