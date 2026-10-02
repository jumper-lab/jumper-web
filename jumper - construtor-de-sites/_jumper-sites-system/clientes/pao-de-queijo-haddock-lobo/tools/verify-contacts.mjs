import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),pw=require(process.env.JUMPER_PLAYWRIGHT||'/Users/marajah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'data/visual-review'),base=process.env.PREVIEW_URL||'http://127.0.0.1:4327',pass=process.env.JUMPER_CONTACT_PASS||'final',content=JSON.parse(await fs.readFile(path.join(root,'data/content.json'),'utf8'));
await fs.mkdir(out,{recursive:true});
const browser=await pw.chromium.launch({headless:true,...(!existsSync(pw.chromium.executablePath())?{channel:'chrome'}:{})});
const report={date:new Date().toISOString(),pass,checks:[],viewports:[],failures:[],errors:[],native_transition_skips:[]},check=(ok,label,data)=>{report.checks.push({ok,label,...(data?{data}:{})});if(!ok)report.failures.push(label);};
const captureError=error=>{if(error.message==='Transition was aborted because of invalid state. ViewTransition opt-in disabled')report.native_transition_skips.push(error.message);else report.errors.push(error.message);};
const ready=async page=>{await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1200);};
try{
  for(const width of [320,390,768,1024,1440,1920]){
    const context=await browser.newContext({viewport:{width,height:width<700?844:960}}),page=await context.newPage();page.on('pageerror',captureError);
    await page.goto(base+'/#contatos',{waitUntil:'networkidle'});await ready(page);
    const data=await page.evaluate(()=>{
      const area=document.querySelector('#contatos'),heading=area.querySelector('h2'),r=heading.getBoundingClientRect(),walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT),textRects=[];while(walker.nextNode()){const range=document.createRange();range.selectNode(walker.currentNode);textRects.push(range.getBoundingClientRect());}
      const links=[...area.querySelectorAll('a')];return{tag:area.tagName,ids:document.querySelectorAll('#contatos').length,top:area.getBoundingClientRect().top,header:document.querySelector('.site-header').getBoundingClientRect().bottom,overflow:document.documentElement.scrollWidth-innerWidth,heading:heading.getAttribute('aria-label')||heading.textContent,headingFits:textRects.every(t=>t.left>=r.left-1&&t.right<=r.right+1),email:area.querySelector('.contact-address').textContent,forms:area.querySelectorAll('form').length,phones:[...area.querySelectorAll('[data-contact-store]')].map(a=>({id:a.dataset.contactStore,href:a.getAttribute('href'),name:a.getAttribute('aria-label')})),small:links.filter(a=>{const r=a.getBoundingClientRect();return r.width<44||r.height<44;}).map(a=>a.textContent),arrows:area.querySelectorAll('svg path[d="M4 12h15m-6-6 6 6-6 6"]').length,footer:document.querySelector('.site-footer').getBoundingClientRect().top,areaBottom:area.getBoundingClientRect().bottom};
    });report.viewports.push({width,...data});
    check(data.tag==='SECTION'&&data.ids===1&&data.footer>=data.areaBottom-1,`Contato@${width}: seção dedicada e âncora única, antes do rodapé`);
    check(data.top>=data.header-1&&data.top<innerHeightSafe(width)&&data.overflow<=1,`Contato@${width}: âncora visível sem header cobrindo ou overflow`,{top:data.top,header:data.header});
    check(data.heading.includes('CONVERSAR')&&data.headingFits,`Contato@${width}: chamada clara, sem corte de texto`);
    check(data.email===content.conversion.public_email&&data.forms===1&&await page.locator('[data-contact-submit]').isDisabled(),`Contato@${width}: e-mail público visível, formulário com envio inativo sem serviço`);
    check(data.phones.length===5&&data.phones.every((p,i)=>p.id===content.locations[i].id&&p.href===`tel:${content.locations[i].tel}`&&p.name.includes(content.locations[i].phone)),`Contato@${width}: cinco telefones e rótulos oficiais`);
    check(data.small.length===0&&data.arrows===0,`Contato@${width}: todos os alvos >=44px, sem setas decorativas`,data.small);
    check(await page.locator('[data-contact-instagram]').getAttribute('href')===content.instagram&&await page.locator('[data-contact-event]').getAttribute('href')===content.conversion.event_whatsapp_href,`Contato@${width}: Instagram e WhatsApp de eventos preservados`);
    check(await page.locator('.contact-channels a').evaluateAll(as=>as.every(a=>a.target==='_blank'&&a.rel.includes('noopener')&&a.rel.includes('noreferrer')&&a.getAttribute('aria-label').includes('nova aba'))),`Contato@${width}: canais externos protegidos e identificados`);
    await page.screenshot({path:path.join(out,`contact-${pass}-viewport-${width}.png`)});
    await page.locator('.contact-intro').screenshot({path:path.join(out,`contact-${pass}-intro-${width}.png`)});await page.locator('.contact-local').screenshot({path:path.join(out,`contact-${pass}-stores-${width}.png`)});await page.locator('.contact-channels').screenshot({path:path.join(out,`contact-${pass}-channels-${width}.png`)});if(width>=768)await page.locator('#contatos').screenshot({path:path.join(out,`contact-${pass}-section-${width}.png`)});
    const sample=page.locator('[data-contact-store="haddock"]');await sample.scrollIntoViewIfNeeded();const before=await sample.boundingBox();await sample.hover();await page.waitForTimeout(650);const after=await sample.boundingBox();
    check(['x','width','height'].every(k=>Math.abs(before[k]-after[k])<1)&&await sample.evaluate(e=>getComputedStyle(e).color==='rgb(159, 43, 52)'),`Contato@${width}: filete/hover na tinta da marca sem mover alvo`);
    await sample.focus();check(await sample.evaluate(e=>e===document.activeElement&&getComputedStyle(e).outlineStyle!=='none'),`Contato@${width}: telefone com foco visível`);
    await context.close();
  }
  for(const width of [320,768,1024,1440]){
    const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage();page.on('pageerror',captureError);
    for(const route of ['/','/sobre/','/menu/','/lojas/']){
      await page.goto(base+route,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
      if(width<=700){await page.locator('#menu-toggle').click();await page.waitForTimeout(550);await page.locator('.mobile-navigation').getByRole('link',{name:'Contato',exact:true}).click();}
      else await page.locator('.desktop-nav').getByRole('link',{name:'Contato',exact:true}).click();
      await page.waitForURL(base+'/#contatos');await ready(page);
      check(await page.locator('section#contatos').isVisible()&&await page.locator('.mobile-navigation').isHidden(),`Menu ${route}@${width}: Contato leva à seção real e fecha diálogo`);
    }
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage();await page.goto(base+'/#contatos',{waitUntil:'networkidle'});await ready(page);
  // Do not launch email/phone applications or send a message: cancel activations only in this test document.
  await page.evaluate(()=>{window.__contactDestinations=[];document.querySelector('#contatos').addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;window.__contactDestinations.push(a.getAttribute('href'));e.preventDefault();});});
  for(const selector of [...content.locations.map(s=>`[data-contact-store="${s.id}"]`),'[data-contact-instagram]','[data-contact-event]']){await page.locator(selector).focus();await page.keyboard.press('Enter');}
  const destinations=await page.evaluate(()=>window.__contactDestinations);check(destinations.length===7&&destinations[0]===`tel:${content.locations[0].tel}`&&destinations.at(-1)===content.conversion.event_whatsapp_href,'Teclado: sete ações acionadas para destinos corretos, sem envio externo');
  await page.goto(base+'/menu/',{waitUntil:'networkidle'});await page.locator('.site-footer').getByRole('link',{name:'Contato',exact:true}).click();await page.waitForURL(base+'/#contatos');check(await page.locator('section#contatos').isVisible(),'Rodapé interno: atalho Contato abre a seção da Home');await context.close();
  for(const mode of ['no-js','reduced']){
    const context=await browser.newContext({viewport:{width:390,height:844},...(mode==='no-js'?{javaScriptEnabled:false}:{reducedMotion:'reduce'})}),page=await context.newPage();await page.goto(base+'/#contatos',{waitUntil:'networkidle'});await ready(page);
    check(await page.locator('.contact-address').isVisible()&&await page.locator('[data-contact-form]').count()===1&&await page.locator('[data-contact-submit]').isDisabled()&&await page.locator('[data-contact-store]').count()===5,`${mode}: campos, aviso de envio pendente e cinco telefones disponíveis`);
    if(mode==='no-js'){await page.goto(base+'/sobre/',{waitUntil:'networkidle'});await page.locator('.no-js-nav').getByRole('link',{name:'Contato',exact:true}).click();await page.waitForURL(base+'/#contatos');check(await page.locator('section#contatos').isVisible(),'no-js: navegação alternativa chega ao contato');}
    else{await page.locator('[data-contact-store="haddock"]').hover();check(await page.locator('[data-contact-store="haddock"]').evaluate(e=>getComputedStyle(e,'::after').transitionDuration==='0s'),'reduced: filetes sem animação');}
    await context.close();
  }
}catch(error){report.errors.push(error.stack||String(error));}
finally{await browser.close();await fs.writeFile(path.join(out,`contact-${pass}-report.json`),JSON.stringify(report,null,2));}
function innerHeightSafe(width){return width<700?844:960;}
console.log(JSON.stringify({checks:report.checks.length,viewports:report.viewports.length,failures:report.failures,errors:report.errors,native_transition_skips:report.native_transition_skips},null,2));if(report.failures.length||report.errors.length)process.exitCode=1;
