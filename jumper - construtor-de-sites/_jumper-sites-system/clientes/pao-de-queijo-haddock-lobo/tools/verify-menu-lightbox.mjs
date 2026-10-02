import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'data/visual-review'),base=process.env.PREVIEW_URL||'http://127.0.0.1:4327',pass=process.env.JUMPER_LIGHTBOX_PASS||'final';
const require=createRequire(import.meta.url),pw=require(process.env.JUMPER_PLAYWRIGHT||'/Users/marajah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const categories=JSON.parse(await fs.readFile(path.join(root,'data/content.json'))).menu.categories;
await fs.mkdir(out,{recursive:true});
const browser=await pw.chromium.launch({headless:true,...(!existsSync(pw.chromium.executablePath())?{channel:'chrome'}:{})});
const report={date:new Date().toISOString(),pass,checks:[],viewports:[],failures:[],errors:[],native_transition_skips:[]};
const check=(ok,label,data)=>{report.checks.push({ok,label,...(data?{data}:{})});if(!ok)report.failures.push(label);};
const watch=page=>page.on('pageerror',error=>error.message==='Transition was aborted because of invalid state. ViewTransition opt-in disabled'?report.native_transition_skips.push(error.message):report.errors.push(error.message));
const waitPhoto=page=>page.waitForFunction(()=>{const img=document.querySelector('#expanded-photo'),dialog=document.querySelector('#photo-dialog');return dialog.open&&!img.hidden&&img.complete&&img.naturalWidth>0&&dialog.getAttribute('aria-busy')==='false';});
const geometry=locator=>locator.evaluate(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};});
const same=(a,b)=>['x','y','w','h'].every(k=>Math.abs(a[k]-b[k])<1);
try{
  for(const width of [320,390,768,1024,1440,1920]){
    const context=await browser.newContext({viewport:{width,height:width<700?844:960}}),page=await context.newPage();watch(page);
    await page.goto(base+'/menu/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
    check(await page.locator('[data-menu-photo]:enabled').count()===8&&await page.locator('#photo-dialog').count()===1,`menu@${width}: oito acionadores e somente um lightbox`);
    for(const category of categories){
      const trigger=page.locator(`#${category.id} [data-menu-photo]`);
      await trigger.scrollIntoViewIfNeeded();await trigger.locator('.photo').evaluate(e=>e.decode());
      check(await trigger.getAttribute('aria-label')===`Ampliar foto: ${category.name}`&&await trigger.getAttribute('aria-haspopup')==='dialog',`${category.id}@${width}: botão nomeado por categoria`);
      if(category.id==='em-casa'){
        const before=await geometry(trigger);await trigger.hover();await page.waitForTimeout(900);
        const hover=await trigger.evaluate(e=>({scale:getComputedStyle(e.querySelector('.photo')).scale,frame:getComputedStyle(e,'::before').clipPath,cue:getComputedStyle(e.querySelector('.menu-photo-cue>span')).opacity}));
        check(same(before,await geometry(trigger))&&hover.scale==='1.025'&&hover.frame==='inset(0px)'&&hover.cue==='1',`hover@${width}: filetes/indicador e aproximação sem deslocar o alvo`,hover);
        await page.locator('#em-casa .menu-category-heading').screenshot({path:path.join(out,`menu-lightbox-${pass}-hover-${width}.png`)});
      }
      await trigger.click();await waitPhoto(page);await page.waitForTimeout(550);
      const state=await page.locator('#photo-dialog').evaluate(e=>{const r=e.getBoundingClientRect(),img=e.querySelector('img'),close=e.querySelector('[data-close-photo]').getBoundingClientRect(),frame=e.querySelector('.photo-dialog-frame'),fr=frame.getBoundingClientRect(),cr=e.querySelector('#photo-caption').getBoundingClientRect();return{src:img.currentSrc,alt:img.alt,caption:e.querySelector('#photo-caption').textContent,open:e.open,focusInside:e.contains(document.activeElement),close44:close.width>=44&&close.height>=44,frameVisible:fr.top>=r.top&&fr.bottom<=r.bottom+1,captionVisible:cr.bottom<=r.bottom+1,fits:r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1,overflow:document.documentElement.scrollWidth-innerWidth,locked:getComputedStyle(document.body).overflow==='hidden',crop:e.dataset.zoomCrop,clip:getComputedStyle(frame).overflow,transform:getComputedStyle(img).transform,frame:{w:fr.width,h:fr.height}};});
      report.viewports.push({width,id:category.id,...state});
      check(new URL(state.src).origin===new URL(base).origin&&state.src===base+await trigger.getAttribute('data-zoom-src')&&state.alt.length>10&&state.caption.startsWith(category.name),`${category.id}@${width}: foto maior local/alt/legenda corretos`);
      check(state.fits&&state.close44&&state.frameVisible&&state.captionVisible&&state.overflow<=1&&state.locked&&state.focusInside,`${category.id}@${width}: imagem/legenda/fechar cabem; fundo e foco contidos`,state);
      if(category.id==='smoothies')check(state.crop==='smoothies'&&state.clip==='hidden'&&state.transform!=='none'&&Math.abs(state.frame.w-state.frame.h)<1,`smoothies@${width}: enquadramento ampliado também oculta a carta antiga`);
      else check(!state.crop&&state.transform==='none',`${category.id}@${width}: não herda crop de outra fotografia`);
      if(['smoothies','em-casa'].includes(category.id))await page.screenshot({path:path.join(out,`menu-lightbox-${pass}-${category.id}-${width}.png`)});
      for(let i=0;i<3;i++){await page.keyboard.press('Tab');check(await page.locator('#photo-dialog').evaluate(e=>e.contains(document.activeElement)),`${category.id}@${width}: Tab${i+1} permanece no diálogo`);}
      if(category.id==='em-casa')await page.getByRole('button',{name:'Fechar foto ampliada'}).click();else await page.keyboard.press('Escape');
      await page.waitForFunction(id=>!document.querySelector('#photo-dialog').open&&document.activeElement===document.querySelector(`#${id} [data-menu-photo]`),category.id);
      check(await trigger.evaluate(e=>e===document.activeElement)&&await page.evaluate(()=>getComputedStyle(document.body).overflow!=='hidden'),`${category.id}@${width}: fecha e devolve foco/rolagem`);
    }
    const smoothie=page.locator('#smoothies [data-menu-photo]');await smoothie.focus();
    check(await smoothie.evaluate(e=>getComputedStyle(e).outlineStyle!=='none'&&getComputedStyle(e).outlineColor==='rgb(159, 43, 52)'),`teclado@${width}: foco de ampliação vermelho visível`);
    await page.keyboard.press('Enter');await waitPhoto(page);check(await page.locator('#photo-dialog').isVisible()&&(await page.locator('#photo-caption').innerText()).startsWith('Smoothies'),`teclado@${width}: Enter abre a fotografia correta`);await page.keyboard.press('Escape');
    await page.getByLabel('Buscar no cardápio').fill('baunilha');check(await page.locator('[data-menu-photo]:visible').count()===1&&await smoothie.isVisible(),`busca@${width}: fotografia acionável acompanha o resultado`);
    await page.locator('[data-clear-search]').click();check(await page.locator('[data-menu-item]:visible').count()===83&&await page.locator('[data-menu-photo]:visible').count()===8,`busca@${width}: reset preserva83 itens e8 fotografias`);
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage();watch(page);
  await page.goto(base+'/menu/',{waitUntil:'networkidle'});
  const trigger=page.locator('#em-casa [data-menu-photo]'),full=base+await trigger.getAttribute('data-zoom-src');
  await page.route(full,route=>route.abort());await trigger.click();
  await page.waitForFunction(()=>document.querySelector('#photo-load-status').textContent.includes('Não foi possível'));
  check(await page.locator('#expanded-photo').isHidden()&&await page.locator('#photo-load-status').isVisible(),'Falha de imagem: mensagem honesta sem foto anterior/quebrada');
  await page.keyboard.press('Escape');await page.unroute(full);await trigger.click();await waitPhoto(page);check(await page.locator('#expanded-photo').getAttribute('src')===await trigger.getAttribute('data-zoom-src'),'Falha de imagem: fechar/tentar novamente recupera fotografia');await page.keyboard.press('Escape');
  await trigger.click();await waitPhoto(page);const rect=await page.locator('#photo-dialog').boundingBox();await page.mouse.click(5,5);
  check(rect.x>5&&await page.locator('#photo-dialog').isHidden(),'Backdrop: clique externo fecha o diálogo');
  let release;const blocked=new Promise(resolve=>{release=resolve;});await page.route(full,async route=>{await blocked;await route.abort().catch(()=>{});});
  await trigger.click();await page.waitForFunction(()=>document.querySelector('#photo-dialog').getAttribute('aria-busy')==='true');await page.keyboard.press('Escape');
  await page.locator('#bebidas [data-menu-photo]').click();await waitPhoto(page);release();await page.unroute(full);await page.waitForTimeout(300);
  check((await page.locator('#photo-caption').innerText()).startsWith('Bebidas')&&!(await page.locator('#expanded-photo').getAttribute('src')).includes('congelados'),'Reabertura rápida: carregamento anterior não sobrescreve foto/legenda atuais');
  await page.keyboard.press('Escape');await context.close();
  for(const mode of ['touch','reduced','no-js']){
    const context=await browser.newContext({viewport:{width:390,height:844},...(mode==='touch'?{isMobile:true,hasTouch:true}:mode==='reduced'?{reducedMotion:'reduce'}:{javaScriptEnabled:false})}),page=await context.newPage();watch(page);await page.goto(base+'/menu/',{waitUntil:'networkidle'});
    const trigger=page.locator('#em-casa [data-menu-photo]');await trigger.scrollIntoViewIfNeeded();
    if(mode==='no-js')check(await page.locator('[data-menu-photo]:disabled').count()===8&&await trigger.locator('.photo').isVisible()&&await trigger.locator('.menu-photo-cue').isHidden(),'Sem JS: fotos disponíveis, botões/pista não sugerem ampliação ativa');
    else{
      if(mode==='touch'){check(await trigger.locator('.menu-photo-cue>span').evaluate(e=>getComputedStyle(e).opacity==='1'),'Toque: pista de ampliar disponível sem hover');await trigger.tap();}else{await trigger.hover();await page.waitForTimeout(50);check(await trigger.locator('.photo').evaluate(e=>getComputedStyle(e).transitionDuration==='0s'&&getComputedStyle(e).scale==='1'),'Movimento reduzido: sem aproximação animada');await trigger.click();}
      await waitPhoto(page);check(await page.locator('#photo-dialog').isVisible(),`${mode}: lightbox continua disponível`);
      if(mode==='reduced')check(await page.locator('.photo-dialog-frame').evaluate(e=>getComputedStyle(e).animationName==='none'),'Movimento reduzido: revelação da imagem desativada');await page.keyboard.press('Escape');
    }await context.close();
  }
  for(const route of ['/','/sobre/']){
    const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage();watch(page);await page.goto(base+route,{waitUntil:'networkidle'});const trigger=page.locator('.photo-button[data-zoom-src]').first();await trigger.click();await waitPhoto(page);check(await page.locator('#photo-dialog').evaluate(e=>!e.dataset.zoomCrop&&e.dataset.zoomMenu==='false'),`Galeria existente ${route}: foto inteira, sem herdar tratamento do cardápio`);await page.keyboard.press('Escape');check(await trigger.evaluate(e=>e===document.activeElement),`Galeria existente ${route}: Escape/foco preservados`);await context.close();
  }
}catch(error){report.errors.push(error.stack||String(error));}
finally{await browser.close();await fs.writeFile(path.join(out,`menu-lightbox-${pass}-report.json`),JSON.stringify(report,null,2));}
console.log(JSON.stringify({checks:report.checks.length,viewports:report.viewports.length,failures:report.failures,errors:report.errors,native_transition_skips:report.native_transition_skips},null,2));if(report.failures.length||report.errors.length)process.exitCode=1;
