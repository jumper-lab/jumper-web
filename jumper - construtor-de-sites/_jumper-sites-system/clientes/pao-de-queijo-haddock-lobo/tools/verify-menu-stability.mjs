import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'data/visual-review');
const require=createRequire(import.meta.url),pw=require(process.env.JUMPER_PLAYWRIGHT||'/Users/marajah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4327',pass=process.env.JUMPER_MENU_STABILITY_PASS||'final';
const browser=await pw.chromium.launch({headless:true,...(!existsSync(pw.chromium.executablePath())?{channel:'chrome'}:{})});
const report={date:new Date().toISOString(),checks:[],failures:[],errors:[],samples:[]};
const check=(ok,label,data)=>{report.checks.push({ok,label,...(data?{data}:{})});if(!ok)report.failures.push(label);};
const read=page=>page.evaluate(()=>{const rail=document.querySelector('.menu-index'),r=rail.getBoundingClientRect(),h=document.querySelector('.site-header').getBoundingClientRect();return{y:r.y,height:r.height,header:h.height,viewport:innerHeight,scroll:scrollY,active:document.querySelector('[data-category-link][aria-current]')?.getAttribute('data-category-link')};});
await fs.mkdir(out,{recursive:true});
try{
  for(const width of [320,390,768,1024,1440]){
    const context=await browser.newContext({viewport:{width,height:width<=700?600:960},hasTouch:true}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
    await page.goto(base+'/menu/#tortas',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1200);
    const baseline=await read(page),frames=await page.evaluate(async()=>{const result=[];for(let n=0;n<35;n++){scrollBy({top:3,behavior:'instant'});await new Promise(requestAnimationFrame);const r=document.querySelector('.menu-index').getBoundingClientRect();result.push({y:r.y,height:r.height});}return result;});
    const spread=Math.max(...frames.map(f=>f.y))-Math.min(...frames.map(f=>f.y));check(spread<.6,`scroll@${width}: índice ancorado imóvel`,{spread});
    report.samples.push({width,baseline,frames});
    if(width<=700){
      const values=[];for(const height of [568,535,560,525,600]){await page.setViewportSize({width,height});await page.waitForTimeout(180);values.push(await read(page));}
      const jump=Math.max(...values.map(v=>v.y))-Math.min(...values.map(v=>v.y));check(jump<.6,`toolbar@${width}: altura variável não desloca topo`,{jump,values});report.samples.at(-1).toolbar=values;
    }
    await page.evaluate(()=>{
      window.__categoryChanges=[];
      new MutationObserver(entries=>{if(entries.some(e=>e.attributeName==='aria-current'))window.__categoryChanges.push({time:performance.now(),id:document.querySelector('[data-category-link][aria-current]')?.getAttribute('data-category-link')});}).observe(document.querySelector('.menu-index'),{attributes:true,subtree:true,attributeFilter:['aria-current']});
    });
    await page.locator('[data-category-link="bebidas"]').click();await page.waitForTimeout(1100);const changes=await page.evaluate(()=>window.__categoryChanges);report.samples.at(-1).clickChanges=changes;
    check(await page.locator('[data-category-link="bebidas"]').getAttribute('aria-current')==='location',`anchor@${width}: categoria final corresponde ao destino`);
    check(changes.every(c=>c.id==='bebidas'),`anchor@${width}: sem trocar destaque por capítulos intermediários`,{changes});
    await page.mouse.move(width-1,1);await page.waitForTimeout(850);
    await page.screenshot({path:path.join(out,`menu-stability-${pass}-viewport-${width}.png`)});
    await page.locator('.menu-index').screenshot({path:path.join(out,`menu-stability-${pass}-${width}.png`)});
    if(width<=900){
      const session=await context.newCDPSession(page),start=await read(page);
      await page.evaluate(()=>{window.__railFrames=[];window.__recordRail=true;const sample=()=>{if(!window.__recordRail)return;const r=document.querySelector('.menu-index').getBoundingClientRect();window.__railFrames.push({y:r.y,height:r.height});requestAnimationFrame(sample);};sample();});
      const drag=async(x,y,dx,dy)=>{
        await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
        for(let n=1;n<=12;n++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*n/12,y:y+dy*n/12}]});await page.waitForTimeout(20);}
        await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(650);
      };
      await drag(width/2,start.viewport-60,0,-160);
      const touchFrames=await page.evaluate(()=>{window.__recordRail=false;return window.__railFrames;});
      const delta=Math.max(...touchFrames.map(f=>f.y))-Math.min(...touchFrames.map(f=>f.y));
      check(delta<.6,`touch@${width}: topo estável durante gesto vertical`,{delta,frames:touchFrames.length});
      check((await read(page)).scroll>start.scroll+40,`touch@${width}: página realmente rolou`);
      const nav=await page.locator('.menu-index nav').boundingBox(),beforeSwipe=await read(page);
      await drag(Math.min(width-40,280),nav.y+nav.height/2,-140,0);
      const afterSwipe=await read(page);
      check(Math.abs(afterSwipe.y-beforeSwipe.y)<.6&&Math.abs(afterSwipe.scroll-beforeSwipe.scroll)<2,`touch@${width}: gesto horizontal não sacode documento`);
      await session.detach();
    }
    await page.locator('[data-category-link="em-casa"]').click();await page.waitForTimeout(80);
    await page.locator('[data-category-link="salgados"]').click();await page.waitForTimeout(1400);
    check(await page.locator('[data-category-link="salgados"]').getAttribute('aria-current')==='location',`rapid@${width}: último toque vence destino anterior`);
    await page.locator('[data-category-link="doces"]').focus();await page.keyboard.press('Enter');await page.waitForTimeout(1300);
    check(await page.locator('[data-category-link="doces"]').getAttribute('aria-current')==='location',`keyboard@${width}: âncora e destaque sincronizados`);
    await page.locator('[data-category-link="smoothies"]').click();await page.waitForTimeout(50);
    await page.mouse.wheel(0,-450);await page.waitForTimeout(1350);
    const reading=await page.evaluate(()=>{
      const rail=document.querySelector('.menu-index').getBoundingClientRect(),header=document.querySelector('.site-header').getBoundingClientRect(),line=innerWidth<=900&&rail.top<=header.bottom+1?rail.bottom+32:header.bottom+32;
      const visible=[...document.querySelectorAll('[data-menu-category]')].filter(e=>!e.hidden),id=document.querySelector('[data-category-link][aria-current]')?.getAttribute('data-category-link'),n=visible.findIndex(e=>e.id===id);
      return{id,line,top:visible[n]?.getBoundingClientRect().top,next:visible[n+1]?.getBoundingClientRect().top,first:n===0};
    });
    check(reading.id&&(reading.first||reading.top<=reading.line+1)&&(reading.next===undefined||reading.next>reading.line+1),`interrupt@${width}: rolagem manual libera seleção do destino`,reading);
    await context.close();
  }
}catch(e){report.errors.push(e.stack||String(e));}
finally{await browser.close();await fs.writeFile(path.join(out,`menu-stability-${pass}-report.json`),JSON.stringify(report,null,2));}
console.log(JSON.stringify({checks:report.checks.length,failures:report.failures,errors:report.errors},null,2));if(report.failures.length||report.errors.length)process.exitCode=1;
