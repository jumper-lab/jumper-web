import {chromium, firefox, webkit} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.REVIEW_URL||'http://127.0.0.1:4326/rodeio';
const out=`data/visual-review/menu-mobile-viewport/${process.env.REVIEW_LABEL||'local'}`;
await fs.mkdir(out,{recursive:true});
const report={date:new Date().toISOString(),base,note:'Desktop browser engines with emulated viewports. Chrome CDP uses native touch input. Viewport resizing simulates changing browser content height; not physical Safari toolbar testing.',checks:[]};
async function bounds(page){
 const result=await page.locator('#navigation-dialog').evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,viewportWidth:innerWidth,viewportHeight:innerHeight,overflow:el.scrollWidth>el.clientWidth+1,bodyLocked:getComputedStyle(document.body).overflow==='hidden'};});
 for(const key of ['x','y'])assert.ok(Math.abs(result[key])<1,JSON.stringify(result));
 assert.ok(Math.abs(result.width-result.viewportWidth)<1,JSON.stringify(result));
 assert.ok(Math.abs(result.height-result.viewportHeight)<1,JSON.stringify(result));
 assert.equal(result.overflow,false);assert.equal(result.bodyLocked,true);return result;
}
for(const[engine,type]of Object.entries({chromium,firefox,webkit})){
 const executablePath=process.env[`REVIEW_${engine.toUpperCase()}_EXECUTABLE`];
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{}),...(executablePath?{executablePath}:{})});
 const cases=[[320,568,'/'],[390,844,'/'],[430,932,'/'],[768,1024,'/'],[1024,768,'/'],[844,390,'/'],[1199,600,'/'],[390,844,'/historia/'],[844,390,'/restaurantes/jardins/']];
 for(const[width,height,route]of cases){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,...(engine==='chromium'?{isMobile:true}:{}),reducedMotion:'no-preference'});
  const page=await context.newPage();let safeInsets=null;
  if(engine==='chromium'&&width===390&&route==='/'){safeInsets={top:59,bottom:34,left:0,right:0};const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:safeInsets});}
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  assert.equal((await page.goto(base+route,{waitUntil:'networkidle'})).status(),200);
  const viewportBefore=await page.locator('meta[name=viewport]').getAttribute('content'),themeBefore=await page.locator('meta[name=theme-color]').getAttribute('content');
  const menu=page.locator('#navigation-dialog');await page.locator('[data-open-menu]').tap();
  assert.ok((await page.locator('meta[name=viewport]').getAttribute('content')).includes('viewport-fit=cover'));
  const colors=await page.evaluate(()=>({menu:getComputedStyle(document.querySelector('#navigation-dialog')).backgroundColor,canvas:getComputedStyle(document.documentElement).backgroundColor,body:getComputedStyle(document.body).backgroundColor,theme:document.querySelector('meta[name=theme-color]').content,backdropAnimation:getComputedStyle(document.querySelector('#navigation-dialog'),'::backdrop').animationName}));assert.equal(colors.canvas,colors.menu);assert.equal(colors.body,colors.menu);assert.equal(colors.theme,colors.menu);assert.equal(colors.backdropAnimation,'none');
  // Full coverage must hold during the entrance, not only after its animation.
  const entry=await bounds(page);await page.waitForTimeout(320);await bounds(page);
  if(safeInsets){const safe=await menu.evaluate(el=>({top:parseFloat(getComputedStyle(el.querySelector('.dialog-top')).paddingTop),bottom:parseFloat(getComputedStyle(el).paddingBottom),closeY:el.querySelector('[data-close-menu]').getBoundingClientRect().y}));assert.equal(safe.top,59);assert.ok(safe.bottom>=34&&safe.closeY>=59);}
  assert.equal(await menu.locator('nav a').count(),7);
  assert.equal(await page.locator('[data-open-menu]').getAttribute('aria-expanded'),'true');
  await menu.evaluate(el=>{el.scrollTop=el.scrollHeight;});
  const closeRect=await menu.locator('[data-close-menu]').boundingBox();assert.ok(closeRect.y>=0&&closeRect.y+closeRect.height<=height);
  await menu.locator('.menu-contact a').scrollIntoViewIfNeeded();assert.ok(await menu.locator('.menu-contact a').isVisible());
  await menu.locator('.menu-contact a').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.matches('[data-close-menu]')),true);
  await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.matches('.menu-contact a')),true);
  if(width===390&&route==='/'){
   await page.setViewportSize({width,height:644});await bounds(page);await page.setViewportSize({width,height});await bounds(page);
   const violations=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations;assert.deepEqual(violations.map(v=>v.id),[]);
   await menu.evaluate(el=>{el.scrollTop=0;});await page.screenshot({path:`${out}/${engine}-mobile.jpg`,type:'jpeg',quality:85});
  }
  if(engine==='chromium'&&height===390&&route==='/'){
   await menu.evaluate(el=>{el.scrollTop=0;});const cdp=await context.newCDPSession(page);const start={x:400,y:310};
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});
   for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x,y:start.y-190*i/8,id:1}]});await page.waitForTimeout(20);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(160);
   assert.ok(await menu.evaluate(el=>el.scrollTop>30),'Native touch must scroll the menu');assert.equal(await page.evaluate(()=>scrollY),0);await bounds(page);
  }
  await menu.locator('[data-close-menu]').tap();assert.equal(await menu.evaluate(el=>el.open),false);
  await page.waitForFunction(()=>document.querySelector('[data-open-menu]').getAttribute('aria-expanded')==='false');
  assert.equal(await page.locator('[data-open-menu]').getAttribute('aria-expanded'),'false');assert.equal(await page.evaluate(()=>document.activeElement.matches('[data-open-menu]')),true);
  assert.notEqual(await page.evaluate(()=>getComputedStyle(document.body).overflow),'hidden');
  assert.equal(await page.locator('meta[name=viewport]').getAttribute('content'),viewportBefore);assert.equal(await page.locator('meta[name=theme-color]').getAttribute('content'),themeBefore);
  await page.locator('[data-open-menu]').tap();await page.keyboard.press('Escape');assert.equal(await menu.evaluate(el=>el.open),false);
  await page.locator('[data-open-menu]').tap();await menu.getByRole('link',{name:/Cardápio/}).tap();await page.waitForURL('**/cardapio/');assert.equal(await menu.evaluate(el=>el.open),false);
  assert.deepEqual(errors,[]);report.checks.push({engine,width,height,route,entry,colors,safeInsets,viewportAndThemeRestored:true,passed:true});console.log(`${engine} ${width}x${height} ${route}: viewport, scroll, close, focus and links pass`);await context.close();
 }
 await browser.close();
}
await fs.writeFile(`${out}/report.json`,JSON.stringify(report,null,2));
