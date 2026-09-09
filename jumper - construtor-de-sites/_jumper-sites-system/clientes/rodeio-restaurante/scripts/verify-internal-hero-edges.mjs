import {chromium} from 'playwright';import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});const report=[];
try{for(const width of [390,1440])for(const route of ['/historia/','/cardapio/','/restaurantes/','/restaurantes/jardins/','/restaurantes/iguatemi/','/eventos/','/reservas/']){
 const page=await browser.newPage({viewport:{width,height:900}});
 await page.addInitScript(()=>{window.heroEdgeIssues=[];window.heroFrames=0;const start=performance.now();function check(){const hero=document.querySelector('.hero-photo');if(hero){const r=hero.getBoundingClientRect(),photo=hero.querySelector('.hero-figure').getBoundingClientRect();window.heroFrames++;if(scrollY!==0||Math.abs(r.bottom-innerHeight)>.1||Math.abs(photo.bottom-innerHeight)>.1)window.heroEdgeIssues.push({scrollY,bottom:r.bottom,photoBottom:photo.bottom});}if(performance.now()-start<1800)requestAnimationFrame(check);}requestAnimationFrame(check);});
 await page.goto('http://127.0.0.1:4321'+route);await page.waitForTimeout(1900);
 for(let run=0;run<2;run++){if(run){await page.reload();await page.waitForTimeout(1900);}const result=await page.evaluate(()=>({frames:window.heroFrames,issues:window.heroEdgeIssues}));if(!result.frames||result.issues.length)throw Error(JSON.stringify({width,route,run,...result}));report.push({width,route,run,frames:result.frames,scrollY:0,heroBottom:900});}
 if(route==='/eventos/')await page.screenshot({path:`/tmp/rodeio-internal-hero-${width}.png`});await page.close();console.log(width,route,'OK');
}await fs.mkdir('data/visual-review/hero-entrance',{recursive:true});await fs.writeFile('data/visual-review/hero-entrance/internal-edge-report.json',JSON.stringify(report,null,2));}finally{await browser.close();}
