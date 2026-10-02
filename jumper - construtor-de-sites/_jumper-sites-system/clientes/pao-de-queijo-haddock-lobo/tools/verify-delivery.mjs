import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let playwright;try{playwright=require('playwright');}catch{playwright=require(process.env.JUMPER_PLAYWRIGHT||'/Users/marajah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');}
const output=path.join(root,'data/visual-review'),base=process.env.PREVIEW_URL||'http://127.0.0.1:4327';
await fs.mkdir(output,{recursive:true});
const pass=process.env.JUMPER_DELIVERY_PASS||'final',report={date:new Date().toISOString(),pass,checks:[],errors:[],failures:[],external_orders:'not_sent',limits:'Chrome local; destinations intercepted for link tests, no third-party checkout tested'};
const browser=await playwright.chromium.launch({headless:true,...(!existsSync(playwright.chromium.executablePath())?{channel:'chrome'}:{})});
function check(ok,name,evidence){report.checks.push({name,passed:!!ok,...(evidence?{evidence}:{})});if(!ok)report.failures.push(name);}
const geom=link=>link.evaluate(element=>{const r=element.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};});
async function reveal(page){
  await page.evaluate(()=>document.fonts.ready);
  for(const selector of ['#take-home-heading','.take-home-photo','.delivery-order']){await page.locator(selector).scrollIntoViewIfNeeded();await page.waitForTimeout(1400);}
  await page.locator('.delivery-order').evaluate(async element=>{await Promise.all([...element.querySelectorAll('img')].map(img=>img.decode()));});
  await page.locator('.take-home-photo img').evaluate(image=>image.decode());
}
async function captureSection(page,file){
  // An element taller than the viewport can capture fixed UI above the visible
  // viewport. Align the section first; do not hide real header/skip-link styles.
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(100);
  await page.locator('#delivery').evaluate(element=>element.scrollIntoView({block:'start',behavior:'instant'}));await page.waitForTimeout(400);
  await page.locator('#delivery').screenshot({path:path.join(output,file)});
}
function contrast(a,b){
  const lum=c=>{const v=c.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return .2126*v[0]+.7152*v[1]+.0722*v[2];};
  const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
try{
  for(const width of [320,390,768,1024,1440,1920]){
    const context=await browser.newContext({viewport:{width,height:width<700?844:960}}),page=await context.newPage();
    page.on('pageerror',e=>report.errors.push(e.message));await page.goto(base,{waitUntil:'networkidle'});await reveal(page);
    const section=page.locator('#delivery'),links=section.locator('.delivery-app');
    const data=await section.evaluate(element=>({overflow:document.documentElement.scrollWidth-innerWidth,apps:[...element.querySelectorAll('.delivery-app')].map(a=>{const r=a.getBoundingClientRect(),s=getComputedStyle(a),icon=a.querySelector('img');return {width:r.width,height:r.height,color:s.color,background:s.backgroundColor,icon:icon.complete&&icon.naturalWidth>0,local:new URL(icon.src).origin===location.origin};}),text:element.innerText,columns:getComputedStyle(element.querySelector('.delivery-links')).gridTemplateColumns.split(' ').length}));
    check(data.overflow<=1,`${width}: sem overflow horizontal`,data.overflow);
    check(data.apps.length===2&&data.apps.every(a=>a.icon&&a.local),`${width}: dois ícones reais, carregados localmente`);
    check(data.apps.every(a=>a.width>=44&&a.height>=44&&contrast(a.color,a.background)>=4.5),`${width}: canais com alvo >=44px e contraste AA`);
    const copy=data.text.toLocaleLowerCase('pt-BR');check(copy.includes('peça em casa')&&copy.includes('para assar em casa')&&copy.includes('seu endereço'),`${width}: delivery e opções para assar diferenciados`);
    check(width>700||data.columns===1,`${width}: ações mobile empilhadas`);
    await captureSection(page,`delivery-${pass}-${width}.png`);
    for(const [i,app] of ['iFood','Rappi'].entries()){
      const link=links.nth(i);await link.scrollIntoViewIfNeeded();await page.mouse.move(0,0);await page.waitForTimeout(750);
      const original=await geom(link),other=await geom(links.nth(1-i));
      for(const x of [2,original.width-2]){
        await link.hover({position:{x,y:2}});
        for(const delay of [100,300,300]){await page.waitForTimeout(delay);const frame=await link.evaluate(a=>({color:getComputedStyle(a).color,background:getComputedStyle(a).backgroundColor}));check(contrast(frame.color,frame.background)>=4.5,`${width}/${app}: contraste na entrada pelo canto ${x.toFixed(0)} após ${delay}ms`);}
        await page.mouse.move(0,0);await page.waitForTimeout(80);await link.hover({position:{x:original.width-x,y:original.height-2}});await page.waitForTimeout(220);
      }
      check(JSON.stringify(original)===JSON.stringify(await geom(link))&&JSON.stringify(other)===JSON.stringify(await geom(links.nth(1-i))),`${width}/${app}: hover e reentrada não movem alvos`);
      if(width===1440&&i===0)await captureSection(page,`delivery-${pass}-hover.png`);
      await page.mouse.move(0,0);
    }
    await links.first().focus();await page.waitForTimeout(750);
    check(await links.first().evaluate(a=>a===document.activeElement&&getComputedStyle(a).outlineStyle!=='none'),`${width}: foco de teclado visível`);
    if(width===320)await captureSection(page,`delivery-${pass}-focus-320.png`);
    check(await section.locator('a').evaluateAll(anchors=>anchors[0].classList.contains('delivery-app')&&anchors[1].classList.contains('delivery-app')),`${width}: pedido antes de congelados na ordem do teclado`);
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage();await page.goto(base);await reveal(page);
  const content=JSON.parse(await fs.readFile(path.join(root,'data/content.json'),'utf8'));
  await context.route(/https:\/\/www\.(ifood|rappi)\.com\.br\//,route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Destination intercepted for local QA</title>'}));
  for(const [app,key] of [['iFood','ifood_url'],['Rappi','rappi_url']]){
    const link=page.getByRole('link',{name:`Pedir no ${app} — abre em nova aba`,exact:true});
    check(await link.getAttribute('href')===content.delivery[key]&&await link.getAttribute('target')==='_blank'&&(await link.getAttribute('rel')).includes('noopener'),`${app}: destino original e nova aba protegida`);
    const [popup]=await Promise.all([page.waitForEvent('popup'),link.click()]);await popup.waitForLoadState();check(popup.url()===content.delivery[key],`${app}: clique abre o destino esperado (requisição interceptada)`);await popup.close();
  }
  await page.locator('.take-home-caption .text-link').click();await page.waitForURL('**/menu/#em-casa');check(await page.locator('#em-casa').isVisible(),'Opções para assar: categoria real do cardápio');await context.close();
  for(const mode of ['reduced','no-js']){
    const context=await browser.newContext({viewport:{width:320,height:844},...(mode==='reduced'?{reducedMotion:'reduce'}:{javaScriptEnabled:false})}),page=await context.newPage();await page.goto(base,{waitUntil:'networkidle'});await reveal(page);
    check(await page.locator('#delivery .delivery-app').count()===2&&await page.locator('#delivery .delivery-app img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0)),`${mode}: canais e ícones sem depender de motion/JavaScript`);
    if(mode==='reduced'){await page.locator('.delivery-app').first().hover();check(await page.locator('.delivery-app').first().evaluate(a=>getComputedStyle(a,'::before').transitionDuration==='0s'),'Movimento reduzido: filetes instantâneos');}
    await captureSection(page,`delivery-${pass}-${mode}.png`);await context.close();
  }
}catch(error){report.failures.push(error.message);}
finally{await browser.close();await fs.writeFile(path.join(output,`delivery-${pass}-report.json`),JSON.stringify(report,null,2));}
console.log(JSON.stringify({checks:report.checks.length,failures:report.failures,errors:report.errors},null,2));
if(report.failures.length||report.errors.length)process.exitCode=1;
