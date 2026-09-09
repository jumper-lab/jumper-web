import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const b=await chromium.launch({channel:'chrome',headless:true});const report=[];
try{for(const width of [320,1440,1836]){
 const p=await b.newPage({viewport:{width,height:900}});
 await p.addInitScript(()=>{
  window.edgeFrames=[];
  const start=performance.now();
  function sample(){const hero=document.querySelector('.hero-home');if(hero){const rect=hero.getBoundingClientRect();const image=hero.querySelector('.hero-figure').getBoundingClientRect();window.edgeFrames.push({bottom:rect.bottom,photoBottom:image.bottom,vh:innerHeight,scroll:scrollY,rootOld:getComputedStyle(document.documentElement,'::view-transition-old(root)').transform,rootNew:getComputedStyle(document.documentElement,'::view-transition-new(root)').transform});}if(performance.now()-start<1800)requestAnimationFrame(sample);}requestAnimationFrame(sample);
 });
 await p.goto('http://127.0.0.1:4321/');
 for(let run=0;run<3;run++){await p.reload();await p.waitForTimeout(1900);const frames=await p.evaluate(()=>window.edgeFrames);if(!frames.length||frames.some(f=>f.scroll!==0||Math.abs(f.bottom-f.vh)>.1||Math.abs(f.photoBottom+f.scroll-f.vh)>.1||![f.rootOld,f.rootNew].every(t=>t==='none')))throw Error('Hero edge moved');report.push({width,run,frames:frames.length,bottom:'100vh',rootTransform:'none'});}
 await p.screenshot({path:`/tmp/rodeio-edge-${width}.png`});
 await p.goto('http://127.0.0.1:4321/historia/');await p.locator('.header-brand').click();await p.waitForTimeout(1900);console.log('return home',width,await p.locator('.hero-home').count());await p.close();
}await fs.mkdir('data/visual-review/hero-entrance',{recursive:true});await fs.writeFile('data/visual-review/hero-entrance/edge-report.json',JSON.stringify(report,null,2));console.log(report);}finally{await b.close();}
