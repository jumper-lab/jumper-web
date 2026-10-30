/* Offline integration of the actual editor scripts against WordPress-rendered ACF fixtures.
 * It verifies event routing, not browser layout or pointer hit testing. No network or saves.
 */
const fs=require('node:fs');const path=require('node:path');
const {JSDOM,VirtualConsole}=require(require.resolve('jsdom',{paths:[process.env.RODEIO_AUDIT_RUNTIME||process.cwd()]}));
const folder=process.argv[2];if(!folder)throw new Error('Pass the private fixture directory');
const scripts=['editor-form.js','editor-device-preview.js'].map(name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8'));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function audit(fixture){
  const config=fixture.config;const data=!!config.dataFields;const id=data?'acf-group_rodeio_settings_v2':'acf-group_rodeio_editor_v1';
  const dom=new JSDOM(`<form id="post"><div id="${id}"><div class="inside">${fixture.fields}</div></div></form>`,{url:'https://rodeio.invalid/wp-admin/post.php',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:new VirtualConsole()});
  const w=dom.window,d=w.document,root=d.getElementById(id);const nativeTimer=w.setTimeout.bind(w);w.setTimeout=(fn,delay,...args)=>nativeTimer(fn,delay===100?0:delay,...args);w.rodeioEditorStudio=config;w.rodeioDevicePreview=config;
  w.ResizeObserver=class{observe(){}disconnect(){}};w.requestAnimationFrame=fn=>{fn();return 1;};w.HTMLElement.prototype.scrollIntoView=function(){w.lastScrolled=this;};
  w.HTMLDialogElement.prototype.show=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{get(){return this.classList.contains('rde-device-stage')?1320:390;}});
  Object.defineProperty(w.HTMLElement.prototype,'clientHeight',{get(){return 600;}});
  w.fetch=async url=>({ok:true,json:async()=>({success:true,data:{html:fixture.previews[new URL(url).searchParams.get('context')||'general']}})});
  w.open=url=>{w.lastOpenedURL=url;return null;};
  Object.defineProperty(w.HTMLIFrameElement.prototype,'srcdoc',{set(html){const doc=this.contentDocument;doc.open();doc.write(html);doc.close();this.contentWindow.scrollTo=()=>{};setImmediate(()=>this.onload?.());}});
  const values=()=>Array.from(root.querySelectorAll('[name]')).map(input=>[input.name,input.value]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const before=values();
  if(!data)w.eval(scripts[0]);w.eval(scripts[1]);d.dispatchEvent(new w.Event('DOMContentLoaded'));
  const modal=d.querySelector('.rde-device-dialog'),frame=modal.querySelector('iframe');const launch=d.querySelectorAll('.rde-device-launch-modes button');
  const result={id:fixture.id,title:fixture.title,checks:0,sharedOrigins:[],failures:[],modes:[]};
  const open=async mode=>{launch[mode==='desktop'?0:1].click();for(let i=0;i<30&&!modal.querySelector('.rde-device-loading').hidden;i++)await tick();if(!modal.querySelector('.rde-device-loading').hidden)throw new Error('Preview did not load');};
  const parts=data?[]:config.blocks.flatMap(block=>block.groups.flatMap(group=>group.parts)).filter(part=>!part.technical);
  for(const mode of ['desktop','mobile']){
    await open(mode);result.modes.push({mode,width:frame.style.width});modal.close();
    if(data){
      for(const field of config.dataFields){
        const context=field.tab==='general'?'general':field.tab;const select=modal.querySelector('select');select.value=context;select.dispatchEvent(new w.Event('change'));await tick();await open(mode);
        const target=frame.contentDocument.querySelector(`[data-rde-setting-preview="${field.key}"]`);
        if(!target){result.failures.push({mode,key:field.key,error:'No data preview target'});modal.close();continue;}
        target.dispatchEvent(new frame.contentWindow.MouseEvent('click',{bubbles:true,cancelable:true}));await tick();result.checks++;
        if(d.activeElement!==root.querySelector(`[data-name="rde_site_${field.key}"] input`))result.failures.push({mode,key:field.key,error:'Wrong named field focus'});
      }
      continue;
    }
    for(const part of parts){
      const key=`${part.kind}:${part.index}`;const menu=part.kind==='menus';
      await open(mode);const node=frame.contentDocument.querySelector(`[data-rde-preview~="${key}"]`);
      if(!node){result.failures.push({mode,key,error:'No preview target'});modal.close();continue;}
      const targets=menu?Array.from(node.querySelectorAll('[data-rde-menu-item]')):[node];modal.close();
      for(let item=0;item<targets.length;item++){
        await open(mode);const current=frame.contentDocument.querySelector(`[data-rde-preview~="${key}"]`);const target=menu?current.querySelectorAll('[data-rde-menu-item]')[item]:current;
        w.lastOpenedURL=null;(target.querySelector('svg path')||target).dispatchEvent(new frame.contentWindow.MouseEvent('click',{bubbles:true,cancelable:true}));await tick();result.checks++;
        const selected=root.querySelector('.rde-preview-field-selected');const active=d.activeElement;
        if(!modal.open){result.failures.push({mode,key,item,error:'Click closed the live preview'});continue;}
        if(part.shared){
          result.sharedOrigins.push({mode,key,origin:part.shared,field:part.sharedField,url:w.lastOpenedURL});
          const opened=w.lastOpenedURL?new URL(w.lastOpenedURL):null;
          if(!opened||opened.origin!=='https://rodeiosp.com.br'||(part.sharedField!=='menu_pdf'&&opened.searchParams.get('rde_field')!==part.sharedField))result.failures.push({mode,key,error:'Wrong shared field destination'});
          continue;
        }
        if(selected?.dataset.rdeSelectedKey!==key)result.failures.push({mode,key,item,error:'Wrong selected card'});
        if(selected?.closest('[hidden]'))result.failures.push({mode,key,item,error:'Selected card is hidden'});
        if(part.kind==='texts'||part.kind==='links'){
          if(active.dataset.rdeProxy!==key)result.failures.push({mode,key,item,error:'Wrong editor focus',actual:active.dataset.rdeProxy||active.tagName});
        }else if(part.kind==='images'){
          if(active.tagName!=='BUTTON'||active.textContent!=='Trocar imagem')result.failures.push({mode,key,item,error:'Image selector did not receive focus'});
        }else{
          const row=root.querySelector(`.acf-field[data-name="rde_menus"]`).querySelectorAll(':scope > .acf-input > .acf-repeater > .acf-table > tbody > tr.acf-row:not(.acf-clone)')[part.index];
          if(active!==row.querySelectorAll('[data-name="rde_menuitem_label"] input')[item])result.failures.push({mode,key,item,error:'Wrong menu item focus'});
        }
      }
    }
    // Edit the native/proxy fields while the companion is open, without reopening or saving.
    const settle=()=>new Promise(resolve=>setTimeout(resolve,10));
    const cases=data?config.dataFields:['texts','links','images'].map(kind=>parts.find(part=>!part.shared&&part.kind===kind)).filter(Boolean);
    for(const entry of cases){
      if(data){const select=modal.querySelector('select');select.value=entry.tab==='general'?'general':entry.tab;select.dispatchEvent(new w.Event('change'));await tick();}
      await open(mode);const key=data?entry.key:`${entry.kind}:${entry.index}`;
      const input=data?root.querySelector(`[data-name="rde_site_${key}"] input`):entry.kind==='images'?root.querySelectorAll('.acf-field[data-name="rde_images"] > .acf-input > .acf-repeater > .acf-table > tbody > tr.acf-row:not(.acf-clone)')[entry.index]?.querySelector('[data-name="rde_images_alt"] input'):root.querySelector(`[data-rde-proxy="${key}"]`);
      if(!input)continue;const old=input.value;input.value=entry.kind==='images'?'Descrição temporária da foto':data||entry.kind==='texts'?'Prévia temporária sem salvar':'/preview-unsaved/';input.dispatchEvent(new w.Event('input',{bubbles:true}));await settle();
      const target=data?frame.contentDocument.querySelector(`[data-rde-setting-preview="${key}"]`):frame.contentDocument.querySelector(`[data-rde-preview~="${key}"]`);
      const actual=entry.kind==='images'?(target.matches('img')?target:target.querySelector('img')).alt:data&&target.dataset.rdeSettingKind==='link'||entry.kind==='links'?target.dataset.rdeDestination:target.textContent;
      const expected=entry.kind==='links'?root.querySelectorAll('.acf-field[data-name="rde_links"] > .acf-input > .acf-repeater > .acf-table > tbody > tr.acf-row:not(.acf-clone)')[entry.index].querySelector('[data-name="rde_links_url"] input').value:input.value;
      result.checks++;if(actual!==expected||!modal.open)result.failures.push({mode,key,error:'Unsaved edit not reflected in open preview',actual});
      input.value=old;input.dispatchEvent(new w.Event('input',{bubbles:true}));await settle();
      if(entry.kind==='images'){
        const card=root.querySelector(`[data-rde-parts~="${key}"]`),image=target.matches('img')?target:target.querySelector('img'),original=image.getAttribute('src');
        card.dataset.rdePreviewDesktop='https://rodeio.invalid/draft-image.webp';await settle();result.checks++;
        if(image.getAttribute('src')!=='https://rodeio.invalid/draft-image.webp')result.failures.push({mode,key,error:'Selected image not live'});
        delete card.dataset.rdePreviewDesktop;await settle();result.checks++;if(image.getAttribute('src')!==original)result.failures.push({mode,key,error:'Image revert not live'});
      }

    }
    for(const part of parts.filter(part=>part.kind==='menus')){
      const row=root.querySelector('.acf-field[data-name="rde_menus"]').querySelectorAll(':scope > .acf-input > .acf-repeater > .acf-table > tbody > tr.acf-row:not(.acf-clone)')[part.index];
      const labels=Array.from(row.querySelectorAll('[data-name="rde_menuitem_label"] input')).filter(input=>!input.closest('.acf-row').classList.contains('acf-clone'));
      if(labels.length<2)continue;
      labels[1].closest('.acf-row').before(labels[0].closest('.acf-row'));
      await open(mode);const anchor=frame.contentDocument.querySelector(`[data-rde-preview~="menus:${part.index}"] [data-rde-menu-item="0"]`);const original=Array.from(row.querySelectorAll('[data-name="rde_menuitem_key"] input')).find(input=>input.value===anchor.dataset.rdeMenuKey)?.closest('.acf-row')?.querySelector('[data-name="rde_menuitem_label"] input');
      anchor.dispatchEvent(new frame.contentWindow.MouseEvent('click',{bubbles:true,cancelable:true}));await tick();result.checks++;
      if(!original||d.activeElement!==original)result.failures.push({mode,key:`menus:${part.index}`,error:'Wrong item after menu reordering'});
      const savedLabel=original.value;original.value='Menu em edição';original.dispatchEvent(new w.Event('input',{bubbles:true}));await settle();
      const menu=frame.contentDocument.querySelector(`[data-rde-preview~="menus:${part.index}"]`);result.checks++;
      if(!menu.textContent.includes('Menu em edição'))result.failures.push({mode,error:'Menu rename not live'});
      original.value=savedLabel;original.dispatchEvent(new w.Event('input',{bubbles:true}));await settle();
      const extra=original.closest('.acf-row').cloneNode(true);extra.querySelector('[data-name="rde_menuitem_label"] input').value='Novo item temporário';extra.querySelector('[data-name="rde_menuitem_key"] input').value='temporary-menu-key';original.closest('.acf-row').after(extra);await settle();result.checks++;
      if(!menu.textContent.includes('Novo item temporário'))result.failures.push({mode,error:'Menu addition not live'});
      extra.remove();await settle();result.checks++;if(menu.textContent.includes('Novo item temporário'))result.failures.push({mode,error:'Menu deletion not live'});

    }
  }
  if(data){
    // ACF creates these native tab buttons client-side; assert our requested-tab contract.
    for(const tab of new Set(config.dataFields.map(field=>field.tab))){const button=d.createElement('button');button.type='button';button.className='acf-tab-button';button.dataset.key=`field_rde_site_tab_${tab}`;button.addEventListener('click',()=>w.requestedDataTab=tab);root.prepend(button);}
    for(const field of config.dataFields){
      d.querySelectorAll('.rde-device-launcher,.rde-device-dialog').forEach(node=>node.remove());delete root.dataset.devicePreview;
      w.history.replaceState(null,'',`?rde_field=${field.key}`);w.requestedDataTab=null;w.eval(scripts[1]);await tick();result.checks++;
      if(w.requestedDataTab!==field.tab||d.activeElement!==root.querySelector(`[data-name="rde_site_${field.key}"] input`))result.failures.push({key:field.key,error:'Shared-field URL did not open the requested tab and input'});
    }
  }
  const after=values();
  result.namedValuesUnchanged=JSON.stringify(before)===JSON.stringify(after);if(!result.namedValuesUnchanged)result.failures.push({error:'Native values changed during selection'});
  dom.window.close();return result;
}
(async()=>{const results=[];for(const file of fs.readdirSync(folder).filter(name=>/^\d+\.json$/.test(name))){const fixture=JSON.parse(fs.readFileSync(path.join(folder,file),'utf8'));results.push(await audit(fixture));console.log(JSON.stringify({id:fixture.id,failures:results.at(-1).failures}));}
const report={environment:'DOM integration with actual WordPress ACF markup; no browser layout claims',records:results.length,checks:results.reduce((n,r)=>n+r.checks,0),failures:results.flatMap(r=>r.failures.map(f=>({id:r.id,...f}))),sharedOriginCases:results.reduce((n,r)=>n+r.sharedOrigins.length,0),results};
fs.writeFileSync(path.join(folder,'..','routing-audit.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({records:report.records,checks:report.checks,failures:report.failures,sharedOriginCases:report.sharedOriginCases}));if(report.failures.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
