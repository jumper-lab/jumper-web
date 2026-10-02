import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url),pw=require(process.env.JUMPER_PLAYWRIGHT||'/Users/marajah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'data/visual-review'),base=process.env.PREVIEW_URL||'http://127.0.0.1:4327',pass=process.env.JUMPER_FORM_PASS||'final';
await fs.mkdir(out,{recursive:true});
const browser=await pw.chromium.launch({headless:true,...(!existsSync(pw.chromium.executablePath())?{channel:'chrome'}:{})});
const report={date:new Date().toISOString(),pass,scope:'frontend_only; all configured submissions intercepted in test browser; real delivery NOT tested',checks:[],viewports:[],failures:[],errors:[]};
const check=(ok,label,data)=>{report.checks.push({ok,label,...(data?{data}:{})});if(!ok)report.failures.push(label);};
const ready=async page=>{await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(700);};
const watch=page=>page.on('pageerror',e=>report.errors.push(e.message));
try{
  for(const width of [320,390,768,1024,1440,1920]){
    const context=await browser.newContext({viewport:{width,height:width<700?844:960}}),page=await context.newPage();watch(page);
    await page.goto(base+'/#contatos',{waitUntil:'networkidle'});await ready(page);
    const data=await page.locator('[data-contact-form]').evaluate(form=>{
      const fields=[...form.querySelectorAll('.contact-field input,.contact-field textarea')],r=form.getBoundingClientRect();
      return{endpoint:form.dataset.endpoint,action:form.getAttribute('action'),mailto:form.closest('#contatos').querySelectorAll('a[href^="mailto:"]').length,overflow:document.documentElement.scrollWidth-innerWidth,width:r.width,fields:fields.map(f=>({name:f.name,type:f.type,required:f.required,autocomplete:f.autocomplete,maxlength:f.maxLength,label:f.labels[0].textContent.trim(),x:f.getBoundingClientRect().x,y:f.getBoundingClientRect().y,w:f.getBoundingClientRect().width,h:f.getBoundingClientRect().height,fontSize:getComputedStyle(f).fontSize,inside:f.getBoundingClientRect().left>=r.left-1&&f.getBoundingClientRect().right<=r.right+1}))};
    });report.viewports.push({viewportWidth:width,...data});
    check(data.fields.map(f=>f.name).join(',')==='name,email,message'&&data.fields.every(f=>f.required&&f.inside&&f.h>=44),`Form@${width}: três campos obrigatórios e alvos íntegros`);
    check(data.fields[1].type==='email'&&data.fields[0].autocomplete==='name'&&data.fields[1].autocomplete==='email'&&data.fields.map(f=>f.maxlength).join(',')==='100,254,4000',`Form@${width}: tipos, preenchimento automático e limites`);
    check((width<=900?data.fields[1].y>data.fields[0].y:Math.abs(data.fields[0].y-data.fields[1].y)<1)&&(width>=700||data.fields.every(f=>f.fontSize==='16px')),`Form@${width}: campos ${width<=900?'empilhados':'lado a lado'}, tamanho de leitura adequado`);
    check(!data.endpoint&&!data.action&&data.mailto===0&&data.overflow<=1&&await page.locator('[data-contact-submit]').isDisabled()&&await page.locator('#contact-form-note').textContent().then(t=>t.includes('configuração')),`Form@${width}: nenhum mailto/overflow/envio fictício; pendência explícita`);
    await page.locator('[data-contact-form]').screenshot({path:path.join(out,`contact-form-${pass}-${width}.png`)});
    await page.locator('#contact-name').fill('Cliente de teste');await page.locator('#contact-email').fill('cliente@example.invalid');await page.locator('#contact-message').fill('Mensagem de teste local. Nenhum envio real.');
    await page.locator('#contact-message').focus();await page.waitForTimeout(500);
    check(await page.locator('#contact-message').evaluate(e=>e===document.activeElement&&getComputedStyle(e).outlineColor==='rgb(159, 43, 52)'&&getComputedStyle(e.parentElement,'::after').transform==='matrix(1, 0, 0, 1, 0, 0)'&&getComputedStyle(e.parentElement,'::after').borderTopColor==='rgb(159, 43, 52)'),`Form@${width}: foco e filete vermelhos da marca`);
    await page.locator('#contact-message').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`contact-form-${pass}-filled-${width}.png`)});
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage();watch(page);
  await page.goto(base+'/#contatos',{waitUntil:'networkidle'});await ready(page);
  const form=page.locator('[data-contact-form]'),status=page.locator('[data-contact-status]'),button=page.locator('[data-contact-submit]');
  await form.evaluate(f=>f.requestSubmit());
  check(await status.getAttribute('data-state')==='error'&&await status.textContent().then(t=>t.includes('Nenhuma mensagem foi enviada')),'Sem endpoint: submit programático não simula sucesso');
  // This URL is injected ONLY in this ephemeral test document; all its requests are intercepted.
  const endpoint='https://contact-endpoint.invalid/submit';
  await form.evaluate((f,url)=>{f.dataset.endpoint=url;f.action=url;f.querySelector('button').disabled=false;},endpoint);
  let requests=[],release,response={status:200,contentType:'application/json',body:JSON.stringify({ok:true})},hold=false;
  await page.route(endpoint,async route=>{requests.push(route.request().postData());if(hold)await new Promise(r=>{release=r;});await route.fulfill(response).catch(()=>{});});
  await button.click();
  check(requests.length===0&&await page.locator('[aria-invalid=true]').count()===3&&await page.locator('#contact-name').evaluate(e=>e===document.activeElement),'Vazios: três erros associados, foco no nome, nenhuma requisição');
  await page.screenshot({path:path.join(out,`contact-form-${pass}-errors-1440.png`)});
  await page.locator('#contact-name').fill('   ');await page.locator('#contact-email').fill('endereço inválido');await page.locator('#contact-message').fill('   ');await form.evaluate(f=>f.requestSubmit());
  check(requests.length===0&&await page.locator('[aria-invalid=true]').count()===3&&await page.locator('#contact-email-error').textContent().then(t=>t.includes('endereço')),'Espaços/e-mail inválido: envio bloqueado e orientação em português');
  const fill=async()=>{await page.locator('#contact-name').fill('  Cliente de teste  ');await page.locator('#contact-email').fill('cliente@example.invalid');await page.locator('#contact-message').fill('  Recado de teste.  ');};
  await fill();await page.locator('#contact-company').evaluate(e=>e.value='bot');await button.click();
  check(requests.length===0&&await status.getAttribute('data-state')==='error','Honeypot: preenchimento automatizado bloqueado sem requisição');
  await page.locator('#contact-company').evaluate(e=>e.value='');
  hold=true;await button.click();await page.waitForFunction(()=>document.querySelector('[data-contact-form]').getAttribute('aria-busy')==='true');
  await form.evaluate(f=>{f.requestSubmit();f.requestSubmit();});
  check(requests.length===1&&await button.isDisabled()&&await button.textContent()==='Enviando…','Pendente: indicador de envio e bloqueio de duplicatas');
  check(requests[0].includes('name="name"\r\n\r\nCliente de teste\r\n')&&requests[0].includes('name="email"\r\n\r\ncliente@example.invalid\r\n')&&requests[0].includes('name="message"\r\n\r\nRecado de teste.\r\n'),'POST mock: somente payload esperado, com valores aparados');
  release();hold=false;await page.waitForFunction(()=>document.querySelector('[data-contact-status]').dataset.state==='success');
  check(await page.locator('#contact-name').inputValue()===''&&await page.locator('#contact-message').inputValue()===''&&!await button.isDisabled(),'Sucesso JSON explícito: confirmação do serviço e limpeza sem alegar entrega por e-mail');
  check(!await form.getAttribute('aria-busy')&&await status.getAttribute('role')==='status'&&await status.getAttribute('aria-live')==='polite','Acessibilidade: status anunciado e aria-busy liberado');
  await page.locator('#contact-message').fill('Novo recado');check(await status.isHidden(),'Nova edição: confirmação anterior escondida');
  for(const [label,mock] of [['HTTP 500',{status:500,contentType:'application/json',body:'{"ok":false}'}],['HTML 200',{status:200,contentType:'text/html',body:'<p>not confirmation</p>'}],['JSON sem confirmação',{status:200,contentType:'application/json',body:'{}'}],['JSON com erros',{status:200,contentType:'application/json',body:'{"ok":true,"errors":["rejected"]}'}]]){
    await fill();response=mock;await button.click();await page.waitForFunction(()=>!document.querySelector('[data-contact-form]').hasAttribute('aria-busy')&&!document.querySelector('[data-contact-status]').hidden&&document.querySelector('[data-contact-status]').dataset.state==='error');
    check(await page.locator('#contact-message').inputValue()==='  Recado de teste.  '&&!await button.isDisabled()&&await status.textContent().then(t=>t.includes('texto foi mantido')),`${label}: sem falso sucesso; mensagem preservada para nova tentativa`);
  }
  response={status:200,contentType:'application/json',body:'{"success":true}'};hold=true;await fill();await button.click();
  await page.waitForFunction(()=>document.querySelector('[data-contact-form]').hasAttribute('aria-busy'));await page.waitForTimeout(50);await page.locator('#contact-message').fill('Edição feita enquanto aguardava.');release();hold=false;
  await page.waitForFunction(()=>document.querySelector('[data-contact-status]').dataset.state==='success');
  check(await page.locator('#contact-message').inputValue()==='Edição feita enquanto aguardava.','Sucesso tardio: edições novas nunca são apagadas');
  await fill();await form.evaluate(f=>f.dataset.endpoint='http://contact-endpoint.invalid/submit');const previous=requests.length;await button.click();
  check(requests.length===previous&&await status.getAttribute('data-state')==='error','Configuração insegura: HTTP rejeitado antes de enviar dados');
  await form.evaluate((f,url)=>f.dataset.endpoint=url,endpoint);await page.clock.install();hold=true;await button.click();await page.waitForFunction(()=>document.querySelector('[data-contact-form]').hasAttribute('aria-busy'));await page.waitForTimeout(50);await page.clock.runFor(12500);
  await page.waitForFunction(()=>document.querySelector('[data-contact-status]').dataset.state==='error');release();hold=false;
  check(!await button.isDisabled()&&await page.locator('#contact-message').inputValue()==='  Recado de teste.  ','Timeout 12s: cancela espera, preserva recado e permite tentar novamente');
  await context.close();
  for(const mode of ['no-js','reduced']){
    const context=await browser.newContext({viewport:{width:390,height:844},...(mode==='no-js'?{javaScriptEnabled:false}:{reducedMotion:'reduce'})}),page=await context.newPage();watch(page);
    await page.goto(base+'/#contatos',{waitUntil:'networkidle'});await ready(page);
    check(await page.locator('.contact-field input,.contact-field textarea').count()===3&&await page.locator('[data-contact-submit]').isDisabled()&&await page.locator('#contact-form-note').isVisible(),`${mode}: campos visíveis e indisponibilidade honesta`);
    if(mode==='reduced'){await page.locator('#contact-name').focus();check(await page.locator('#contact-name').evaluate(e=>getComputedStyle(e.parentElement,'::after').transitionDuration==='0s'),'Movimento reduzido: filete sem animação');}
    await context.close();
  }
}catch(error){report.errors.push(error.stack||String(error));}
finally{await browser.close();await fs.writeFile(path.join(out,`contact-form-${pass}-report.json`),JSON.stringify(report,null,2));}
console.log(JSON.stringify({checks:report.checks.length,viewports:report.viewports.length,failures:report.failures,errors:report.errors},null,2));if(report.failures.length||report.errors.length)process.exitCode=1;
