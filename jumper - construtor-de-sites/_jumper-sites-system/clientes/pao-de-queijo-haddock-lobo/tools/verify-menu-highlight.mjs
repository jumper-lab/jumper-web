import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),pw=require(process.env.JUMPER_PLAYWRIGHT||'/Users/marajah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),output=path.join(root,'data/visual-review'),base=process.env.PREVIEW_URL||'http://127.0.0.1:4327',pass=process.env.JUMPER_MENU_PASS||'final';
await fs.mkdir(output,{recursive:true});
const content=JSON.parse(await fs.readFile(path.join(root,'data/content.json'),'utf8'));
const shortcuts=content.menu.categories.filter(c=>!['smoothies','em-casa'].includes(c.id));
const browser=await pw.chromium.launch({headless:true,...(!existsSync(pw.chromium.executablePath())?{channel:'chrome'}:{})});
const report={date:new Date().toISOString(),pass,checks:[],viewports:[],failures:[],errors:[],native_transition_skips:[]};
const captureError=error=>{if(error.message==='Transition was aborted because of invalid state. ViewTransition opt-in disabled')report.native_transition_skips.push(error.message);else report.errors.push(error.message);};
const check=(ok,label,data)=>{report.checks.push({ok,label,...(data?{data}:{})});if(!ok)report.failures.push(label);};
async function ready(page){await page.evaluate(()=>document.fonts.ready);}
async function rest(page){await page.waitForTimeout(1100);}
async function bounds(locator){return locator.evaluate(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};});}
try{
  for(const width of [320,390,768,1024,1440,1920]){
    const context=await browser.newContext({viewport:{width,height:width<700?844:960}}),page=await context.newPage();page.on('pageerror',captureError);
    await page.goto(base+'/#cardapio',{waitUntil:'networkidle'});await ready(page);await page.locator('.menu-highlight-top').scrollIntoViewIfNeeded();await rest(page);
    const home=await page.evaluate(()=>{
      const links=[...document.querySelectorAll('[data-menu-shortcut]')],title=document.querySelector('#vitrine-heading'),walker=document.createTreeWalker(title,NodeFilter.SHOW_TEXT),letters=[];
      while(walker.nextNode()){const range=document.createRange();range.selectNode(walker.currentNode);letters.push(...range.getClientRects());}
      const r=title.getBoundingClientRect();
      return{overflow:document.documentElement.scrollWidth-innerWidth,title:title.textContent,titleFits:letters.every(l=>l.right<=r.right+1&&l.left>=r.left-1),links:links.map(a=>{const r=a.getBoundingClientRect(),icon=a.querySelector('[data-food-icon]');return{id:a.dataset.menuShortcut,href:a.getAttribute('href'),name:a.getAttribute('aria-label'),width:r.width,height:r.height,icon:icon.dataset.foodIcon,iconVisible:getComputedStyle(icon).display!=='none'&&getComputedStyle(icon).opacity==='1',decorative:icon.getAttribute('aria-hidden')==='true'};})};
    });report.viewports.push({width,home});
    check(home.overflow<=1,`Home@${width}: sem overflow lateral`);
    check(home.title.includes('CARDÁPIO')&&home.titleFits,`Home@${width}: área identificada como cardápio, sem corte no título`);
    check(home.links.length===6&&home.links.every((l,i)=>l.id===shortcuts[i].id&&l.href===`/menu/#${l.id}`&&l.name===shortcuts[i].name),`Home@${width}: seis atalhos com nomes e destinos corretos`);
    check(home.links.every(l=>l.width>=44&&l.height>=44&&l.icon===l.id&&l.iconVisible&&l.decorative),`Home@${width}: ícones visíveis e alvos acessíveis`);
    check(await page.locator('[data-menu-complete]').getAttribute('href')==='/menu/'&&await page.locator('[data-menu-complete] svg').count()===0,`Home@${width}: CTA explícito, sem seta`);
    await page.locator('.menu-highlight-top').screenshot({path:path.join(output,`menu-highlight-${pass}-home-${width}.png`)});
    await page.locator('.menu-home-categories').screenshot({path:path.join(output,`menu-highlight-${pass}-home-icons-${width}.png`)});
    const sample=page.locator('[data-menu-shortcut="salgados"]');const before=await bounds(sample);await sample.hover();await page.waitForTimeout(800);const after=await bounds(sample);
    check(Math.abs(before.width-after.width)<1&&Math.abs(before.height-after.height)<1&&Math.abs(before.x-after.x)<1,`Home@${width}: hover não desloca o alvo`);
    check(await sample.evaluate(e=>getComputedStyle(e).color==='rgb(159, 43, 52)'),`Home@${width}: hover usa vermelho do manual`);
    await page.locator('[data-menu-complete]').click();await page.waitForURL(base+'/menu/');await ready(page);
    check(await page.locator('#menu-title').isVisible(),`Home@${width}: CTA abre o cardápio real`);
    await page.locator('.menu-toolbar').scrollIntoViewIfNeeded();await rest(page);
    check(await page.locator('.menu-toolbar [data-food-icon="carta"]').isVisible(),`Menu@${width}: busca e chamada com ícone de carta`);
    await page.locator('.menu-toolbar').screenshot({path:path.join(output,`menu-highlight-${pass}-toolbar-${width}.png`)});
    const data=await page.evaluate(()=>{
      const nav=document.querySelector('.menu-index'),links=[...nav.querySelectorAll('[data-category-link]')];
      return{overflow:document.documentElement.scrollWidth-innerWidth,caption:getComputedStyle(nav.querySelector('.menu-index-caption')).display,links:links.map(a=>{const r=a.getBoundingClientRect(),icon=a.querySelector('[data-food-icon]');return{id:a.dataset.categoryLink,width:r.width,height:r.height,icon:icon.dataset.foodIcon,visible:getComputedStyle(icon).display!=='none'&&getComputedStyle(icon).opacity==='1',label:getComputedStyle(a.querySelector('.menu-category-label')).fontFamily};}),icons:[...document.querySelectorAll('.menu-category-heading [data-food-icon]')].map(e=>e.dataset.foodIcon),count:document.querySelectorAll('[data-menu-item]').length};
    });report.viewports.at(-1).menu=data;
    check(data.overflow<=1,`Menu@${width}: sem overflow lateral`);
    check(data.caption!=='none'&&data.links.length===8&&data.links.every(l=>l.icon===l.id&&l.visible&&l.width>=44&&l.height>=44&&l.label.includes('Poppins')),`Menu@${width}: oito categorias ilustradas, legíveis e acessíveis`);
    check(data.count===83&&data.icons.join()===content.menu.categories.map(c=>c.id).join(),`Menu@${width}: conteúdo e oito capítulos preservados`);
    await page.locator('.menu-index').screenshot({path:path.join(output,`menu-highlight-${pass}-index-${width}.png`)});
    await page.locator('[data-category-link="doces"]').click();await page.waitForURL(base+'/menu/#doces');await rest(page);
    const category=await bounds(page.locator('#doces')),rail=await bounds(page.locator('.menu-index'));
    check(category.y>=0&&category.y<960&&(width>900||category.y>=rail.bottom-1),`Menu@${width}: âncora deixa o capítulo visível abaixo do índice fixo`,{category,rail});
    check(category.y<(width>900?180:rail.bottom+40),`Menu@${width}: âncora não duplica a reserva de cabeçalho`);
    check(await page.locator('[data-category-link][aria-current="location"]').count()===1&&await page.locator('[data-category-link="doces"]').getAttribute('aria-current')==='location',`Menu@${width}: seleção acompanha o capítulo de destino`);
    check(await page.locator('[data-category-link="doces"] .menu-category-label').evaluate(e=>getComputedStyle(e).transform==='none'),`Menu@${width}: título da categoria não gira nem corta no hover/seleção`);
    await page.screenshot({path:path.join(output,`menu-highlight-${pass}-category-${width}.png`)});
    await page.getByLabel('Buscar no cardápio').fill('pao de queijo');
    check(await page.locator('[data-menu-item]:visible').count()===7,`Menu@${width}: busca sem acentos continua funcionando`);
    await page.locator('[data-clear-search]').click();
    check(await page.locator('[data-menu-item]:visible').count()===83,`Menu@${width}: limpar busca restaura o cardápio`);
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage();page.on('pageerror',captureError);
  for(const category of shortcuts){await page.goto(base+'/#cardapio',{waitUntil:'networkidle'});await page.locator(`[data-menu-shortcut="${category.id}"]`).click();await page.waitForURL(base+`/menu/#${category.id}`);await rest(page);check(await page.locator(`#heading-${category.id}`).isVisible(),`Atalho real: ${category.name} abre seu capítulo`);check(await page.locator(`[data-category-link="${category.id}"]`).getAttribute('aria-current')==='location',`Atalho real: ${category.name} fica selecionado no índice`);}
  await page.goto(base+'/#cardapio',{waitUntil:'networkidle'});await page.locator('[data-menu-shortcut="cafes"]').focus();
  check(await page.locator('[data-menu-shortcut="cafes"]').evaluate(e=>e===document.activeElement&&getComputedStyle(e).outlineStyle!=='none'),'Teclado: atalho de cafés tem foco visível');
  await page.keyboard.press('Enter');await page.waitForURL(base+'/menu/#cafes');check(await page.locator('#heading-cafes').isVisible(),'Teclado: Enter abre cafés');
  await context.close();
  for(const mode of ['no-js','reduced']){
    const context=await browser.newContext({viewport:{width:390,height:844},...(mode==='no-js'?{javaScriptEnabled:false}:{reducedMotion:'reduce'})}),page=await context.newPage();
    await page.goto(base+'/#cardapio',{waitUntil:'networkidle'});await ready(page);await page.locator('[data-menu-shortcut="doces"]').focus();
    check(await page.locator('[data-menu-complete]').isVisible()&&await page.locator('[data-menu-shortcut="doces"] [data-food-icon]').isVisible(),`${mode}: chamada, ícones e atalhos disponíveis`);
    if(mode==='reduced')check(await page.locator('[data-menu-shortcut="doces"] .food-icon-detail').evaluate(e=>getComputedStyle(e).animationName==='none'),`${mode}: sem desenho animado dos ícones`);
    await page.keyboard.press('Enter');await page.waitForURL(base+'/menu/#doces');await rest(page);
    check(await page.locator('#heading-doces').isVisible()&&await page.locator('[data-menu-item]').count()===83,`${mode}: atalhos reais e catálogo preservados`);
    await context.close();
  }
}catch(error){report.errors.push(error.stack||String(error));}
finally{await browser.close();await fs.writeFile(path.join(output,`menu-highlight-${pass}-report.json`),JSON.stringify(report,null,2));}
console.log(JSON.stringify({checks:report.checks.length,viewports:report.viewports.length,failures:report.failures,errors:report.errors,native_transition_skips:report.native_transition_skips},null,2));if(report.failures.length||report.errors.length)process.exitCode=1;
