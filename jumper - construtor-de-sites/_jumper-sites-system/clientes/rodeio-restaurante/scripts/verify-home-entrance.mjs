import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try {
 for(const width of [320,1440]) {
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route('**/*.js',async route=>{await new Promise(r=>setTimeout(r,1200));await route.continue();});
  await page.goto('http://127.0.0.1:4321/',{waitUntil:'commit'});
  await page.locator('.hero-copy').waitFor({state:'attached'});
  const samples=await page.evaluate(()=>new Promise(resolve=>{
   const rows=[];const start=performance.now();
   function frame(){const copy=document.querySelector('.hero-copy'),title=copy.querySelector('h1');rows.push({t:performance.now()-start,opacity:+getComputedStyle(copy).opacity,titleOpacity:+getComputedStyle(title).opacity});if(performance.now()-start<2100)requestAnimationFrame(frame);else resolve(rows);}frame();
  }));
  if(samples.some((s,i)=>s.titleOpacity!==1||(i&&s.opacity+0.001<samples[i-1].opacity)))throw Error('Entrance reset or individually hidden title');
  await page.screenshot({path:`/tmp/rodeio-hero-fixed-${width}.png`});
  results.push({width,delayedJavaScript:'1200ms',monotonic:true,finalOpacity:samples.at(-1).opacity});
  await page.close();
 }
 for(const mode of ['no-js','reduced-motion']) {
  const page=await browser.newPage({javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduced-motion'?'reduce':'no-preference'});
  await page.goto('http://127.0.0.1:4321/');
  await page.waitForTimeout(750);
  const state=await page.locator('.hero-copy').evaluate(e=>({opacity:getComputedStyle(e).opacity,animation:getComputedStyle(e).animationName}));
  if(state.opacity!=='1'||(mode==='reduced-motion'&&state.animation!=='none'))throw Error(mode+' failed');
  results.push({mode,...state});await page.close();
 }
 await fs.mkdir('data/visual-review/hero-entrance',{recursive:true});
 await fs.writeFile('data/visual-review/hero-entrance/report.json',JSON.stringify(results,null,2));console.log(results);
} finally {await browser.close();}
