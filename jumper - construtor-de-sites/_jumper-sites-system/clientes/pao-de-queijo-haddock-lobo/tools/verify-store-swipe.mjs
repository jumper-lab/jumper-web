import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'data/visual-review');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4327',pass=process.env.JUMPER_STORE_SWIPE_PASS||'final';
const require=createRequire(import.meta.url),pw=require(process.env.JUMPER_PLAYWRIGHT||'/Users/marajah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const content=JSON.parse(await fs.readFile(path.join(root,'data/content.json'))),ids=content.locations.map(s=>s.id);
const browser=await pw.chromium.launch({headless:true,...(!existsSync(pw.chromium.executablePath())?{channel:'chrome'}:{})});
const report={date:new Date().toISOString(),checks:[],failures:[],errors:[],viewports:[]};
const check=(ok,label)=>{report.checks.push({ok,label});if(!ok)report.failures.push(label);};
const selected=page=>page.locator('[data-store-id][aria-selected="true"]').getAttribute('data-store-id');
const visiblePhoto=page=>page.locator('.store-panel:not([hidden]) .store-photo');
async function gesture(page,cdp,dx,dy=0,{cancel=false,multi=false}={}){
  const photo=visiblePhoto(page);await photo.scrollIntoViewIfNeeded();await page.waitForTimeout(300);
  const box=await photo.boundingBox(),x=box.x+box.width/2,y=Math.max(80,box.y+box.height/2);
  const point=(xx,yy,id=1)=>({x:xx,y:yy,id,radiusX:2,radiusY:2,force:1});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(x,y)]});
  if(multi)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(x,y),point(x+20,y,2)]});
  for(let n=1;n<=8;n++){
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(x+dx*n/8,y+dy*n/8),...(multi?[point(x+20+dx*n/8,y+dy*n/8,2)]:[])]});
    await page.waitForTimeout(12);
  }
  await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});
  await page.waitForTimeout(330);
}
async function assertUnit(page,index,label){
  const store=content.locations[index],panel=page.locator(`#panel-${store.id}`);
  await panel.locator('img').evaluate(i=>i.decode());
  check(await selected(page)===store.id&&await page.locator('.store-panel:not([hidden])').count()===1,`${label}: seleção única`);
  const data=await panel.evaluate(e=>({name:e.querySelector('h3').textContent,address:e.querySelector('p').textContent,map:e.querySelector('.button').getAttribute('href'),tel:e.querySelector('.phone-link').getAttribute('href'),alt:e.querySelector('img').alt,loaded:e.querySelector('img').naturalWidth>0}));
  check(data.name===store.name&&data.address.includes(store.address)&&data.map===store.map&&data.tel===`tel:${store.tel}`&&data.alt.includes(store.name)&&data.loaded,`${label}: foto/dados/telefone/mapa da mesma unidade`);
}
await fs.mkdir(out,{recursive:true});
try{
  for(const width of [320,390,768,1024,1440,1920]){
    const context=await browser.newContext({viewport:{width,height:960},hasTouch:true,isMobile:width<=700}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
    const cdp=await context.newCDPSession(page);await page.goto(base+'/#loja',{waitUntil:'networkidle'});await visiblePhoto(page).scrollIntoViewIfNeeded();await page.evaluate(()=>document.fonts.ready);
    check(await visiblePhoto(page).evaluate(e=>getComputedStyle(e).touchAction==='pan-y pinch-zoom'),`scroll@${width}: rolagem vertical e pinch liberados`);
    check(await page.locator('[data-store-swipe-note]').isVisible()===(width<=700),`hint@${width}: pista mobile sem alterar desktop`);
    for(let n=1;n<=5;n++){
      const before=await page.evaluate(()=>scrollY);await gesture(page,cdp,-100);
      await assertUnit(page,n%5,`left@${width}/${n}`);
      check(Math.abs(await page.evaluate(()=>scrollY)-before)<2,`left@${width}/${n}: não rola o documento`);
      const fits=await page.locator('[aria-selected="true"][data-store-id]').evaluate(e=>{const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return r.left>=p.left-1&&r.right<=p.right+1;});
      check(fits,`tab@${width}/${n}: aba ativa visível`);
    }
    await gesture(page,cdp,100);await assertUnit(page,4,`right@${width}: primeira→última`);
    await page.locator('#tab-iguatemi').click();await assertUnit(page,1,`button@${width}`);
    await page.locator('#tab-iguatemi').press(width<=700?'ArrowRight':'ArrowDown');await assertUnit(page,2,`keyboard@${width}`);
    for(const [label,dx,dy,options] of [['short',12,0,{}],['diagonal',70,60,{}],['cancel',100,0,{cancel:true}],['multi',-100,0,{multi:true}]]){
      const id=await selected(page);await gesture(page,cdp,dx,dy,options);check(await selected(page)===id,`${label}@${width}: não troca acidentalmente`);
    }
    await visiblePhoto(page).scrollIntoViewIfNeeded();await page.waitForTimeout(300);const y=await page.evaluate(()=>scrollY),id=await selected(page);
    await gesture(page,cdp,0,-100);check(await selected(page)===id&&await page.evaluate(()=>scrollY)>y+20,`vertical@${width}: rola página sem trocar unidade`);
    const photo=visiblePhoto(page);await photo.scrollIntoViewIfNeeded();const b=await photo.boundingBox();await page.mouse.move(b.x+b.width*.7,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width*.2,b.y+b.height/2,{steps:6});await page.mouse.up();check(await selected(page)===id,`mouse@${width}: drag não troca`);
    check((await page.locator('[data-store-swipe-status]').textContent()).includes('Unidade')&&await page.locator('[data-store-swipe-status]').getAttribute('aria-live')==='polite',`status@${width}: anúncio de unidade acessível`);
    check(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1,`overflow@${width}: nenhum corte horizontal`);
    await page.locator('#tab-iguatemi').click();await visiblePhoto(page).scrollIntoViewIfNeeded();await page.waitForTimeout(400);
    await page.locator('[data-store-finder]').screenshot({path:path.join(out,`store-swipe-${pass}-${width}.png`)});report.viewports.push(width);await context.close();
  }
  for(const mode of ['reduced','no-js']){
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,...(mode==='no-js'?{javaScriptEnabled:false}:{reducedMotion:'reduce'})}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(base+'/#loja',{waitUntil:'networkidle'});
    if(mode==='no-js')check(await selected(page)===ids[0]&&await page.locator('[data-store-swipe-note]').isHidden()&&await visiblePhoto(page).evaluate(e=>getComputedStyle(e).touchAction==='auto'),`no-js: ficha original/pista oculta/rolagem nativa`);
    else{await gesture(page,await context.newCDPSession(page),-100);await assertUnit(page,1,'reduced');check(await page.locator('.store-panel:not([hidden])').evaluate(e=>getComputedStyle(e).animationDuration==='0.01ms'||getComputedStyle(e).animationDuration==='0s'),'reduced: sem entrada animada');}
    await context.close();
  }
}catch(e){report.errors.push(e.stack||String(e));}
finally{await browser.close();await fs.writeFile(path.join(out,`store-swipe-${pass}-report.json`),JSON.stringify(report,null,2));}
console.log(JSON.stringify({checks:report.checks.length,failures:report.failures,errors:report.errors},null,2));if(report.failures.length||report.errors.length)process.exitCode=1;
