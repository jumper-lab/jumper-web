import { chromium, firefox, webkit } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.REVIEW_URL||'http://127.0.0.1:4326/rodeio';
const label=process.env.REVIEW_LABEL||'local';
const out=`data/visual-review/home-swipe/${label}`;
await fs.mkdir(out,{recursive:true});
const report={date:new Date().toISOString(),base,checks:[],note:'Chrome CDP native touch input verifies horizontal swipe and actual vertical scrolling. Firefox/WebKit checks dispatch PointerEvents; they do not replace physical-device testing.'};
async function scene(page,index){
 await page.waitForFunction(i=>document.querySelector('[data-slide-control].is-active')?.getAttribute('data-slide-control')===String(i),index,{timeout:10000});
 const state=await page.evaluate(()=>{const active=document.querySelector('[data-hero-slide].is-active');const image=active.querySelector('img');return{activeFrames:document.querySelectorAll('[data-hero-slide].is-active').length,activeControls:document.querySelectorAll('[data-slide-control][aria-current="true"]').length,ready:image.complete&&image.naturalWidth>0,caption:document.querySelector('[data-home-slide-caption]').textContent,expectedCaption:active.dataset.caption,current:document.querySelector('[data-slide-current]').textContent};});
 assert.equal(state.activeFrames,1);assert.equal(state.activeControls,1);assert.equal(state.ready,true);assert.equal(state.caption,state.expectedCaption);assert.equal(state.current,String(index+1).padStart(2,'0'));
}
async function pointer(page,{dx=-180,dy=0,type='touch',target='.hero-home',cancel=false,multi=false}={}){
 await page.evaluate(({dx,dy,type,target,cancel,multi})=>{const element=document.querySelector(target);const rect=element.getBoundingClientRect();const x=Math.min(rect.right-20,310),y=Math.max(rect.top+30,240);const dispatch=(name,x,y,id=21,primary=true)=>element.dispatchEvent(new PointerEvent(name,{bubbles:true,pointerId:id,pointerType:type,isPrimary:primary,clientX:x,clientY:y,button:0,buttons:name==='pointerup'?0:1}));dispatch('pointerdown',x,y);if(multi)dispatch('pointerdown',x+5,y+5,22,false);dispatch('pointermove',x+dx*.2,y+dy*.2);dispatch('pointermove',x+dx,y+dy);dispatch(cancel?'pointercancel':'pointerup',x+dx,y+dy);}, {dx,dy,type,target,cancel,multi});
}
for(const [engine,browserType]of Object.entries({chromium,firefox,webkit})){
 const executablePath=process.env[`REVIEW_${engine.toUpperCase()}_EXECUTABLE`];
 const browser=await browserType.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{}),...(executablePath?{executablePath}:{})});
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,...(engine==='chromium'?{isMobile:true}:{}),reducedMotion:'reduce'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 assert.equal((await page.goto(base+'/',{waitUntil:'networkidle'})).status(),200);
 await scene(page,0);
 assert.equal(await page.locator('[data-hero-slide] img[src]').count(),1,'Do not eagerly load all six slides');
 assert.equal(await page.locator('.hero-home').evaluate(el=>getComputedStyle(el).touchAction),'pan-y pinch-zoom');
 if(engine==='chromium'){
  const cdp=await context.newCDPSession(page);
  async function nativeSwipe(dx,dy=0){const start={x:dx>0?80:310,y:300};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...start,id:1}]});for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+dx*i/8,y:start.y+dy*i/8,id:1}]});await new Promise(r=>setTimeout(r,20));}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  await nativeSwipe(-200);await scene(page,1);report.checks.push({engine,interaction:'native swipe left',passed:true});
  assert.equal(await page.locator('[data-hero-slide] img[src]').count(),2);
  await nativeSwipe(200);await scene(page,0);await nativeSwipe(200);await scene(page,5);await nativeSwipe(-200);await scene(page,0);report.checks.push({engine,interaction:'native right and wrapping both directions',passed:true});
  await nativeSwipe(-20);await scene(page,0);report.checks.push({engine,interaction:'short movement ignored',passed:true});
  await nativeSwipe(0,-180);await page.waitForFunction(()=>scrollY>60);await scene(page,0);report.checks.push({engine,interaction:'native vertical page scroll preserved',passed:true});
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.waitForFunction(()=>scrollY===0);await nativeSwipe(-200);await scene(page,1);report.checks.push({engine,interaction:'swipe after scroll/cancel',passed:true});
  await page.locator('[data-slide-control="0"]').tap();await scene(page,0);report.checks.push({engine,interaction:'indicator tap',passed:true});
 }else{
  await pointer(page);await scene(page,1);await pointer(page,{dx:180});await scene(page,0);await pointer(page,{dx:180});await scene(page,5);await pointer(page);await scene(page,0);report.checks.push({engine,interaction:'PointerEvents left/right/wrap',passed:true});
 }
 for(const options of [{dx:20},{dx:10,dy:180},{dx:180,dy:170},{cancel:true},{multi:true},{type:'mouse'},{target:'.hero-actions a'}]){await pointer(page,options);await scene(page,0);}
 report.checks.push({engine,interaction:'short, vertical, diagonal, cancelled, multitouch, mouse and button gestures ignored',passed:true});
 await pointer(page,{type:'pen'});await scene(page,1);await page.locator('[data-slide-control="0"]').click();await scene(page,0);report.checks.push({engine,interaction:'pen gesture and existing indicator',passed:true});
 await page.locator('[data-slide-control="2"]').focus();await page.keyboard.press('Enter');await scene(page,2);report.checks.push({engine,interaction:'keyboard navigation',passed:true});
 await page.locator('.hero-actions a[href$="/reservas/"]').tap();await page.waitForURL('**/reservas/');report.checks.push({engine,interaction:'reserve link tap unaffected',passed:true});
 await page.goto(base+'/',{waitUntil:'networkidle'});
 // Force a slow second photograph; rapid gestures must keep the latest intent.
 await page.route('**/*home-marca-acervo-2024*',async route=>{await new Promise(r=>setTimeout(r,550));await route.continue();});
 await page.reload({waitUntil:'networkidle'});await scene(page,0);
 await pointer(page);await pointer(page);await scene(page,2);await page.waitForTimeout(700);await scene(page,2);report.checks.push({engine,interaction:'rapid swipes with delayed photo; no stale commit',passed:true});
 await page.unrouteAll({behavior:'wait'});
 await page.route('**/*home-marca-acervo-2024*',route=>route.abort());await page.reload({waitUntil:'networkidle'});await pointer(page);await page.waitForTimeout(600);await scene(page,0);report.checks.push({engine,interaction:'failed download retains visible decoded photo',passed:true});
 await page.unrouteAll({behavior:'wait'});
 assert.deepEqual(errors,[]);report.checks.push({engine,interaction:'no JavaScript errors',passed:true});
 await context.close();await browser.close();console.log(`${engine}: swipe, controles, links e cancelamentos conferidos.`);
}
// Autoplay remains available without reduced motion and pauses while a finger is down.
const browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();await page.goto(base+'/',{waitUntil:'networkidle'});
await page.evaluate(()=>document.querySelector('.hero-home').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:30,pointerType:'touch',isPrimary:true,clientX:300,clientY:240})));
await page.waitForTimeout(6700);await scene(page,0);
await page.evaluate(()=>document.querySelector('.hero-home').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:30,pointerType:'touch',isPrimary:true,clientX:300,clientY:240})));
await scene(page,1);report.checks.push({engine:'chromium',interaction:'autoplay paused during contact and resumes after release',passed:true});await context.close();await browser.close();
await fs.writeFile(`${out}/report.json`,JSON.stringify(report,null,2));console.log(`${report.checks.length} verificações aprovadas.`);
