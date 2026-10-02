import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const pw=require(process.env.JUMPER_PLAYWRIGHT||'/Users/marajah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'data/visual-review');await fs.mkdir(output,{recursive:true});
const baseline=process.env.JUMPER_QA_BASELINE==='1';
const browser=await pw.chromium.launch({headless:true,...(!existsSync(pw.chromium.executablePath())?{channel:'chrome'}:{})});
const report={date:new Date().toISOString(),baseline,checks:[],failures:[],errors:[],native_transition_skips:[],headers:[]};
const captureError=error=>{
  // Chrome can skip a native cross-document transition on history navigation.
  // Keep the warning as evidence; every other page error remains a test failure.
  if(error.message==='Transition was aborted because of invalid state. ViewTransition opt-in disabled') report.native_transition_skips.push(error.message);
  else report.errors.push(error.message);
};
const check=(ok,label,data)=>{report.checks.push({label,ok,...(data?{data}:{})});if(!ok)report.failures.push(label)};
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4327';
const measure=page=>page.evaluate(()=>{
  const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
  return {header:rect('.site-header'),brand:rect('.site-header .brand'),nav:rect(innerWidth>900?'.desktop-nav':'.mobile-menu-button')};
});
try{
  for(const width of [320,768,1024,1440,1920]){
    const context=await browser.newContext({viewport:{width,height:960}}),page=await context.newPage();
    page.on('pageerror',captureError);
    const values=[];
    for(const route of ['/','/sobre/','/lojas/','/menu/']){
      await page.goto(base+route,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
      values.push({route,...await measure(page)});
    }
    report.headers.push({width,values});
    check(values.slice(1).every(v=>['header','brand','nav'].every(key=>['x','y','width','height'].every(axis=>Math.abs(v[key][axis]-values[0][key][axis])<1.1))),`Cabeçalho idêntico nas quatro rotas @${width}`,values);
    await page.goto(base);await page.evaluate(()=>scrollTo({top:1100,behavior:'instant'}));
    await page.waitForTimeout(100);await page.evaluate(()=>scrollTo({top:1000,behavior:'instant'}));await page.waitForTimeout(450);
    const outside=await measure(page);
    check(['header','brand','nav'].every(key=>['x','y','width','height'].every(axis=>Math.abs(outside[key][axis]-values[0][key][axis])<1.1)),`Menu não muda de tamanho após a hero @${width}`);
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage();
  page.on('pageerror',captureError);
  await page.goto(base,{waitUntil:'networkidle'});await page.waitForTimeout(1000);
  await page.locator('[data-slideshow-pause]').click();await page.locator('[data-slideshow-pause]').click();
  check(await page.locator('[data-slideshow]').getAttribute('data-playback')==='playing','Retomar funciona com mouse e foco mantidos no botão');
  await page.locator('[data-scene-select="0"]').focus();
  check(await page.locator('[data-slideshow]').getAttribute('data-playback')==='paused','Foco em outro controle suspende reprodução');
  await page.locator('.hero-primary').focus();await page.mouse.move(800,260);
  await page.waitForTimeout(900);
  const previous=await page.locator('.hero-slide.is-active').getAttribute('data-scene');
  const target=(Number(previous)+1)%3;
  const outgoing=page.locator(`[data-scene="${previous}"] img`);
  const before=await outgoing.evaluate(e=>getComputedStyle(e).transform);
  await page.locator(`[data-scene-select="${target}"]`).click();
  await page.waitForFunction(i=>document.querySelector(`[data-scene="${i}"]`).classList.contains('is-active'),target);
  const after=await outgoing.evaluate(e=>getComputedStyle(e).transform);
  const optical=matrix=>Number(matrix.match(/matrix\(([^)]+)\)/)?.[1].split(',')[0]||1);
  check(Math.abs(optical(before)-optical(after))<.002,'Foto anterior conserva o zoom durante a dissolução',{before,after});
  await page.waitForTimeout(500);
  const layers=await page.locator('[data-scene]').evaluateAll(es=>es.map(e=>({index:e.dataset.scene,opacity:Number(getComputedStyle(e).opacity),z:Number(getComputedStyle(e).zIndex)})));
  check(layers.some(e=>e.index===previous&&e.opacity===1),'Foto anterior permanece opaca sob a nova durante a troca',layers);
  await page.screenshot({path:path.join(output,baseline?'bug-before-slideshow.png':'bugfix-slideshow-midpoint.png')});
  await page.waitForTimeout(1300);
  await page.locator('[data-scene-select="2"]').click();await page.locator('[data-scene-select="1"]').click();await page.locator('[data-scene-select="0"]').click();
  await page.waitForTimeout(3600);
  check(await page.locator('[data-scene="0"]').getAttribute('aria-hidden')==='false','Cliques durante dissolução terminam na última fotografia escolhida');
  check(await page.locator('.hero-slide.is-active').count()===1,'Após cliques rápidos só uma cena permanece ativa');
  check((await page.locator('.hero-edition').innerText()).includes('Uma pausa com história'),'Assinatura inclusiva sem restringir a marca a São Paulo');
  await page.locator('[data-slideshow-pause]').focus();
  await page.locator('[data-slideshow-pause]').press('Enter');
  check(await page.locator('[data-slideshow]').getAttribute('data-playback')==='playing','Retomar pelo teclado funciona sem desfocar o botão');
  await page.waitForFunction(()=>document.querySelector('[data-scene="1"]').classList.contains('is-active'),null,{timeout:11000});
  check(await page.locator('[data-slideshow-pause]').evaluate(e=>e===document.activeElement),'Autoplay avança mesmo com foco mantido após Retomar');
  await page.locator('.hero-primary').focus();await page.mouse.move(800,250);
  await page.evaluate(()=>scrollTo({top:1500,behavior:'instant'}));
  const pauseStarted=await page.evaluate(()=>performance.now());
  // IntersectionObserver is asynchronous. Wait for actual suspension, not a 100ms sample.
  await page.waitForFunction(()=>document.querySelector('.home-hero').getBoundingClientRect().bottom<=0&&document.querySelector('[data-slideshow]').dataset.playback==='paused',null,{timeout:3000});
  report.offscreen_pause=await page.evaluate(start=>({elapsed_ms:performance.now()-start,hero_bottom:document.querySelector('.home-hero').getBoundingClientRect().bottom,playback:document.querySelector('[data-slideshow]').dataset.playback}),pauseStarted);
  check(await page.locator('[data-slideshow]').getAttribute('data-playback')==='paused','Reprodução suspensa ao sair da tela');
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.waitForFunction(()=>document.querySelector('[data-slideshow]').dataset.playback==='playing',null,{timeout:3000});
  check(await page.locator('[data-slideshow]').getAttribute('data-playback')==='playing','Reprodução volta ao retornar à hero');
  const transitions=[];
  await page.addInitScript(()=>{
    window.addEventListener('DOMContentLoaded',()=>{
      window.__frames=[];const t=performance.now();
      const sample=()=>{const h=document.querySelector('.site-header'),title=document.querySelector('h1');if(h&&title)window.__frames.push({ms:performance.now()-t,header:h.getBoundingClientRect().toJSON(),opacity:getComputedStyle(title).opacity,mask:getComputedStyle(document.documentElement,'::view-transition-new(root)').maskImage});if(performance.now()-t<850)requestAnimationFrame(sample)};sample();
    });
  });
  for(const [link,route] of [['Nossa história','/sobre/'],['Cardápio','/menu/'],['Nossas lojas','/lojas/']]){
    await page.getByRole('link',{name:link,exact:true}).first().click();await page.waitForURL(base+route);
    await page.waitForTimeout(180);await page.screenshot({path:path.join(output,`${baseline?'bug-before':'bugfix'}-navigation-${route.split('/')[1]}-early.png`)});
    await page.waitForTimeout(700);const frames=await page.evaluate(()=>window.__frames||[]);transitions.push({route,frames});
    check(frames.length>2&&!frames.some(f=>f.mask!=='none'),`Troca ${route}: sem máscara integral que oculte a nova página`);
    check(await page.locator('h1').isVisible()&&await page.locator('.site-header').isVisible(),`Troca ${route}: título e navegação acessíveis`);
  }
  report.transitions=transitions;
  await page.goBack();await page.waitForURL(base+'/menu/');await page.goBack();await page.waitForURL(base+'/sobre/');await page.goBack();await page.waitForURL(base+'/');
  await page.waitForTimeout(300);
  check(await page.locator('[data-slideshow-ready]').count()===1,'Voltar pelo histórico restaura controles uma vez');
  await page.locator('[data-scene-select="2"]').click();await page.waitForTimeout(1800);
  check(await page.locator('[data-scene="2"]').getAttribute('aria-hidden')==='false','Slideshow continua interativo após voltar pelo histórico');
  await page.locator('[data-slideshow-pause]').click();await page.locator('.hero-primary').focus();await page.mouse.move(800,250);
  await page.evaluate(()=>scrollTo({top:1500,behavior:'instant'}));await page.waitForTimeout(150);
  const footerMenu=page.locator('.site-footer').getByRole('link',{name:'Cardápio',exact:true});
  await footerMenu.scrollIntoViewIfNeeded();await page.waitForTimeout(100);
  const departureScroll=await page.evaluate(()=>scrollY);
  await footerMenu.click();await page.waitForURL(base+'/menu/');
  await page.goBack();await page.waitForURL(base+'/');
  // Native restoration inherits smooth scrolling. A fixed 150ms measured the
  // beginning of that animation (260px), not its restored position (~5560px).
  await page.waitForFunction(y=>Math.abs(scrollY-y)<40,departureScroll,{timeout:6000});
  await page.waitForFunction(()=>document.querySelector('[data-slideshow]').dataset.playback==='paused');
  report.history_restore={departure:departureScroll,restored:await page.evaluate(()=>scrollY)};
  check(await page.evaluate(()=>scrollY>900),'Histórico restaura posição de rolagem na Home');
  check(await page.locator('[data-slideshow]').getAttribute('data-playback')==='paused','Histórico não retoma a hero fora da tela');
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForFunction(()=>scrollY===0);await page.waitForTimeout(150);
  check(await page.locator('[data-slideshow]').getAttribute('data-playback')==='playing','Histórico retoma ao voltar à fotografia');
  for(const viewport of [{width:1280,height:633},{width:1440,height:600}]){
    await page.setViewportSize(viewport);
    const fits=await page.evaluate(()=>{
      const signature=document.querySelector('.hero-edition').getBoundingClientRect(),controls=document.querySelector('.hero-bottom').getBoundingClientRect();
      return signature.top>=document.querySelector('.site-header').getBoundingClientRect().bottom&&signature.bottom<controls.top;
    });
    check(fits,`Assinatura vertical não invade menu/controles @${viewport.width}×${viewport.height}`);
  }
  await context.close();
  const bareContext=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),bare=await bareContext.newPage();
  await bare.goto(base+'/menu/',{waitUntil:'networkidle'});
  const clear=await bare.locator('.no-js-nav').evaluate(e=>e.getBoundingClientRect().top>=document.querySelector('.site-header').getBoundingClientRect().bottom);
  check(clear,'Sem JavaScript: navegação alternativa não fica sob o cabeçalho fixo');
  await bare.locator('.no-js-nav').getByRole('link',{name:'Lojas',exact:true}).click();await bare.waitForURL(base+'/lojas/');
  check(await bare.locator('[data-location-region]').count()===5,'Sem JavaScript: navegação alternativa continua clicável');
  await bareContext.close();
}catch(e){report.errors.push(e.stack||String(e))}
finally{await browser.close();await fs.writeFile(path.join(output,baseline?'bugs-baseline-report.json':'navigation-report.json'),JSON.stringify(report,null,2))}
console.log(JSON.stringify({checks:report.checks.length,failures:report.failures,errors:report.errors,native_transition_skips:report.native_transition_skips},null,2));
if(!baseline&&(report.failures.length||report.errors.length))process.exitCode=1;
