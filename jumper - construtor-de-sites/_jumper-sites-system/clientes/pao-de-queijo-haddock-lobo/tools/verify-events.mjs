import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),pw=require(process.env.JUMPER_PLAYWRIGHT||'/Users/marajah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'data/visual-review'),base=process.env.PREVIEW_URL||'http://127.0.0.1:4327',pass=process.env.JUMPER_EVENTS_PASS||'final';
const content=JSON.parse(await fs.readFile(path.join(root,'data/content.json'),'utf8'));
await fs.mkdir(out,{recursive:true});
const browser=await pw.chromium.launch({headless:true,...(!existsSync(pw.chromium.executablePath())?{channel:'chrome'}:{})});
const report={date:new Date().toISOString(),pass,checks:[],viewports:[],failures:[],errors:[],native_transition_skips:[]};
const captureError=error=>{if(error.message==='Transition was aborted because of invalid state. ViewTransition opt-in disabled')report.native_transition_skips.push(error.message);else report.errors.push(error.message);};
const check=(ok,label,data)=>{report.checks.push({ok,label,...(data?{data}:{})});if(!ok)report.failures.push(label);};
const ready=async(page,noJS=false)=>{await page.evaluate(()=>document.fonts.ready);if(!noJS)await page.waitForFunction(()=>Math.abs(document.querySelector('#eventos').getBoundingClientRect().top)<=1,{},{timeout:5000});await page.waitForTimeout(1500);};
const geometry=page=>page.evaluate(()=>{
  const area=document.querySelector('#eventos'),r=area.getBoundingClientRect(),copy=area.querySelector('.events-copy').getBoundingClientRect(),photo=area.querySelector('.events-photo').getBoundingClientRect(),img=area.querySelector('.photo'),ir=img.getBoundingClientRect(),title=area.querySelector('h2'),cta=area.querySelector('.button'),b=cta.getBoundingClientRect(),header=document.querySelector('.site-header'),hr=header.getBoundingClientRect(),text=[];
  const walker=document.createTreeWalker(title,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const range=document.createRange();range.selectNode(walker.currentNode);const t=range.getBoundingClientRect();if(t.width)text.push({x:t.x,y:t.y,right:t.right,bottom:t.bottom});}
  const contained=t=>t.x>=copy.left-1&&t.right<=copy.right+1&&t.y>=copy.top-1&&t.bottom<=copy.bottom+1;
  const description=area.querySelector('p:not(.eyebrow)').getBoundingClientRect();
  return{width:innerWidth,height:innerHeight,top:r.top,left:r.left,areaWidth:r.width,areaHeight:r.height,overflow:document.documentElement.scrollWidth-innerWidth,ids:document.querySelectorAll('#eventos').length,title: title.getAttribute('aria-label')||title.textContent,titleFits:text.every(contained),titleTop:Math.min(...text.map(t=>t.y)),titleBottom:Math.max(...text.map(t=>t.bottom)),copy:{top:copy.top,bottom:copy.bottom},photo:{width:photo.width,height:photo.height,top:photo.top},photoFits:Math.abs(ir.width-photo.width)<1&&Math.abs(ir.height-photo.height)<1,imgLoaded:img.complete&&img.naturalWidth>0,cta:{top:b.top,bottom:b.bottom,width:b.width,height:b.height},descriptionFits:description.top>=copy.top&&description.bottom<=b.top,href:cta.getAttribute('href'),protected:cta.target==='_blank'&&cta.rel.includes('noopener')&&cta.rel.includes('noreferrer'),headerBottom:hr.bottom,headerVisible:Number(getComputedStyle(header).opacity)>.1&&!header.classList.contains('is-away'),overlay:!!document.querySelector('astro-error-overlay,.vite-error-overlay')};
});
try{
  for(const [width,height] of [[320,844],[390,844],[768,960],[1024,960],[1440,960],[1920,1080],[320,500],[360,640],[700,740],[844,390],[1024,600],[1440,600],[667,375],[568,320],[740,360]]){
    const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();page.on('pageerror',captureError);await page.goto(base+'/#eventos',{waitUntil:'networkidle'});await ready(page);const d=await geometry(page);report.viewports.push(d);const label=`Eventos@${width}x${height}`;
    check(Math.abs(d.top)<=1&&Math.abs(d.left)<=1&&d.ids===1,`${label}: âncora inicia a dobra y=0`,{top:d.top});
    check(Math.abs(d.areaWidth-width)<=1&&Math.abs(d.areaHeight-height)<=1&&d.overflow<=1,`${label}: seção 100vw × 100vh sem overflow`);
    check(d.title.includes('CLÁSSICO')&&d.titleFits,`${label}: título inteiro no painel`);
    check(d.descriptionFits&&d.cta.top>=d.copy.top&&d.cta.bottom<=height+1,`${label}: descrição e ação cabem na dobra`);
    check(d.cta.width>=44&&d.cta.height>=44&&d.href===content.conversion.event_whatsapp_href&&d.protected,`${label}: WhatsApp preservado e alvo acessível`);
    check(d.photoFits&&d.imgLoaded&&d.photo.width>0&&d.photo.height>0,`${label}: foto real ocupa apenas seu painel`);
    check(!d.headerVisible||d.titleTop>=d.headerBottom-1,`${label}: cabeçalho não cobre o título`);
    check(!d.overlay,`${label}: sem overlay de erro`);
    await page.screenshot({path:path.join(out,`events-${pass}-${width}x${height}.png`)});
    if([320,768,1440].includes(width)){const cta=page.locator('#eventos .button'),before=await cta.boundingBox();await cta.hover();await page.waitForTimeout(650);const after=await cta.boundingBox();check(['x','y','width','height'].every(k=>Math.abs(before[k]-after[k])<1),`${label}: hover não move o alvo`);await cta.focus();check(await cta.evaluate(e=>e===document.activeElement&&getComputedStyle(e).outlineStyle!=='none'),`${label}: foco visível`);}
    await context.close();
  }
  for(const width of [320,768,1024,1440]){
    const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage();page.on('pageerror',captureError);
    for(const route of ['/','/sobre/','/menu/','/lojas/']){
      await page.goto(base+route,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
      if(width<=700){await page.locator('#menu-toggle').click();await page.locator('.mobile-navigation').getByRole('link',{name:'Eventos',exact:true}).click();}
      else await page.locator('.desktop-nav').getByRole('link',{name:'Eventos',exact:true}).click();
      await page.waitForURL(base+'/#eventos');await ready(page);check(Math.abs((await geometry(page)).top)<=1&&await page.locator('.mobile-navigation').isHidden(),`Menu ${route}@${width}: início da dobra e diálogo fechado`);
    }
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage();await page.goto(base+'/menu/',{waitUntil:'networkidle'});await page.locator('.site-footer').getByRole('link',{name:'Eventos',exact:true}).click();await page.waitForURL(base+'/#eventos');await ready(page);check(Math.abs((await geometry(page)).top)<=1,'Rodapé interno: Eventos chega ao início da dobra');
  await page.goBack({waitUntil:'networkidle'});check(new URL(page.url()).pathname==='/menu/','Histórico: voltar retorna à página interna');await page.goForward({waitUntil:'networkidle'});await ready(page);check(Math.abs((await geometry(page)).top)<=1,'Histórico: avançar conserva início da dobra');
  await page.evaluate(()=>{window.__eventDestination='';document.querySelector('#eventos .button').addEventListener('click',e=>{window.__eventDestination=e.currentTarget.getAttribute('href');e.preventDefault();});});await page.locator('#eventos .button').focus();await page.keyboard.press('Enter');check(await page.evaluate(()=>window.__eventDestination)===content.conversion.event_whatsapp_href,'Teclado: ação correta, interceptada sem enviar mensagem');await context.close();
  for(const mode of ['no-js','reduced']){
    const context=await browser.newContext({viewport:{width:320,height:500},...(mode==='no-js'?{javaScriptEnabled:false}:{reducedMotion:'reduce'})}),page=await context.newPage();page.on('pageerror',captureError);await page.goto(base+'/#eventos',{waitUntil:'networkidle'});await ready(page,mode==='no-js');const d=await geometry(page);check(d.titleFits&&d.descriptionFits&&d.cta.bottom<=501&&Math.abs(d.top)<=1,`${mode}: dobra/âncora/ação íntegras em tela baixa`);await page.screenshot({path:path.join(out,`events-${pass}-${mode}.png`)});await context.close();
  }
}catch(error){report.errors.push(error.stack||String(error));}
finally{await browser.close();await fs.writeFile(path.join(out,`events-${pass}-report.json`),JSON.stringify(report,null,2));}
console.log(JSON.stringify({checks:report.checks.length,viewports:report.viewports.length,failures:report.failures,errors:report.errors,native_transition_skips:report.native_transition_skips},null,2));if(report.failures.length||report.errors.length)process.exitCode=1;
