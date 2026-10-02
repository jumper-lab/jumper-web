import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(process.env.JUMPER_PLAYWRIGHT || '/Users/marajah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }
const output = path.join(root,'data/visual-review');
await fs.mkdir(output,{recursive:true});
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4327';
const executable = playwright.chromium.executablePath();
const browser = await playwright.chromium.launch({headless:true,...(!existsSync(executable)?{channel:'chrome'}:{})});
const report = {date:new Date().toISOString(),url:base,viewports:[],interactions:[],seo:[],errors:[]};
const widths = process.env.JUMPER_QA_MODE==='flows'?[]:[320,390,768,1024,1440,1920];
const routes = [['home','/'],['historia','/sobre/'],['lojas','/lojas/'],['menu','/menu/']];
const check = (condition, message) => { if (!condition) throw new Error(message); report.interactions.push(message); };
try {
  for (const width of widths) {
    const context = await browser.newContext({viewport:{width,height:width<700?844:960},deviceScaleFactor:1});
    const page = await context.newPage();
    page.on('pageerror',error=>report.errors.push(error.message));
    for (const [name,route] of routes) {
      await page.goto(base+route,{waitUntil:'networkidle'});
      await page.evaluate(()=>document.fonts.ready);
      await page.waitForFunction(()=>document.querySelectorAll('.immersive-title .hero-line>span').length===0 || [...document.querySelectorAll('.immersive-title .hero-line>span')].every(line=>line.getAnimations().every(animation=>animation.playState==='finished')));
      await page.waitForFunction(()=>{const heading=document.querySelector('h1');return (!heading.classList.contains('type-reveal')||heading.classList.contains('is-revealed'))&&heading.getAnimations({subtree:true}).every(animation=>animation.playState==='finished')});
      const data = await page.evaluate(() => {
        const hero = document.querySelector('.home-hero,.page-hero');
        const rect = hero.getBoundingClientRect();
        const targets = [...document.querySelectorAll('a,button,input')].filter(element => {
          const rect = element.getBoundingClientRect(); const style = getComputedStyle(element);
          return rect.width>0 && rect.height>0 && style.visibility!=='hidden' && !element.closest('dialog:not([open]),[aria-hidden="true"]') && !element.classList.contains('skip-link');
        }).filter(element => {const rect = element.getBoundingClientRect();return rect.height<43.5 || rect.width<43.5;}).map(element=>({text:element.textContent.trim().slice(0,50),width:Math.round(element.getBoundingClientRect().width),height:Math.round(element.getBoundingClientRect().height)}));
        const heading = document.querySelector('h1');
        return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,heroWidth:rect.width,heroHeight:rect.height,heroTop:rect.top,h1:heading.textContent.trim(),h1Count:document.querySelectorAll('h1').length,targets,broken:[...document.images].filter(img=>img.hasAttribute('src')&&img.complete&&!img.naturalWidth).map(img=>img.src)};
      });
      report.viewports.push({name,route,...data});
      if (data.scrollWidth > width+1) report.errors.push(`${name}@${width}: overflow ${data.scrollWidth-width}px`);
      if (data.h1Count !== 1) report.errors.push(`${name}@${width}: ${data.h1Count} h1s`);
      if (data.heroWidth < width*.9) report.errors.push(`${name}@${width}: hero width`);
      if(Math.abs(data.heroWidth-width)>1 || Math.abs(data.heroHeight-(width<700?844:960))>1 || Math.abs(data.heroTop)>1) report.errors.push(`${name}@${width}: hero não ocupa exatamente o viewport desde y=0`);
      if (data.broken.length) report.errors.push(`${name}@${width}: missing images`);
      if (data.targets.length) report.errors.push(`${name}@${width}: ${data.targets.length} alvos menores que 44px`);
      await page.screenshot({path:path.join(output,`${name}-${width}-hero.png`)});
      if ([390,1440].includes(width)) {
        await page.evaluate(async()=>{const images=[...document.querySelectorAll('img[src]')];images.forEach(image=>image.loading='eager');await Promise.all(images.map(image=>image.decode().catch(()=>{})));});
        // Visit each section before a full-page capture so the real scroll effects finish.
        await page.evaluate(async()=>{
          const sections=[...document.querySelectorAll('main>section,footer')];
          for(const section of sections){section.scrollIntoView({behavior:'instant',block:'center'});await new Promise(resolve=>setTimeout(resolve,1500));}
          window.scrollTo({top:0,behavior:'instant'});
        });
        await page.screenshot({path:path.join(output,`${name}-${width}-full.png`),fullPage:true});
        if(name==='home') for(const selector of ['.home-story','.vitrine-section','.store-section','.events-section','.take-home-section','.site-footer']) await page.locator(selector).screenshot({path:path.join(output,`home-${width}-${selector.slice(1)}.png`)});
        if(name==='menu') for(const selector of ['.menu-toolbar','.menu-category']) await page.locator(selector).first().screenshot({path:path.join(output,`menu-${width}-${selector.slice(1)}.png`)});
      }
    }
    await context.close();
  }
  const context = await browser.newContext({viewport:{width:1440,height:960}});
  const page = await context.newPage();
  page.on('pageerror',error=>report.errors.push(error.message));
  await page.goto(base,{waitUntil:'networkidle'});
  check(await page.locator('.site-header').evaluate(element=>getComputedStyle(element).backgroundColor==='rgba(0, 0, 0, 0)'),'Hero: menu inicial transparente sobre a fotografia');
  check(await page.locator('.hero-slide.is-active img').evaluate(element=>getComputedStyle(element).objectFit==='cover'),'Hero: foto cobre toda a seção');
  check(await page.locator('.scene-selector[aria-pressed="true"]').count()===1,'Slideshow: exatamente uma fotografia selecionada');
  await page.locator('[data-scene-select="1"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-scene="1"]').classList.contains('is-active'));
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-scene="1"]')).opacity==='1');
  check(await page.locator('[data-scene-caption]').innerText()==='O tempo de um café','Slideshow: seleção manual mostra o café e sua legenda');
  check(await page.locator('[data-slideshow]').getAttribute('data-playback')==='paused','Slideshow: seleção manual pausa a reprodução');
  await page.screenshot({path:path.join(output,'hero-scene-cafe.png')});
  await page.locator('[data-scene-select="2"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-scene="2"]').classList.contains('is-active'));
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-scene="2"]')).opacity==='1');
  check(await page.locator('[data-scene="2"] img').evaluate(image=>image.complete&&image.naturalWidth>0),'Slideshow: mesa só aparece após a foto carregar');
  await page.screenshot({path:path.join(output,'hero-scene-mesa.png')});
  await page.locator('[data-slideshow-pause]').click();
  await page.locator('.immersive-actions a').first().focus();await page.mouse.move(720,240);
  await page.waitForFunction(()=>document.querySelector('[data-slideshow]').dataset.playback==='playing');
  await page.waitForFunction(()=>document.querySelector('[data-scene="0"]').classList.contains('is-active'),{},{timeout:11000});
  check(await page.locator('[data-scene="0"]').getAttribute('aria-hidden')==='false','Slideshow: reprodução automática suave retorna à primeira foto');
  await page.locator('[data-slideshow-pause]').click();
  check(await page.locator('[data-slideshow]').getAttribute('data-playback')==='paused','Slideshow: controle de pausa interrompe a reprodução');
  await page.locator('.immersive-actions a').first().focus();
  await page.evaluate(()=>window.scrollTo({top:300,behavior:'instant'}));
  await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.site-header')).opacity)<.6);
  check(await page.locator('.site-header').evaluate(element=>Number(getComputedStyle(element).opacity)<.6),'Home: cabeçalho perde opacidade ao rolar para baixo');
  await page.evaluate(()=>window.scrollTo({top:1100,behavior:'instant'}));
  await page.waitForFunction(()=>document.querySelector('.site-header').classList.contains('is-away'));
  await page.evaluate(()=>window.scrollTo({top:1000,behavior:'instant'}));
  await page.waitForFunction(()=>!document.querySelector('.site-header').classList.contains('is-away'));
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('.site-header')).backgroundColor==='rgb(238, 236, 232)');
  check(await page.locator('.site-header').evaluate(element=>getComputedStyle(element).backgroundColor==='rgb(238, 236, 232)'),'Home: menu volta legível ao rolar para cima fora da hero');
  await page.goto(base,{waitUntil:'networkidle'});
  await page.keyboard.press('Tab');
  check(await page.locator('.skip-link').evaluate(element=>element===document.activeElement),'Teclado: primeira parada é Pular para o conteúdo');
  await page.keyboard.press('Enter');
  check(new URL(page.url()).hash==='#conteudo','Teclado: skip-link leva ao conteúdo principal');
  for (const id of ['haddock','iguatemi','higienopolis','sirio','leblon']) {
    await page.locator(`#tab-${id}`).click();
    check(await page.locator(`#panel-${id}`).isVisible(),`Home: ficha da unidade ${id} funciona`);
  }
  await page.getByRole('tab',{name:'05 Shopping Leblon Rio de Janeiro'}).click();
  check(await page.locator('#panel-leblon').isVisible(),'Home: seletor mostra Shopping Leblon e oculta demais unidades');
  check(await page.locator('#panel-haddock').isHidden(),'Home: uma ficha selecionada por vez');
  await page.getByRole('tab',{name:'05 Shopping Leblon Rio de Janeiro'}).press('Home');
  check(await page.locator('#tab-haddock').getAttribute('aria-selected')==='true','Home: navegação de abas com Home funciona');
  await page.getByRole('tab',{name:'01 Haddock Lobo São Paulo'}).press('ArrowDown');
  check(await page.locator('#tab-iguatemi').getAttribute('aria-selected')==='true','Home: seta vertical seleciona unidade');
  check(await page.locator('a[href^="mailto:"]').first().getAttribute('href')==='mailto:paodequeijo@paodequeijohaddocklobo.com.br','Contato: e-mail público usa mailto correto');
  check((await page.locator('#eventos a[href*="api.whatsapp.com"]').getAttribute('href')).includes('5511943286072'),'Eventos: número público de WhatsApp preservado');
  for (const service of ['ifood.com.br','rappi.com.br','instagram.com']) check(await page.locator(`a[href*="${service}"]`).count()>0,`Canal oficial presente: ${service}`);
  check(await page.locator('[data-contact-form]').count()===1&&await page.locator('[data-contact-submit]').isDisabled()&&await page.locator('#contact-form-note').textContent().then(t=>t.includes('configuração')),'Contatos: campos disponíveis, envio honestamente inativo sem serviço configurado');
  await page.locator('[data-zoom-src]').first().click();
  check(await page.locator('#photo-dialog').isVisible(),'Galeria: abre fotografia real ampliada');
  await page.keyboard.press('Escape');
  check(await page.locator('#photo-dialog').isHidden(),'Galeria: Escape fecha o diálogo');
  check(await page.evaluate(()=>document.activeElement.hasAttribute('data-zoom-src')),'Galeria: foco retorna ao botão de origem');
  await page.goto(base+'/lojas/',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Rio de Janeiro',exact:true}).click();
  check(await page.locator('[data-location-region]:visible').count()===1,'Lojas: filtro Rio mostra uma unidade');
  check(await page.locator('#leblon').isVisible(),'Lojas: unidade do filtro Rio é Shopping Leblon');
  await page.getByRole('button',{name:'São Paulo',exact:true}).click();
  check(await page.locator('[data-location-region]:visible').count()===4,'Lojas: filtro São Paulo mostra quatro unidades');
  await page.getByRole('button',{name:'Todas',exact:true}).click();
  check(await page.locator('[data-location-region]:visible').count()===5,'Lojas: limpar filtro restaura cinco unidades');
  check((await page.locator('#sirio a').first().getAttribute('href')).includes('Sirio'),'Lojas: mapa do Sírio não aponta para Higienópolis');
  await page.goto(base+'/menu/',{waitUntil:'networkidle'});
  check(await page.locator('[data-menu-item]').count()===83,'Cardápio: 83 itens/adicionais migrados');
  await page.getByLabel('Buscar no cardápio').fill('pao de queijo');
  check(await page.locator('[data-menu-item]:visible').count()===7,'Cardápio: busca sem acentos encontra sete itens de pão de queijo');
  await page.getByLabel('Buscar no cardápio').fill('rosbife');
  check(await page.locator('[data-menu-item]:visible').count()===1,'Cardápio: busca por ingrediente funciona');
  await page.getByLabel('Buscar no cardápio').fill('sanduiches');
  check(await page.locator('[data-menu-category]:visible').count()===1 && await page.locator('#sanduiches').isVisible(),'Cardápio: busca pelo nome da categoria funciona');
  await page.getByLabel('Buscar no cardápio').fill('xyzinexistente');
  check(await page.locator('[data-menu-empty]').isVisible(),'Cardápio: busca sem resultado mostra estado útil');
  await page.getByRole('button',{name:'Ver todo o cardápio'}).click();
  check(await page.locator('[data-menu-item]:visible').count()===83,'Cardápio: reset restaura todos os itens');
  await page.locator('[data-category-link="doces"]').click();
  check(new URL(page.url()).hash==='#doces','Cardápio: âncora de categoria leva ao destino correto');
  await page.goto(base+'/menu/#colageno',{waitUntil:'networkidle'});
  await page.waitForURL('**/menu/#bebidas',{timeout:5000});
  check(new URL(page.url()).hash==='#bebidas','URL legado: colageno encaminha para Bebidas');
  await page.goto(base+'/menu/#sopa',{waitUntil:'networkidle'});
  await page.waitForURL('**/menu/#tortas',{timeout:5000});
  check(new URL(page.url()).hash==='#tortas','URL legado: sopa encaminha para Tortas');
  const urls = new Set();
  const titles = new Set();
  const descriptions = new Set();
  for (const [name,route] of routes) {
    await page.goto(base+route,{waitUntil:'networkidle'});
    const seo=await page.evaluate(()=>({title:document.title,description:document.querySelector('meta[name="description"]')?.content,canonical:document.querySelector('link[rel="canonical"]')?.href,og:document.querySelector('meta[property="og:image"]')?.content,lang:document.documentElement.lang,alt:[...document.images].filter(i=>!i.hasAttribute('alt')).length,links:[...document.querySelectorAll('a[href]')].map(a=>a.href),hashes:[...document.querySelectorAll('a[href]')].filter(a=>a.origin===location.origin&&a.pathname===location.pathname&&a.hash).map(a=>({hash:a.hash,exists:!!document.getElementById(decodeURIComponent(a.hash.slice(1)))}))}));
    report.seo.push({name,...seo});
    check(seo.lang==='pt-BR' && !!seo.title && !!seo.description && !!seo.canonical && !!seo.og && seo.alt===0,`SEO/semântica: ${name}`);
    check(!seo.hashes.some(hash=>!hash.exists),`Âncoras internas: ${name}`);
    titles.add(seo.title);descriptions.add(seo.description);
    seo.links.filter(url=>url.startsWith(base)).forEach(url=>urls.add(url.split('#')[0]));
  }
  check(titles.size===4 && descriptions.size===4,'SEO: títulos e descrições únicos por página');
  for(const url of urls){const response=await page.request.get(url);check(response.status()===200,`Rota interna: ${new URL(url).pathname}`)}
  for(const route of ['/sitemap.xml','/robots.txt','/favicon.png','/404.html']){const response=await page.request.get(base+route);check(response.status()===200,`Arquivo técnico: ${route}`)}
  const config=JSON.parse(await fs.readFile(path.join(root,'jumper.config.json'),'utf8'));
  for(const mapping of config.site.reformulation.url_map){
    await page.goto(base+mapping.from,{waitUntil:'networkidle'});
    if (mapping.action==='redirect') await page.waitForURL(base+mapping.to,{timeout:5000});
    const actual=new URL(page.url());
    const expected=new URL(base+mapping.to);
    check(actual.pathname===expected.pathname && actual.hash===expected.hash && (!actual.hash || await page.locator(actual.hash).count()>0),`URL preservado: ${mapping.from} → ${mapping.to}`);
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Menu',exact:true}).click();
  check(await page.locator('#mobile-navigation').isVisible(),'Menu mobile: abre o diálogo');
  await page.waitForFunction(()=>document.querySelector('#mobile-navigation').getAnimations().every(animation=>animation.playState==='finished'));
  await page.screenshot({path:path.join(output,'mobile-menu-open.png')});
  await page.keyboard.press('Escape');
  check(await page.locator('#mobile-navigation').isHidden(),'Menu mobile: Escape fecha');
  check(await page.locator('#menu-toggle').evaluate(element=>element===document.activeElement),'Menu mobile: foco restaurado');
  await page.getByRole('button',{name:'Menu',exact:true}).click();
  await page.locator('#mobile-navigation').getByRole('link',{name:'Cardápio'}).click();
  await page.waitForURL('**/menu/');
  check(await page.locator('h1').innerText()==='UM CLÁSSICO.\nMUITOS FAVORITOS.','Menu mobile: navegação real para Cardápio');
  await page.getByLabel('Buscar no cardápio').fill('xyzinexistente');
  await page.screenshot({path:path.join(output,'mobile-menu-empty.png'),fullPage:true});
  await context.close();
  const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const bare=await noJS.newPage();await bare.goto(base+'/menu/');
  check(await bare.locator('[data-menu-item]').count()===83,'Sem JavaScript: catálogo completo permanece no HTML');
  check(await bare.locator('.no-js-nav').isVisible(),'Sem JavaScript: navegação alternativa aparece no celular');
  await bare.goto(base);
  check(await bare.locator('.hero-slide.is-active img').evaluate(image=>image.complete&&image.naturalWidth>0),'Sem JavaScript: primeira fotografia da hero permanece visível');
  check(await bare.locator('.hero-controls').isHidden(),'Sem JavaScript: controles de slideshow inativos não aparecem');
  await noJS.close();
  const reduced=await browser.newContext({reducedMotion:'reduce'});const quiet=await reduced.newPage();await quiet.goto(base);
  check(await quiet.locator('.photo-button').first().evaluate(element=>getComputedStyle(element.querySelector('img')).transitionDuration==='0s'),'Movimento reduzido: transições desativadas');
  check(await quiet.locator('[data-slideshow]').getAttribute('data-playback')==='paused','Movimento reduzido: slideshow não roda automaticamente');
  await quiet.locator('[data-scene-select="1"]').click();
  await quiet.waitForFunction(()=>document.querySelector('[data-scene="1"]').classList.contains('is-active'));
  check(await quiet.locator('[data-scene="1"]').evaluate(element=>getComputedStyle(element).transitionDuration==='0s'),'Movimento reduzido: troca manual instantânea continua disponível');
  await reduced.close();
} catch(error){report.errors.push(error.stack||error.message)}
finally{await browser.close();await fs.writeFile(path.join(output,process.env.JUMPER_QA_MODE==='flows'?'flow-verification-report.json':'verification-report.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({viewports:report.viewports.length,checks:report.interactions.length,errors:report.errors,small_targets:report.viewports.filter(v=>v.targets.length).map(v=>({name:v.name,width:v.width,count:v.targets.length}))},null,2));
if(report.errors.length) process.exitCode=1;
