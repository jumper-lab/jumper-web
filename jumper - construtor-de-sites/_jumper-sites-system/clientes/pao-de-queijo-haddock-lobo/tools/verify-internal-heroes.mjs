import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),pw=require(process.env.JUMPER_PLAYWRIGHT||'/Users/marajah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),output=path.join(root,'data/visual-review'),base=process.env.PREVIEW_URL||'http://127.0.0.1:4327';
const pass=process.env.JUMPER_INTERNAL_PASS||'split-final';await fs.mkdir(output,{recursive:true});
const browser=await pw.chromium.launch({headless:true,...(!existsSync(pw.chromium.executablePath())?{channel:'chrome'}:{})});
const report={date:new Date().toISOString(),pass,checks:[],viewports:[],failures:[],errors:[]};
const check=(ok,label,data)=>{report.checks.push({ok,label,...(data?{data}:{})});if(!ok)report.failures.push(label);};
const routes=[['historia','/sobre/','#origem'],['lojas','/lojas/','#unidades'],['menu','/menu/','#cardapio']];
const viewports=[...([320,390,768,1024,1440,1920].map(width=>({width,height:width<700?844:960}))),{width:320,height:568},{width:320,height:500},{width:844,height:390},{width:1280,height:633},{width:1440,height:600}];
async function ready(page){await page.evaluate(()=>document.fonts.ready);await page.locator('.page-hero-photo img').evaluate(img=>img.decode());await page.waitForFunction(()=>document.querySelector('h1').getAnimations({subtree:true}).every(a=>a.playState==='finished'));}
try{
  for(const viewport of viewports){
    const context=await browser.newContext({viewport}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
    for(const [name,route,anchor] of routes){
      await page.goto(base+route,{waitUntil:'networkidle'});await ready(page);
      const data=await page.evaluate(()=>{
        const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
        const hero=document.querySelector('.page-hero'),copy=document.querySelector('.page-hero-content'),h1=hero.querySelector('h1'),photo=hero.querySelector('img'),frame=hero.querySelector('.page-hero-photo'),header=document.querySelector('.site-header'),caption=hero.querySelector('.photo-label'),action=hero.querySelector('.page-hero-action');
        return{viewport:{width:innerWidth,height:innerHeight},hero:rect(hero),photo:rect(photo),frame:rect(frame),copy:rect(copy),title:rect(h1),action:rect(action),caption:rect(caption),header:rect(header),overflow:document.documentElement.scrollWidth-innerWidth,fit:getComputedStyle(photo).objectFit,headerBackground:getComputedStyle(header).backgroundColor,headerColor:getComputedStyle(header).color,darkLogo:getComputedStyle(header.querySelector('.brand-dark')).display,sizes:photo.sizes,headingCount:document.querySelectorAll('h1').length,next:rect(hero.nextElementSibling)};
      });report.viewports.push({name,route,...data});
      const label=`${name}@${viewport.width}×${viewport.height}`;
      check(Math.abs(data.hero.width-viewport.width)<1&&Math.abs(data.hero.height-viewport.height)<1&&Math.abs(data.hero.y)<1,`${label}: primeira dobra exatamente 100vw × 100vh desde y=0`,data.hero);
      check(Math.abs(data.photo.width-data.frame.width)<1&&Math.abs(data.photo.height-data.frame.height)<1&&data.fit==='cover'&&data.photo.height<viewport.height&&data.sizes.includes('vw')&&(viewport.width<=700?Math.abs(data.photo.width-viewport.width)<1:data.photo.width<viewport.width*.6),`${label}: foto fica no próprio painel, não vira fundo da seção`,data.photo);
      check(data.headerBackground==='rgb(238, 236, 232)'&&data.headerColor==='rgb(19, 39, 61)'&&data.darkLogo!=='none',`${label}: menu navy/papel e marca original`);
      const separated=viewport.width<=700?data.copy.bottom<=data.frame.y+1:name==='historia'?data.copy.x>=data.frame.right-1:data.copy.right<=data.frame.x+1;
      check(data.copy.y>=data.header.bottom+4&&data.copy.bottom<=viewport.height&&data.title.right<=data.copy.right+1&&data.title.x>=data.copy.x-1&&separated,`${label}: texto e foto separados, sem colisão com menu ou corte lateral`,{copy:data.copy,title:data.title,header:data.header,frame:data.frame});
      check(data.action.height>=44&&data.action.width>=44&&data.action.bottom<viewport.height&&data.headingCount===1&&data.overflow<=1,`${label}: CTA acessível, H1 único, sem overflow`);
      check(Math.abs(data.next.y-viewport.height)<1&&data.caption.y>=data.frame.y&&data.caption.bottom<=data.frame.bottom+1,`${label}: legenda dentro da foto e conteúdo após a primeira tela`);
      await page.screenshot({path:path.join(output,`internal-${pass}-${name}-${viewport.width}x${viewport.height}.png`)});
      if(viewport.width===1440&&viewport.height===960){
        await page.locator('.page-hero-action').hover({position:{x:2,y:2}});await page.waitForTimeout(700);await page.screenshot({path:path.join(output,`internal-${pass}-${name}-hover.png`)});
        await page.locator('.page-hero-action').click();await page.waitForURL(base+route+anchor);
        await page.waitForFunction(selector=>document.querySelector(selector).getBoundingClientRect().top<innerHeight,anchor);
        check(await page.locator(anchor).isVisible(),`${name}: CTA leva à seção correta`);
        await page.evaluate(()=>scrollTo({top:1200,behavior:'instant'}));await page.waitForTimeout(100);await page.evaluate(()=>scrollTo({top:1100,behavior:'instant'}));await page.waitForTimeout(450);
        check(await page.locator('.site-header').evaluate(e=>getComputedStyle(e).backgroundColor==='rgb(238, 236, 232)'&&getComputedStyle(e).color==='rgb(19, 39, 61)'),`${name}: menu volta papel/navy fora da foto`);
      }
    }
    await context.close();
  }
  for(const mode of ['no-js','reduced']){
    const context=await browser.newContext({viewport:{width:390,height:844},...(mode==='no-js'?{javaScriptEnabled:false}:{reducedMotion:'reduce'})}),page=await context.newPage();
    for(const[name,route]of routes){await page.goto(base+route,{waitUntil:'networkidle'});await ready(page);check(await page.locator('.page-hero-action').isVisible()&&await page.locator('.page-hero-photo img').evaluate(img=>img.complete&&img.naturalWidth>0),`${name}/${mode}: título, foto e CTA sem depender de animação`);if(mode==='no-js')check(await page.locator('.no-js-nav').evaluate(e=>e.getBoundingClientRect().top>=document.querySelector('.site-header').getBoundingClientRect().bottom),`${name}/no-js: navegação alternativa fora do menu`);await page.screenshot({path:path.join(output,`internal-${pass}-${name}-${mode}.png`)});}
    await context.close();
  }
}catch(error){report.errors.push(error.stack||String(error));}
finally{await browser.close();await fs.writeFile(path.join(output,`internal-${pass}-report.json`),JSON.stringify(report,null,2));}
console.log(JSON.stringify({checks:report.checks.length,viewports:report.viewports.length,failures:report.failures,errors:report.errors},null,2));if(report.failures.length||report.errors.length)process.exitCode=1;
