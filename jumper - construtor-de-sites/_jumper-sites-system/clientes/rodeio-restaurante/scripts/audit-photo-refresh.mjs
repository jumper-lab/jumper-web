import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const routes=['/','/historia/','/cardapio/','/restaurantes/','/restaurantes/jardins/','/restaurantes/iguatemi/','/eventos/','/reservas/'];
const out='data/visual-review/photo-refresh';
const browser=await chromium.launch({channel:'chrome',headless:true});const records=[];
try{
 const page=await browser.newPage({reducedMotion:'reduce'});
 for(const [width,height] of [[320,568],[390,844],[768,1024],[1024,768],[1440,900],[1920,1080]]){
  await page.setViewportSize({width,height});
  for(const route of routes){
   await page.goto('http://127.0.0.1:4321'+route,{waitUntil:'networkidle'});
   await page.evaluate(async()=>{await document.fonts.ready;await document.querySelector('.hero-figure img').decode();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
   const report=await page.evaluate(()=>{
    const hero=document.querySelector('.hero'),img=hero.querySelector('img');const rect=img.getBoundingClientRect();
    return {hero:[hero.clientWidth,hero.clientHeight],photo:[rect.width,rect.height],source:img.currentSrc,naturalWidth:img.naturalWidth,overflow:document.documentElement.scrollWidth>innerWidth,photos:[...document.querySelectorAll('main img')].map(i=>({src:i.getAttribute('src'),alt:i.alt})),requests:performance.getEntriesByType('resource').filter(r=>r.name===img.currentSrc).map(r=>({bytes:r.encodedBodySize,duration:r.duration}))};
   });records.push({route,width,height,...report});
   if([390,1440].includes(width))await page.screenshot({path:`${out}/${route.replaceAll('/','')||'home'}-${width}.png`});
  }
  console.log('checked',width);
 }
 await fs.writeFile(`${out}/responsive.json`,JSON.stringify(records,null,2));
 console.log(JSON.stringify({cases:records.length,failures:records.filter(r=>r.overflow||r.hero[1]!==r.height||r.photo[0]!==r.width||r.photo[1]!==r.height)},null,2));
}finally{await browser.close()}
