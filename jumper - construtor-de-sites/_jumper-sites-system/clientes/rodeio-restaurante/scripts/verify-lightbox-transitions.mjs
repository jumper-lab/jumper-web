import {chromium} from 'playwright';import fs from 'node:fs/promises';
const b=await chromium.launch({channel:'chrome',headless:true});const report=[];
try{for(const width of [320,1440])for(const route of ['/cardapio/','/restaurantes/jardins/','/restaurantes/iguatemi/']){
 const p=await b.newPage({viewport:{width,height:900}});await p.goto('http://127.0.0.1:4321'+route);
 const links=p.locator('[data-gallery]');const count=await links.count();const next=await links.nth(1).getAttribute('href');
 await p.route('**/*',async r=>{if(new URL(r.request().url()).pathname===next)await new Promise(resolve=>setTimeout(resolve,650));await r.continue();});
 await links.first().click();await p.waitForFunction(()=>document.querySelector('#gallery-image').getAttribute('src')&&!document.querySelector('#gallery-image').hidden);await p.waitForTimeout(450);
 const previous=await p.locator('#gallery-image').getAttribute('src');const controlsY=(await p.locator('.gallery-controls').boundingBox()).y;
 await p.locator('[data-gallery-next]').click();await p.waitForTimeout(100);
 if(await p.locator('#gallery-image').getAttribute('src')!==previous)throw Error('old photo lost while loading');
 await p.waitForFunction(()=>document.querySelector('#gallery-count').textContent.startsWith('2 /'));await p.waitForTimeout(500);
 if(Math.abs((await p.locator('.gallery-controls').boundingBox()).y-controlsY)>1)throw Error('controls jumped');
 for(let i=0;i<3;i++)await p.keyboard.press('ArrowRight');
 const expected=String((4%count)+1)+' / '+count;
 await p.waitForFunction(text=>document.querySelector('#gallery-count').textContent===text,expected);await p.waitForTimeout(500);
 if(await p.locator('[data-outgoing-photo]').count())throw Error('orphan transition layer');
 await p.screenshot({path:`/tmp/lightbox-${width}-${route.split('/').filter(Boolean).at(-1)}.png`});
 await p.keyboard.press('Escape');if(await links.first().evaluate(e=>e!==document.activeElement))throw Error('focus not restored');
 await p.emulateMedia({reducedMotion:'reduce'});await links.first().click();await p.waitForFunction(()=>document.querySelector('.gallery-stage').getAttribute('aria-busy')==='false');if(await p.locator('#gallery-image').evaluate(e=>e.getAnimations().length))throw Error('reduced motion');
 report.push({width,route,retainsPhotoDuringLoading:true,stableControls:true,rapidNavigation:true,reducedMotion:true});await p.close();
}await fs.mkdir('data/visual-review/lightbox-transitions',{recursive:true});await fs.writeFile('data/visual-review/lightbox-transitions/report.json',JSON.stringify(report,null,2));console.log(report);}finally{await b.close();}
