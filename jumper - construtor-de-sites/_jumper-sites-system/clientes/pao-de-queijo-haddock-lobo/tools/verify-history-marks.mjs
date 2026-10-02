import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'data/visual-review');
const require=createRequire(import.meta.url),pw=require(process.env.JUMPER_PLAYWRIGHT||'/Users/marajah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4327',pass=process.env.JUMPER_HISTORY_MARKS_PASS||'final';
const browser=await pw.chromium.launch({headless:true,...(!existsSync(pw.chromium.executablePath())?{channel:'chrome'}:{})});
const report={date:new Date().toISOString(),checks:[],failures:[],errors:[],viewports:[]};
const check=(ok,label,data)=>{report.checks.push({ok,label,...(data?{data}:{})});if(!ok)report.failures.push(label);};
await fs.mkdir(out,{recursive:true});
try{
  for(const width of [320,360,390,430,700,768,1024,1440]){
    const context=await browser.newContext({viewport:{width,height:width<=700?844:960}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
    await page.goto(base+'/sobre/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
    await page.locator('.history-marks').scrollIntoViewIfNeeded();await page.mouse.move(width-1,1);await page.waitForTimeout(850);
    const data=await page.evaluate(()=>{
      const section=document.querySelector('.history-marks'),cells=[...section.querySelectorAll('.container>div')];
      const bounds=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
      return{overflow:document.documentElement.scrollWidth-innerWidth,cells:cells.map(cell=>{
        const number=cell.querySelector('strong'),p=cell.querySelector('p'),range=document.createRange();range.selectNodeContents(number);const rects=[...range.getClientRects()];
        const labelRange=document.createRange();labelRange.selectNodeContents(p);const labelRects=[...labelRange.getClientRects()].filter(r=>r.width>0);
        const c=document.createElement('canvas').getContext('2d');c.font=getComputedStyle(number).font;
        return{box:bounds(cell),number:bounds(number),caption:bounds(p),text:number.textContent,label:p.textContent,lines:new Set(rects.map(r=>Math.round(r.top))).size,glyphs:rects.map(r=>({x:r.x,right:r.right})),labelGlyphs:labelRects.map(r=>({x:r.x,right:r.right})),font:getComputedStyle(number).fontSize,nowrapWidth:c.measureText(number.textContent).width};
      })};
    });report.viewports.push({width,...data});
    const numbers=data.cells.map(c=>c.number.y),labels=data.cells.map(c=>c.caption.y);
    check(data.cells.map(c=>c.text).join('|')==='1968|+ 3.000|5',`content@${width}: três dados preservados`);
    check(data.cells.every(c=>c.lines===1),`line@${width}: números numa única linha`,data.cells.map(c=>({text:c.text,lines:c.lines,font:c.font,nowrapWidth:c.nowrapWidth})));
    check(Math.max(...numbers)-Math.min(...numbers)<1&&Math.max(...labels)-Math.min(...labels)<1,`alignment@${width}: números e legendas na mesma altura`);
    check(data.cells.every(c=>c.glyphs.every(r=>r.x>=c.box.x-.6&&r.right<=c.box.right+.6)),`fit@${width}: glifos dentro da própria coluna`);
    check(data.cells.every(c=>c.labelGlyphs.every(r=>r.x>=c.box.x-.6&&r.right<=c.box.right+.6)),`labels@${width}: legendas dentro da própria coluna`);
    check(data.overflow<=1,`viewport@${width}: sem overflow lateral`);
    if(width<=700){
      check(data.cells.every(c=>Math.abs(c.number.x+c.number.width/2-(c.box.x+c.box.width/2))<1),`center@${width}: números centralizados nas colunas`);
      check(data.cells.every(c=>Number.parseFloat(c.font)>=28),`type@${width}: números legíveis`);
    }
    if(width>700&&pass!=='before'){
      const old=JSON.parse(await fs.readFile(path.join(out,'history-marks-before-report.json'),'utf8')).viewports.find(v=>v.width===width);
      check(data.cells.every((c,n)=>{const b=old.cells[n];return c.font===b.font&&Math.abs(c.number.height-b.number.height)<1&&Math.abs(c.number.width-b.number.width)<1&&Math.abs(c.number.x-c.box.x-(b.number.x-b.box.x))<1&&Math.abs(c.box.height-b.box.height)<1;}),`desktop@${width}: geometria anterior preservada`);
    }
    await page.screenshot({path:path.join(out,`history-marks-${pass}-viewport-${width}.png`)});
    await page.locator('.history-marks').screenshot({path:path.join(out,`history-marks-${pass}-${width}.png`)});
    await context.close();
  }
  for(const mode of ['no-js','reduced']){
    const context=await browser.newContext({viewport:{width:320,height:568},...(mode==='no-js'?{javaScriptEnabled:false}:{reducedMotion:'reduce'})}),page=await context.newPage();
    await page.goto(base+'/sobre/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
    check(await page.locator('.history-marks strong').count()===3&&await page.locator('.history-marks').isVisible(),`${mode}: faixa e dados disponíveis`);
    await context.close();
  }
}catch(e){report.errors.push(e.stack||String(e));}
finally{await browser.close();await fs.writeFile(path.join(out,`history-marks-${pass}-report.json`),JSON.stringify(report,null,2));}
console.log(JSON.stringify({checks:report.checks.length,failures:report.failures,errors:report.errors},null,2));if(report.failures.length||report.errors.length)process.exitCode=1;
