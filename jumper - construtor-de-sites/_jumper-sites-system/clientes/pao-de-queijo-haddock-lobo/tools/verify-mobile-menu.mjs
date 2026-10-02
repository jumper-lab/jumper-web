import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'data/visual-review');
const require=createRequire(import.meta.url),pw=require(process.env.JUMPER_PLAYWRIGHT||'/Users/marajah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4327',pass=process.env.JUMPER_MOBILE_MENU_PASS||'final';
const visualOnly=process.env.JUMPER_MOBILE_MENU_VISUAL_ONLY==='1';
const report={date:new Date().toISOString(),checks:[],failures:[],errors:[],native_transition_skips:[],viewports:[]},check=(ok,label)=>{report.checks.push({ok,label});if(!ok)report.failures.push(label);};
const watch=page=>page.on('pageerror',e=>{
  if(e.message==='Transition was aborted because of invalid state. ViewTransition opt-in disabled')report.native_transition_skips.push(e.message);
  else report.errors.push(e.message);
});
const browser=await pw.chromium.launch({headless:true,...(!existsSync(pw.chromium.executablePath())?{channel:'chrome'}:{})});
const routes=visualOnly?[['home','/']]:[['home','/'],['historia','/sobre/'],['lojas','/lojas/'],['menu','/menu/']];
const sizes=visualOnly?[[320,568],[768,960],[1024,960],[1440,960],[844,390],[390,240]]:[[320,568],[390,670],[768,960],[1024,960],[1440,960],[1920,1080],[320,500],[390,844],[844,390],[667,375],[568,320],[390,240]];
async function metrics(page){return page.locator('#mobile-navigation').evaluate(e=>{
  const box=node=>{let r=node.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const close=e.querySelector('[data-close-menu]'),nav=e.querySelector('nav');
  return{rect:box(e),close:box(close),nav:box(nav),links:[...nav.querySelectorAll('a')].map(a=>({label:a.getAttribute('aria-label'),href:a.getAttribute('href'),...box(a),textRight:a.querySelector('.nav-print-original').getBoundingClientRect().right})),window:{width:innerWidth,height:innerHeight},bodyOverflow:getComputedStyle(document.body).overflowY,overflow:e.scrollWidth-e.clientWidth,navOverflow:nav.scrollHeight-nav.clientHeight,closedDisplay:getComputedStyle(e).display,covered:[[1,1],[innerWidth-2,innerHeight-2]].every(([x,y])=>e.contains(document.elementFromPoint(x,y))||document.elementFromPoint(x,y)===e)};
});}
await fs.mkdir(out,{recursive:true});
try{
  for(const [width,height] of sizes){
    for(const [name,route] of routes){
      // At desktop widths we test a menu retained after rotating/resizing, not a new desktop trigger.
      const context=await browser.newContext({viewport:{width:Math.min(width,390),height},hasTouch:true}),page=await context.newPage();watch(page);
      await page.goto(base+route,{waitUntil:'networkidle'});await page.locator('#menu-toggle').click();
      if(width>390)await page.setViewportSize({width,height});await page.waitForTimeout(650);await page.evaluate(()=>document.fonts.ready);
      const d=await metrics(page),label=`${name}@${width}x${height}`;report.viewports.push({label,...d});
      check(Math.abs(d.rect.x)<1&&Math.abs(d.rect.y)<1&&Math.abs(d.rect.width-width)<1&&Math.abs(d.rect.height-height)<1&&d.covered,`${label}: viewport coberto de canto a canto`);
      check(d.overflow<=1&&d.close.x>=0&&d.close.right<=width&&d.close.y>=0&&d.close.bottom<=height&&d.close.width>=44&&d.close.height>=44,`${label}: fechar sempre visível e≥44px`);
      check(d.links.length===6&&d.links.every(a=>a.height>=44&&a.width>=44&&a.textRight<=d.nav.right+1&&a.x>=d.nav.x-1),`${label}: seis links legíveis/alvos44px sem corte horizontal`);
      check(d.bodyOverflow==='hidden'&&d.nav.bottom<=height&&d.closedDisplay==='flex',`${label}: fundo bloqueado e rolagem só dentro do menu`);
      if(height>=500&&width<=700)check(d.navOverflow<=1,`${label}: seis links visíveis sem rolar`);
      const original=await page.evaluate(()=>scrollY);await page.mouse.move(width/2,height/2);await page.mouse.wheel(0,400);await page.waitForTimeout(70);
      check(Math.abs(await page.evaluate(()=>scrollY)-original)<1,`${label}: scroll não desloca a página de fundo`);
      if(d.navOverflow>1){await page.locator('#mobile-navigation nav a').last().scrollIntoViewIfNeeded();check(await page.locator('[data-close-menu]').evaluate(e=>e.getBoundingClientRect().top>=0&&e.getBoundingClientRect().bottom<=innerHeight),`${label}: rolar último link não esconde fechar`);}
      // A wheel positions the pointer on a word. Capture the resting state, not the mid-hover glyph exchange.
      if(name==='home'){await page.mouse.move(1,1);await page.waitForTimeout(800);}
      if(name==='home'&&[320,768,1024,1440].includes(width)&&height>=568)await page.screenshot({path:path.join(out,`mobile-menu-${pass}-${width}.png`)});
      if(name==='home'&&[240,320,375,390,500,670].includes(height))await page.screenshot({path:path.join(out,`mobile-menu-${pass}-${width}x${height}.png`)});
      if(width>700)await page.setViewportSize({width:390,height});
      await page.locator('[data-close-menu]').click();check(await page.locator('#mobile-navigation').isHidden()&&await page.locator('#menu-toggle').evaluate(e=>e===document.activeElement),`${label}: fechar devolve foco ao botão`);
      await context.close();
    }
  }
  const context=await browser.newContext({viewport:{width:390,height:670}}),page=await context.newPage();watch(page);await page.goto(base,{waitUntil:'networkidle'});await page.locator('#menu-toggle').click();
  for(let i=0;i<9;i++){await page.keyboard.press('Tab');check(await page.locator('#mobile-navigation').evaluate(e=>e.contains(document.activeElement)),`keyboard/${i}: foco contido no dialog`);}
  await page.locator('[data-close-menu]').focus();await page.keyboard.press('Shift+Tab');check(await page.locator('#mobile-navigation nav a').last().evaluate(e=>e===document.activeElement),'Shift+Tab do fechar volta ao último link');
  await page.keyboard.press('Escape');check(await page.locator('#mobile-navigation').isHidden()&&await page.locator('#menu-toggle').evaluate(e=>e===document.activeElement),'Escape fecha/restaura foco');
  for(const [label,target] of [['Início','/'],['Nossa história','/sobre/'],['Cardápio','/menu/'],['Eventos','/#eventos'],['Contato','/#contatos'],['Nossas lojas','/lojas/']]){
    await page.goto(base,{waitUntil:'networkidle'});await page.locator('#menu-toggle').click();await page.locator('#mobile-navigation').getByRole('link',{name:label,exact:true}).click();await page.waitForURL(base+target);check(await page.locator('#mobile-navigation').isHidden(),`destination/${label}: destino correto e menu fechado`);
  }
  await context.close();
  for(const mode of ['no-js','reduced']){
    const context=await browser.newContext({viewport:{width:390,height:670},...(mode==='no-js'?{javaScriptEnabled:false}:{reducedMotion:'reduce'})}),page=await context.newPage();await page.goto(base,{waitUntil:'networkidle'});
    if(mode==='no-js')check(await page.locator('#mobile-navigation').isHidden()&&await page.locator('.no-js-nav').isVisible(),'no-js: dialog fechado/navegação alternativa preservada');
    else{await page.locator('#menu-toggle').click();const d=await metrics(page);check(d.rect.height===670&&await page.locator('#mobile-navigation').evaluate(e=>getComputedStyle(e).animationName==='none'),'reduced: tela inteira sem animação');}
    await context.close();
  }
}catch(e){report.errors.push(e.stack||String(e));}
finally{await browser.close();await fs.writeFile(path.join(out,`mobile-menu-${pass}-report.json`),JSON.stringify(report,null,2));}
console.log(JSON.stringify({checks:report.checks.length,failures:report.failures,errors:report.errors,native_transition_skips:report.native_transition_skips},null,2));if(report.failures.length||report.errors.length)process.exitCode=1;
