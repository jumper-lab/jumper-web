import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'data/visual-review'),base=process.env.PREVIEW_URL||'http://127.0.0.1:4327',pass=process.env.JUMPER_MENU_ICONS_PASS||'final';
const require=createRequire(import.meta.url),pw=require(process.env.JUMPER_PLAYWRIGHT||'/Users/marajah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const content=JSON.parse(await fs.readFile(path.join(root,'data/content.json')));
const browser=await pw.chromium.launch({headless:true,...(!existsSync(pw.chromium.executablePath())?{channel:'chrome'}:{})});
const report={date:new Date().toISOString(),checks:[],viewports:[],failures:[],errors:[]},check=(ok,label)=>{report.checks.push({ok,label});if(!ok)report.failures.push(label);};
await fs.mkdir(out,{recursive:true});
try{
  for(const width of [320,390,768,1024,1440,1920]){
    const context=await browser.newContext({viewport:{width,height:width<700?844:960}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
    await page.goto(base+'/menu/',{waitUntil:'networkidle'});await page.locator('.menu-closing').scrollIntoViewIfNeeded();await page.evaluate(()=>document.fonts.ready);await page.locator('.menu-delivery-link img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
    const data=await page.locator('.menu-closing').evaluate(e=>({overflow:document.documentElement.scrollWidth-innerWidth,links:[...e.querySelectorAll('.menu-delivery-link')].map(a=>{const r=a.getBoundingClientRect(),img=a.querySelector('img'),ir=img.getBoundingClientRect();return{label:a.getAttribute('aria-label'),text:a.textContent,href:a.href,target:a.target,rel:a.rel,local:new URL(img.currentSrc).origin===location.origin,src:new URL(img.currentSrc).pathname,loaded:img.complete&&img.naturalWidth>0,alt:img.alt,filter:getComputedStyle(img).filter,width:r.width,height:r.height,iconWidth:ir.width,iconHeight:ir.height,left:r.left,right:r.right,top:r.top};})}));report.viewports.push({width,...data});
    check(data.overflow<=1&&data.links.length===2&&data.links.every(a=>a.left>=0&&a.right<=width+1)&&Math.abs(data.links[0].top-data.links[1].top)<1,`layout@${width}: dois canais agrupados, sem overflow ou corte`);
    check(data.links.every((a,i)=>a.loaded&&a.local&&a.src===`/brand/delivery-${i?'rappi':'ifood'}.png`&&a.alt===''&&a.filter==='none'&&a.iconWidth===28&&a.iconHeight===28),`icons@${width}: arquivos oficiais locais carregados,28px e sem recoloração`);
    check(data.links.every((a,i)=>a.href===content.delivery[i?'rappi_url':'ifood_url']&&a.target==='_blank'&&a.rel.includes('noopener')&&a.rel.includes('noreferrer')&&a.label.includes('nova aba')),`links@${width}: destinos originais e nova aba segura/anunciada`);
    check(data.links.every(a=>a.width>=44&&a.height>=44)&&await page.locator('.menu-closing>.button').getAttribute('href')==='/lojas/',`actions@${width}: alvos44px e encontrar loja preservado`);
    const link=page.locator('.menu-delivery-link').first(),before=await link.boundingBox();await link.hover();await page.waitForTimeout(600);const after=await link.boundingBox();
    check(Math.abs(before.x-after.x)<1&&Math.abs(before.y-after.y)<1&&Math.abs(before.width-after.width)<1&&Math.abs(before.height-after.height)<1,`hover@${width}: alvo e logo imóveis`);
    await link.focus();check(await link.evaluate(e=>e===document.activeElement&&getComputedStyle(e).outlineStyle!=='none'),`keyboard@${width}: foco visível`);
    await page.locator('.menu-closing').screenshot({path:path.join(out,`menu-icons-${pass}-${width}.png`)});await context.close();
  }
  for(const mode of ['no-js','reduced']){
    const context=await browser.newContext({viewport:{width:390,height:844},...(mode==='no-js'?{javaScriptEnabled:false}:{reducedMotion:'reduce'})}),page=await context.newPage();await page.goto(base+'/menu/',{waitUntil:'networkidle'});await page.locator('.menu-closing').scrollIntoViewIfNeeded();await page.locator('.menu-delivery-link img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));check(await page.locator('.menu-delivery-link').count()===2&&await page.locator('.menu-delivery-link img').first().isVisible(),`${mode}: ícones e links disponíveis`);await context.close();
  }
}catch(e){report.errors.push(e.stack||String(e));}
finally{await browser.close();await fs.writeFile(path.join(out,`menu-icons-${pass}-report.json`),JSON.stringify(report,null,2));}
console.log(JSON.stringify({checks:report.checks.length,failures:report.failures,errors:report.errors},null,2));if(report.failures.length||report.errors.length)process.exitCode=1;
