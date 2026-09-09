import {chromium} from 'playwright';import fs from 'node:fs/promises';
const out='data/visual-review/restaurant-galleries';const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
try{const page=await browser.newPage({reducedMotion:'reduce'});
for(const width of [320,768,1440]){
 await page.setViewportSize({width,height:900});
 for(const [unit,total] of [['jardins',15],['iguatemi',5]]){
  await page.goto(`http://127.0.0.1:4321/restaurantes/${unit}/`,{waitUntil:'networkidle'});
  const links=page.locator('.restaurant-gallery [data-gallery]');if(await links.count()!==total)throw Error('Wrong gallery count');
  const hrefs=await links.evaluateAll(els=>els.map(e=>e.href));if(new Set(hrefs).size!==total)throw Error('Duplicate in album');
  const lazy=await links.locator('img').evaluateAll(els=>els.every(e=>e.loading==='lazy'));
  await links.first().click();
  for(let index=0;index<total;index++){
   await page.waitForFunction(()=>{const img=document.querySelector('#gallery-image');return !img.hidden&&img.complete&&img.naturalWidth>0});
   if(await page.locator('#gallery-count').innerText()!==`${index+1} / ${total}`)throw Error('Counter mismatch');
   if(index<total-1)await page.locator('[data-gallery-next]').click();
  }
  await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('#gallery-count').textContent.startsWith('1 /'));
  await page.keyboard.press('ArrowLeft');await page.waitForFunction(n=>document.querySelector('#gallery-count').textContent===`${n} / ${n}`,total);
  await page.waitForFunction(()=>!document.querySelector('#gallery-image').hidden);
  if(width===320)await page.screenshot({path:`${out}/${unit}-dialog-mobile.png`});
  await page.keyboard.press('Escape');const focusRestored=await links.first().evaluate(e=>e===document.activeElement);if(!focusRestored)throw Error('Focus not restored');
  await page.locator('#galeria').scrollIntoViewIfNeeded();
  const report=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,columns:getComputedStyle(document.querySelector('.restaurant-gallery')).gridTemplateColumns}));if(report.overflow)throw Error('Overflow');
  if(width===1440){await page.evaluate(()=>scrollTo(0,document.querySelector('#galeria').offsetTop-100));await page.screenshot({path:`${out}/${unit}-desktop.png`});}
  results.push({unit,width,total,lazy,focusRestored,...report});console.log(unit,width,'passed');
 }
}
await page.goto('http://127.0.0.1:4321/cardapio/');await page.locator('[data-gallery]').first().click();await page.waitForFunction(()=>!document.querySelector('#gallery-image').hidden);await page.locator('[data-gallery-next]').click();await page.waitForFunction(()=>document.querySelector('#gallery-count').textContent==='2 / 2'&&!document.querySelector('#gallery-image').hidden);await page.keyboard.press('Escape');
await fs.writeFile(`${out}/report.json`,JSON.stringify({results,cardapioRegression:'passed'},null,2));
}finally{await browser.close()}
