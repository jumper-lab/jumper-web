import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const pw=require(process.env.JUMPER_PLAYWRIGHT||'/Users/marajah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {PNG}=require('/Users/marajah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pngjs');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'data/visual-review');await fs.mkdir(output,{recursive:true});
const baseline=process.env.JUMPER_QA_BASELINE==='1';
const prefix=baseline?'type-hover-before':'type-hover-after';
const browser=await pw.chromium.launch({headless:true,...(!existsSync(pw.chromium.executablePath())?{channel:'chrome'}:{})});
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4327';
const report={date:new Date().toISOString(),baseline,checks:[],errors:[],text:[],comparisons:[]};
const check=(ok,label,data)=>report.checks.push({ok,label,...(data?{data}:{})});
const geom=el=>el.evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}});
function contrast(a,b){
  const luminance=color=>{const c=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});return c[0]*.2126+c[1]*.7152+c[2]*.0722};
  const first=luminance(a),second=luminance(b);return (Math.max(first,second)+.05)/(Math.min(first,second)+.05);
}
async function inkFrame(button){
  const s=await button.evaluate(e=>{
    const style=getComputedStyle(e),ink=getComputedStyle(e,'::before');
    return {color:style.color,base:style.backgroundColor,ink:ink.backgroundColor,scale:Number(ink.transform.match(/matrix\(([^)]+)\)/)?.[1].split(',')[0]||0),returning:e.classList.contains('is-ink-returning')};
  });return {...s,baseContrast:contrast(s.color,s.base),inkContrast:s.scale>.02?contrast(s.color,s.ink):99};
}
async function staticFrame(page){
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{const pause=document.querySelector('[data-slideshow-pause]');if(pause&&pause.getAttribute('aria-pressed')==='false')pause.click();document.querySelectorAll('.type-reveal,.photo-unfold').forEach(e=>e.classList.add('is-revealed'));document.getAnimations().forEach(a=>{if(a.effect.getTiming().iterations!==Infinity)a.finish()});});
  await page.waitForTimeout(50);
}
async function clipping(page,selector,name){
  const element=page.locator(selector);await element.scrollIntoViewIfNeeded();await staticFrame(page);
  const box=await element.boundingBox();
  const viewport=page.viewportSize();
  const clip={x:Math.max(0,box.x-12),y:Math.max(0,box.y-30),width:Math.min(viewport.width-Math.max(0,box.x-12),box.width+24),height:Math.min(viewport.height-Math.max(0,box.y-30),box.height+60)};
  const original=await page.screenshot({path:path.join(output,`${prefix}-${name}-normal.png`),clip});
  const style=await page.addStyleTag({content:'.hero-line,.type-line-clip{overflow:visible!important}'});
  const exposed=await page.screenshot({path:path.join(output,`${prefix}-${name}-unmasked.png`),clip});
  await style.evaluate(e=>e.remove());
  const a=PNG.sync.read(original),b=PNG.sync.read(exposed);let changed=0;
  // Compositor rounding can differ by a few RGB levels without losing glyph ink.
  for(let i=0;i<a.data.length;i+=4)if(Math.max(...[0,1,2].map(c=>Math.abs(a.data[i+c]-b.data[i+c])))>8)changed++;
  report.comparisons.push({name,changedPixels:changed,rgbTolerance:8});
  check(changed===0,`Tipografia ${name}: máscara não corta pixels significativos do texto`,{changedPixels:changed});
}
try{
  const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  for(const route of ['/','/sobre/','/lojas/','/menu/','/404.html']){
    await page.goto(base+route,{waitUntil:'networkidle'});await staticFrame(page);
    const texts=await page.evaluate(()=>({body:document.body.innerText,attributes:[...document.querySelectorAll('[aria-label],[alt],[placeholder],meta[name="description"]')].map(e=>e.getAttribute('aria-label')||e.getAttribute('alt')||e.getAttribute('placeholder')||e.getAttribute('content')).filter(Boolean)}));
    const words=(texts.body+' '+texts.attributes.join(' ')).match(/\b(?:pao|paes|cafe|cafes|cardapio|classico|voce|sao|nao|historia|geracoes|proxima|comeca|comecou|comeco|endereco|tambem|acucar|rucula|sanduiche|sanduiches|opcoes|informacoes|frances)\b/gi)||[];
    report.text.push({route,...texts,missingAccents:words});check(!words.length,`Texto ${route}: grafias acentuadas no conteúdo visível`,words);
    if(route==='/'){
      await clipping(page,'.immersive-title','hero-classico');
      await clipping(page,'#history-heading','geracoes');
      await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(100);
      const button=page.locator('.hero-primary');await button.hover({position:{x:2,y:2}});await page.waitForTimeout(800);
      const ink=await button.evaluate(e=>{
        const r=e.getBoundingClientRect(),s=getComputedStyle(e,'::before'),parts=s.transform.match(/matrix\(([^)]+)\)/)?.[1].split(',').map(Number)||[1];
        const x=parseFloat(s.left),y=parseFloat(s.top),radius=parseFloat(s.width)/2*parts[0];
        return {radius,needed:Math.hypot(Math.max(x,r.width-x),Math.max(y,r.height-y)),color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor};
      });check(ink.radius>=ink.needed,'Hover: tinta cobre a área inteira entrando pelo canto',ink);
      await button.screenshot({path:path.join(output,`${prefix}-primary-corner.png`)});
      const entryFrames=[];await page.mouse.move(800,260);await page.waitForTimeout(750);
      await button.hover({position:{x:2,y:2}});
      for(const delay of [0,50,120,250,300]){await page.waitForTimeout(delay);entryFrames.push(await inkFrame(button));}
      check(entryFrames.every(s=>s.baseContrast>=4.5&&s.inkContrast>=4.5),'Botão claro: contraste AA durante toda a entrada',entryFrames);
      const exitFrames=[];await page.mouse.move(800,260);
      for(const delay of [0,50,120,250,300]){await page.waitForTimeout(delay);exitFrames.push(await inkFrame(button));}
      check(exitFrames.every(s=>s.baseContrast>=4.5&&s.inkContrast>=4.5),'Botão claro: contraste AA enquanto a tinta retorna',exitFrames);
      const box=await button.boundingBox();await button.hover({position:{x:box.width-3,y:box.height-3}});await page.waitForTimeout(70);
      await page.mouse.move(800,260);await page.waitForTimeout(70);await button.hover({position:{x:3,y:box.height-3}});await page.waitForTimeout(90);
      const reentry=await inkFrame(button);check(reentry.baseContrast>=4.5&&reentry.inkContrast>=4.5,'Reentrada rápida pelo canto oposto conserva contraste',reentry);
      await page.mouse.move(800,260);await page.waitForTimeout(100);
      check(await button.evaluate(e=>getComputedStyle(e).color!=='rgb(255, 255, 255)'||getComputedStyle(e).backgroundColor!=='rgb(238, 236, 232)'),'Hover: saída não deixa letras brancas sobre papel');
      const nav=page.getByRole('link',{name:'Cardápio',exact:true}).first();const before=await geom(nav);
      await nav.hover();await page.waitForTimeout(750);const after=await geom(nav);
      check(JSON.stringify(before)===JSON.stringify(after),'Menu: hover não desloca a área clicável');
      await page.locator('.desktop-nav').screenshot({path:path.join(output,`${prefix}-nav-hover.png`)});
      const navButton=page.locator('.nav-button');await navButton.hover({position:{x:2,y:2}});await page.waitForTimeout(200);
      const navInk=await inkFrame(navButton);check(navInk.baseContrast>=4.5&&navInk.inkContrast>=4.5,'Menu transparente: botão mantém contraste durante o hover',navInk);
      await page.locator('.photo-button').first().hover();await staticFrame(page);
      await page.locator('.photo-button').first().screenshot({path:path.join(output,`${prefix}-photo-hover.png`)});
      const footer=page.locator('.footer-bottom nav');await footer.scrollIntoViewIfNeeded();await staticFrame(page);await page.mouse.move(1400,200);
      const last=footer.getByRole('link',{name:'Eventos',exact:true}),position=await geom(last);
      await footer.getByRole('link',{name:'História',exact:true}).hover();await page.waitForTimeout(650);
      check(JSON.stringify(position)===JSON.stringify(await geom(last)),'Rodapé: hover não empurra os links vizinhos');
      const delivery=page.locator('.delivery-links'),rappi=delivery.getByRole('link',{name:'Pedir no Rappi — abre em nova aba',exact:true});await delivery.scrollIntoViewIfNeeded();await page.mouse.move(1400,200);
      const rappiBefore=await geom(rappi);await delivery.getByRole('link',{name:'Pedir no iFood — abre em nova aba',exact:true}).hover();await page.waitForTimeout(650);
      check(JSON.stringify(rappiBefore)===JSON.stringify(await geom(rappi)),'Delivery: hover não empurra o serviço vizinho');
      const red=page.locator('.events-copy .button');await red.hover({position:{x:2,y:2}});await page.waitForTimeout(200);
      const redInk=await inkFrame(red);check(redInk.baseContrast>=4.5&&redInk.inkContrast>=4.5,'Botão vermelho: tinta e rótulo mantêm contraste',redInk);
    }
    if(route==='/sobre/'){
      await clipping(page,'#story-title','voce');await clipping(page,'.history-narrative h2','comecou');
      const button=page.locator('.visit-invitation .button');await button.hover({position:{x:2,y:2}});await page.waitForTimeout(800);
      await button.screenshot({path:path.join(output,`${prefix}-visit-hover.png`)});
      const visit=await inkFrame(button);check(visit.baseContrast>=4.5&&visit.inkContrast>=4.5,'Botão no fundo navy: tinta e rótulo permanecem legíveis',visit);
    }
    if(route==='/menu/')check(texts.body.includes('Água São Lourenço')&&texts.body.includes('Sanduíches')&&texts.body.includes('Pão francês'),'Cardápio: acentos e cedilha preservados em nomes/ingredientes');
  }
  await page.goto(base);await staticFrame(page);await page.mouse.move(1400,200);
  await page.locator('.hero-primary').focus();await page.waitForTimeout(750);
  const keyboard=await inkFrame(page.locator('.hero-primary'));
  check(keyboard.baseContrast>=4.5&&keyboard.inkContrast>=4.5,'Foco de teclado mantém o contraste do hover');
  await page.setViewportSize({width:320,height:844});await page.getByRole('button',{name:'Menu',exact:true}).click();await page.waitForTimeout(600);
  const mobile=page.locator('#mobile-navigation').getByRole('link',{name:'Cardápio',exact:true});await mobile.hover();await page.waitForTimeout(750);
  check(await mobile.getAttribute('aria-label')==='Cardápio'&&await mobile.locator('.nav-glyph').allTextContents().then(g=>g.includes('á')),'Menu mobile: grafema á permanece íntegro no hover');
  await page.locator('#mobile-navigation').screenshot({path:path.join(output,`${prefix}-mobile-hover.png`)});
  await page.keyboard.press('Escape');
  for(const width of [320,768,1024,1440]){
    await page.setViewportSize({width,height:width<700?844:960});await page.goto(base,{waitUntil:'networkidle'});await staticFrame(page);
    await clipping(page,'.immersive-title',`hero-${width}`);
    await page.screenshot({path:path.join(output,`${prefix}-home-${width}.png`)});
  }
  await context.close();
}catch(e){report.errors.push(e.stack||String(e))}
finally{await browser.close();await fs.writeFile(path.join(output,`${prefix}-report.json`),JSON.stringify(report,null,2))}
console.log(JSON.stringify({checks:report.checks.length,failures:report.checks.filter(c=>!c.ok),errors:report.errors},null,2));
if(!baseline&&(report.errors.length||report.checks.some(c=>!c.ok)))process.exitCode=1;
