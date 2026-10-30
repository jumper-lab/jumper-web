(() => {
  'use strict';
  const boot=()=>{
    const config=window.rodeioDevicePreview;
    const root=document.getElementById(config?.dataFields?'acf-group_rodeio_settings_v2':'acf-group_rodeio_editor_v1');
    if(!config||!root||root.dataset.devicePreview)return;
    root.dataset.devicePreview='ready';
    const make=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text)node.textContent=text;return node;};
    const button=(text,icon)=>{const node=make('button','',text);node.type='button';if(icon){const glyph=make('span',`dashicons dashicons-${icon}`);glyph.setAttribute('aria-hidden','true');node.prepend(glyph);}return node;};
    const launcher=make('div','rde-device-launcher');const intro=make('div');intro.append(make('strong','','Encontre o que quer editar'),make('small','','Abra a prévia e clique diretamente no conteúdo.'));
    const launchModes=make('div','rde-device-launch-modes');const launchDesktop=button('Computador','desktop'),launchMobile=button('Celular','smartphone');launchModes.append(launchDesktop,launchMobile);
    const selection=make('p','rde-device-selection');selection.setAttribute('role','status');selection.hidden=true;launcher.append(intro,launchModes,selection);
    if(config.dataFields)root.before(launcher);else root.querySelector('.rde-form-steps')?.after(launcher);
    const modal=make('dialog','rde-device-dialog');modal.setAttribute('aria-label','Prévia interativa para editar '+config.title);
    const head=make('div','rde-device-head');const heading=make('div');heading.append(make('p','rde-device-eyebrow','RODEIO · PRÉVIA INTERATIVA'),make('h2','',config.title));
    const close=button('Fechar prévia ×');close.className='rde-device-close';head.append(heading,close);
    const toolbar=make('div','rde-device-toolbar'),modes=make('div','rde-device-modes');const desktop=button('Computador','desktop'),mobile=button('Celular','smartphone');desktop.setAttribute('aria-pressed','true');mobile.setAttribute('aria-pressed','false');modes.append(desktop,mobile);
    const area=make('label','rde-device-area');area.append(make('span','',config.dataFields?'Onde visualizar':'Seção da prévia'));const areaSelect=make('select');area.append(areaSelect);toolbar.append(modes,area);
    const blocks=(config.blocks||[]).filter(block=>block.groups.some(group=>group.parts.some(part=>!part.technical)));
    const choices=config.dataFields?[{key:'general',title:'Contatos e pedidos · rodapé'},{key:'jardins',title:'Rodeio Jardins'},{key:'iguatemi',title:'Rodeio Iguatemi'}]:blocks;
    choices.forEach(choice=>{const option=make('option','',choice.title);option.value=choice.key;areaSelect.append(option);});
    const stage=make('div','rde-device-stage'),viewport=make('div','rde-device-viewport'),frame=make('iframe','rde-device-frame');frame.title='Prévia editável · '+config.title;frame.setAttribute('sandbox','allow-same-origin');frame.setAttribute('referrerpolicy','same-origin');viewport.append(frame);stage.append(viewport);
    const loading=make('div','rde-device-loading','Carregando prévia…');loading.setAttribute('role','status');stage.append(loading);
    const foot=make('div','rde-device-foot');const status=make('p','','Clique no trecho que deseja editar. Links e formulários estão em modo de seleção.');status.setAttribute('role','status');const retry=button('Tentar novamente');retry.hidden=true;foot.append(status,retry);
    modal.append(head,toolbar,stage,foot);document.body.append(modal);
    let device='desktop',doc=null,context='',loadingPromise=null;
    const rows=kind=>Array.from(root.querySelector(`.acf-field[data-name="rde_${kind}"]`)?.querySelectorAll(':scope > .acf-input > .acf-repeater > .acf-table > tbody > tr.acf-row:not(.acf-clone)')||[]);
    const source=(kind,index,suffix)=>rows(kind)[index]?.querySelector(`[data-name="rde_${kind}_${suffix}"] input,[data-name="rde_${kind}_${suffix}"] textarea`);
    const marker=key=>doc?.querySelector(`[data-rde-preview~="${key}"]`);
    const scrollTo=target=>{if(!target||!doc)return;const slide=target.closest('[data-hero-slide]');if(slide)slide.parentNode.querySelectorAll('[data-hero-slide]').forEach(node=>{node.style.opacity=node===slide?'1':'0';node.style.visibility=node===slide?'visible':'hidden';});const top=target.getBoundingClientRect().top+(doc.scrollingElement?.scrollTop||0)-40;frame.contentWindow.scrollTo({top:Math.max(0,top),behavior:'instant'});};
    const showArea=()=>{
      if(!doc||config.dataFields)return;
      const block=blocks.find(item=>item.key===areaSelect.value);const part=block?.groups.flatMap(group=>group.parts).find(part=>!part.technical&&marker(`${part.kind}:${part.index}`));const target=part?marker(`${part.kind}:${part.index}`):null;
      const dialog=target?.closest('dialog');doc.querySelectorAll('dialog').forEach(node=>node.hidden=node!==dialog);
      scrollTo(target);
    };
    const resize=()=>{if(!modal.open)return;const width=device==='mobile'?390:1280;const available=stage.clientWidth-32;const border=device==='mobile'?8:2;const ratio=Math.min(1,(available-border)/width);viewport.style.width=Math.round(width*ratio+border)+'px';frame.style.width=width+'px';frame.style.height=Math.round(viewport.clientHeight/ratio)+'px';frame.style.transform=`scale(${ratio})`;modal.dataset.device=device;desktop.setAttribute('aria-pressed',String(device==='desktop'));mobile.setAttribute('aria-pressed',String(device==='mobile'));};
    new ResizeObserver(()=>{if(modal.open)resize();}).observe(stage);
    const sync=()=>{
      if(!doc)return;
      if(config.dataFields){doc.querySelectorAll('[data-rde-setting-preview]').forEach(node=>{const input=root.querySelector(`[data-name="rde_site_${node.dataset.rdeSettingPreview}"] input`);if(input&&node.dataset.rdeSettingKind==='text')node.textContent=input.value;});return;}
      for(const part of blocks.flatMap(block=>block.groups.flatMap(group=>group.parts))){
        const node=marker(`${part.kind}:${part.index}`);if(!node)continue;
        if(part.kind==='texts'){const input=source('texts',part.index,'value');if(input)node.textContent=input.value;}
        if(part.kind==='links'){const input=source('links',part.index,'url');if(input)node.dataset.rdeDestination=input.value;}
        if(part.kind==='images'){
          const card=root.querySelector(`[data-rde-parts~="images:${part.index}"]`),image=node.matches('img')?node:node.querySelector('img'),url=source('images',part.index,'url')?.value;
          if(!image)continue;
          const picture=image.closest('picture');
          if(card?.dataset.rdePreviewDesktop||url!==part.url){image.src=card?.dataset.rdePreviewDesktop||url;image.removeAttribute('srcset');picture?.querySelectorAll('source').forEach(item=>item.removeAttribute('srcset'));}
          if(card?.dataset.rdePreviewMobile!==undefined&&picture){let small=picture.querySelector('source');if(card.dataset.rdePreviewMobile){if(!small){small=doc.createElement('source');small.media='(max-width: 767px)';picture.prepend(small);}small.srcset=card.dataset.rdePreviewMobile;}else picture.querySelectorAll('source').forEach(item=>item.removeAttribute('srcset'));}
          image.alt=source('images',part.index,'alt')?.value||'';
        }
        if(part.kind==='menus')node.querySelectorAll('[data-rde-menu-item]').forEach((anchor,index)=>{const row=rows('menus')[part.index];const labels=row?.querySelectorAll('[data-name="rde_menuitem_label"] input');const destinations=row?.querySelectorAll('[data-name="rde_menuitem_url"] input');if(labels?.[index]&&labels[index].value!==labels[index].defaultValue){const walker=doc.createTreeWalker(anchor,4);const texts=[];let text;while((text=walker.nextNode()))if(text.nodeValue.trim()&&!text.parentElement.closest('svg'))texts.push(text);if(texts.length){texts[0].nodeValue=labels[index].value;texts.slice(1).forEach(node=>node.nodeValue='');}else anchor.setAttribute('aria-label',labels[index].value);}if(destinations?.[index])anchor.dataset.rdeDestination=destinations[index].value;});
      }
    };
    const pickData=key=>{
      const field=config.dataFields.find(field=>field.key===key);if(!field)return;
      root.querySelector(`.acf-tab-button[data-key="field_rde_site_tab_${field.tab}"]`)?.click();
      const target=root.querySelector(`[data-name="rde_site_${key}"]`);if(!target)return;
      const accordion=target.closest('.acf-accordion');if(accordion&&!accordion.classList.contains('-open'))accordion.querySelector('.acf-accordion-title')?.click();
      root.querySelectorAll('.rde-preview-field-selected').forEach(node=>node.classList.remove('rde-preview-field-selected'));target.classList.add('rde-preview-field-selected');
      requestAnimationFrame(()=>{target.scrollIntoView({block:'center',behavior:'instant'});target.querySelector('input')?.focus({preventScroll:true});});
      selection.textContent='Selecionado na prévia: '+field.label;selection.hidden=false;
    };
    const clicked=event=>{
      event.preventDefault();event.stopPropagation();
      const target=event.target.closest('[data-rde-preview],[data-rde-setting-preview]');if(!target){status.textContent='Este trecho não tem um campo nesta área. Selecione um texto, foto ou botão destacado.';return;}
      if(config.dataFields){modal.close();pickData(target.dataset.rdeSettingPreview);return;}
      const keys=(target.dataset.rdePreview||'').split(' ');const key=keys.find(key=>blocks.some(block=>block.groups.some(group=>group.parts.some(part=>`${part.kind}:${part.index}`===key&&!part.technical))));
      if(!key){status.textContent='Este controle é técnico. Escolha um texto, imagem ou botão do conteúdo.';return;}
      const part=blocks.flatMap(block=>block.groups.flatMap(group=>group.parts)).find(part=>`${part.kind}:${part.index}`===key);
      if(part.shared&&part.sharedField&&part.settingsUrl){
        const origin=new URL(part.settingsUrl,location.href);if(part.sharedField!=='menu_pdf')origin.searchParams.set('rde_field',part.sharedField);
        modal.close();selection.replaceChildren(document.createTextNode('Informação compartilhada · '));const link=make('a','',`Editar ${part.shared} em ${part.settingsLabel} ↗`);link.href=origin.href;link.target='_blank';link.rel='noopener noreferrer';selection.append(link);selection.hidden=false;
        window.open(origin.href,'_blank','noopener');return;
      }
      const menuItem=event.target.closest('[data-rde-menu-item]');modal.close();root.dispatchEvent(new CustomEvent('rde:preview-pick',{detail:{key,item:Number(menuItem?.dataset.rdeMenuItem||0),itemKey:menuItem?.dataset.rdeMenuKey||''}}));
      selection.textContent='Selecionado na prévia: '+(part.fieldLabel||part.label);selection.hidden=false;
    };
    const load=async()=>{
      const next=config.dataFields?areaSelect.value:'general';
      if(doc&&context===next){sync();resize();showArea();return;}
      if(loadingPromise)return loadingPromise;
      loading.hidden=false;loading.textContent='Carregando prévia…';retry.hidden=true;areaSelect.disabled=true;
      loadingPromise=(async()=>{
        const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
        try{
          const url=new URL(config.previewEndpoint,location.href);url.searchParams.set('context',next);
          const response=await fetch(url,{credentials:'same-origin',signal:controller.signal});if(!response.ok)throw new Error();const result=await response.json();if(!result.success||!result.data?.html)throw new Error();
          await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{frame.onload=null;reject(new Error());},15000);frame.onload=()=>{clearTimeout(timer);doc=frame.contentDocument;context=next;doc.addEventListener('click',clicked,true);doc.addEventListener('submit',event=>event.preventDefault(),true);sync();resize();showArea();resolve();};frame.srcdoc=result.data.html;});
          loading.hidden=true;status.textContent='Clique no trecho que deseja editar. Use Atualizar no painel para publicar as alterações.';
        }catch(error){loading.textContent='Não foi possível carregar a prévia.';status.textContent='Seus campos continuam disponíveis. Tente novamente ou feche a prévia.';retry.hidden=false;}
        finally{clearTimeout(timeout);loadingPromise=null;areaSelect.disabled=false;}
      })();return loadingPromise;
    };
    const open=mode=>{device=mode;if(!config.dataFields){const active=root.querySelector('.rde-form-block-button[aria-pressed=true]')?.getAttribute('aria-label');const block=blocks.find(block=>block.title===active);if(block)areaSelect.value=block.key;}modal.showModal();document.body.classList.add('rde-device-preview-open');resize();load();};
    close.addEventListener('click',()=>modal.close());modal.addEventListener('close',()=>document.body.classList.remove('rde-device-preview-open'));
    launchDesktop.addEventListener('click',()=>open('desktop'));launchMobile.addEventListener('click',()=>open('mobile'));
    desktop.addEventListener('click',()=>{device='desktop';resize();requestAnimationFrame(showArea);});mobile.addEventListener('click',()=>{device='mobile';resize();requestAnimationFrame(showArea);});
    areaSelect.addEventListener('change',()=>config.dataFields?load():showArea());retry.addEventListener('click',load);
    if(config.dataFields){
      const requested=new URL(location.href).searchParams.get('rde_field');const field=config.dataFields.find(field=>field.key===requested);
      if(field){
        const reveal=()=>{if(!root.querySelector(`.acf-tab-button[data-key="field_rde_site_tab_${field.tab}"]`))return false;pickData(requested);return true;};
        if(!reveal()){const observer=new MutationObserver(()=>{if(reveal())observer.disconnect();});observer.observe(root,{subtree:true,childList:true});setTimeout(()=>observer.disconnect(),10000);}
      }
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
