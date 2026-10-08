import {chromium,firefox,webkit} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.REVIEW_URL||'http://127.0.0.1:4326/rodeio';
const out=`data/visual-review/eventos-popup/${process.env.REVIEW_LABEL||'local'}`;
await fs.mkdir(out,{recursive:true});
const report={date:new Date().toISOString(),base,note:'Real official-page iframe in three desktop browser engines with mobile viewports. Form fields inspected; no request sent to the client.',checks:[]};
for(const[engine,type]of Object.entries({chromium,firefox,webkit})){
 const executablePath=process.env[`REVIEW_${engine.toUpperCase()}_EXECUTABLE`];
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{}),...(executablePath?{executablePath}:{})});
 for(const[width,height]of [[390,844],[1440,900]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<1200});const page=await context.newPage();const errors=[];const requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().startsWith('https://rodeiosp.com.br/eventos/'))requests.push(r.url());});
  assert.equal((await page.goto(base+'/eventos/',{waitUntil:'networkidle'})).status(),200);
  const original=page.url(),dialog=page.locator('#events-page-dialog'),links=page.locator('a[aria-controls="events-page-dialog"]');
  assert.equal(await links.count(),3);assert.equal(await dialog.locator('iframe').count(),0);assert.deepEqual(requests,[]);
  const opener=links.first();await opener.click();const scrollAtOpen=await page.evaluate(()=>scrollY);
  assert.equal(page.url(),original);assert.equal(await dialog.evaluate(el=>el.open),true);
  const remote=page.frameLocator('#events-page-dialog iframe');await remote.getByRole('heading',{name:'Solicite um orçamento',exact:true}).waitFor({timeout:45000});
  assert.ok(await remote.locator('input[type="email"]').count()>0);assert.ok(await remote.locator('select').count()>0);
  assert.equal(await dialog.locator('iframe').getAttribute('title'),'Eventos e orçamento — Rodeio');
  await dialog.locator('[data-menu-status]').waitFor({state:'hidden',timeout:60000});
  const bounds=await dialog.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,locked:getComputedStyle(document.body).overflow==='hidden'};});
  assert.equal(bounds.locked,true);assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width+1&&bounds.y+bounds.height<=height+1);
  if(width<1200){assert.ok(Math.abs(bounds.width-(width-16))<1);assert.ok(Math.abs(bounds.height-(height-16))<1);}else{assert.ok(bounds.width<=1040&&bounds.height<=800);}
  if(engine==='chromium'){const result=await new AxeBuilder({page}).include('#events-page-dialog').exclude('iframe').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();assert.deepEqual(result.violations.map(v=>v.id),[]);await page.screenshot({path:`${out}/${engine}-${width}.jpg`,type:'jpeg',quality:85});}
  await dialog.locator('[data-close-digital-menu]').click();await page.waitForFunction(()=>!document.querySelector('#events-page-dialog').open&&!document.querySelector('#events-page-dialog iframe'));assert.equal(await dialog.evaluate(el=>el.open),false);assert.equal(await dialog.locator('iframe').count(),0);assert.equal(await page.evaluate(()=>scrollY),scrollAtOpen);assert.equal(await opener.evaluate(el=>document.activeElement===el),true);
  for(const link of await links.all()){await link.click();assert.equal(await dialog.evaluate(el=>el.open),true);await dialog.locator('[data-close-digital-menu]').click();await page.waitForFunction(()=>!document.querySelector('#events-page-dialog').open&&!document.querySelector('#events-page-dialog iframe'));}
  await opener.click();await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#events-page-dialog').open&&!document.querySelector('#events-page-dialog iframe'));assert.equal(await dialog.evaluate(el=>el.open),false);
  if(width===1440){await opener.click();await page.mouse.click(2,2);await page.waitForFunction(()=>!document.querySelector('#events-page-dialog').open&&!document.querySelector('#events-page-dialog iframe'));assert.equal(await dialog.evaluate(el=>el.open),false);}
  assert.equal(page.url(),original);assert.notEqual(await page.evaluate(()=>getComputedStyle(document.body).overflow),'hidden');assert.deepEqual(errors,[]);
  // Both dialogs share a controller; verify that menu still works independently.
  await page.goto(base+'/cardapio/',{waitUntil:'networkidle'});await page.locator('a[aria-controls="digital-menu-dialog"]').first().click();
  assert.equal(await page.locator('#digital-menu-dialog').evaluate(el=>el.open),true);assert.equal(await page.locator('#events-page-dialog').evaluate(el=>el.open),false);
  assert.ok((await page.locator('#digital-menu-dialog iframe').getAttribute('src')).startsWith('https://beta.livemenu.app/'));
  await page.frameLocator('#digital-menu-dialog iframe').getByText('Menu Principal',{exact:true}).first().waitFor({state:'visible',timeout:45000});
  await page.locator('#digital-menu-dialog [data-close-digital-menu]').click();await page.waitForFunction(()=>!document.querySelector('#digital-menu-dialog iframe'));assert.equal(await page.locator('#digital-menu-dialog iframe').count(),0);
  report.checks.push({engine,width,height,bounds,officialFormLoaded:true,allThreeButtons:true,menuRegressionPassed:true,passed:true});console.log(`${engine} ${width}px: real events form, controls and independent menu pass`);await context.close();
 }
 await browser.close();
}
const browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto(base+'/eventos/');assert.equal(await page.locator('main a[href="https://rodeiosp.com.br/eventos/"]').count(),3);assert.equal(await page.locator('#events-page-dialog iframe').count(),0);await browser.close();report.noScriptFallback=true;
await fs.writeFile(`${out}/report.json`,JSON.stringify(report,null,2));
