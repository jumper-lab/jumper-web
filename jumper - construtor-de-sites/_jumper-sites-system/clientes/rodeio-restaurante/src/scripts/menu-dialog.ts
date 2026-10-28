export {};
// One controller per external page keeps menu and events state independent.
for(const dialog of document.querySelectorAll<HTMLDialogElement>('.digital-menu-dialog')){
const closeButton=dialog?.querySelector<HTMLButtonElement>('[data-close-digital-menu]');
const slot=dialog?.querySelector<HTMLElement>('[data-menu-frame-slot]');
const status=dialog?.querySelector<HTMLElement>('[data-menu-status]');
const menuUrl=dialog.dataset.menuUrl ? new URL(dialog.dataset.menuUrl, document.baseURI).href : undefined;
const menuUrls=new Set([menuUrl, dialog.dataset.menuAliasUrl ? new URL(dialog.dataset.menuAliasUrl, document.baseURI).href : undefined].filter(Boolean));
const pageLabel=dialog.dataset.pageLabel||'o cardápio';
const frameTitle=dialog.dataset.frameTitle||'Cardápio digital do Rodeio';
let opener:HTMLElement|null=null;
let frame:HTMLIFrameElement|null=null;
let pageScroll={x:0,y:0};
let loadingTimer:ReturnType<typeof setTimeout>|undefined;
function clearLoadingTimer(){if(loadingTimer!==undefined){clearTimeout(loadingTimer);loadingTimer=undefined;}}
if(dialog&&closeButton&&slot&&status&&menuUrl&&typeof dialog.showModal==='function'){
 const showStatus=(text:string)=>{status.textContent=text;status.hidden=false;};
 const slowMessage=`O conteúdo está demorando a carregar. Tente a opção de tela cheia abaixo.`;
 // Keep the original href working without JavaScript and for modified clicks.
 document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link=>{
  if(!menuUrls.has(link.href)||dialog.contains(link)||link.hasAttribute('download'))return;
  link.setAttribute('aria-haspopup','dialog');link.setAttribute('aria-controls',dialog.id);
 });
 document.addEventListener('click',event=>{
   const link=(event.target as Element).closest<HTMLAnchorElement>('a[href]');
   if(!link||!menuUrls.has(link.href)||dialog.contains(link)||link.hasAttribute('download'))return;
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   event.preventDefault();
   if(dialog.open)return;
   const navigation=link.closest<HTMLDialogElement>('#navigation-dialog');
   opener=navigation?document.querySelector<HTMLButtonElement>('[data-open-menu]'):link;
   // Hand off to the external page instead of stacking two modal dialogs.
   if(navigation?.open)navigation.close();
   pageScroll={x:window.scrollX,y:window.scrollY};
   showStatus(`Carregando ${pageLabel}…`);dialog.showModal();closeButton.focus();
   if (dialog.hasAttribute('data-local-content')) { status.hidden=true; return; }
   const incoming=document.createElement('iframe');frame=incoming;frame.title=frameTitle;frame.referrerPolicy='strict-origin-when-cross-origin';
   frame.addEventListener('load',()=>{if(frame!==incoming||!dialog.open)return;clearLoadingTimer();status.hidden=true;},{once:true});
   frame.addEventListener('error',()=>{if(frame!==incoming||!dialog.open)return;clearLoadingTimer();showStatus('Não foi possível carregar a página. Tente a opção de tela cheia abaixo.');},{once:true});
   loadingTimer=setTimeout(()=>showStatus(slowMessage),15000);
   frame.src=menuUrl;slot.append(frame);
 });
 closeButton.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const rect=dialog.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
 });
 dialog.addEventListener('close',()=>{clearLoadingTimer();frame?.remove();frame=null;status.hidden=true;window.scrollTo({left:pageScroll.x,top:pageScroll.y,behavior:'instant'});opener?.focus({preventScroll:true});});
 // Keep keyboard focus within the active lightbox, including local form fields.
 dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const controls=Array.from(dialog.querySelectorAll<HTMLElement>('a[href],button,input:not([type="hidden"]),select,textarea,iframe,[tabindex]')).filter(element=>!element.hasAttribute('disabled')&&element.tabIndex>=0&&element.getClientRects().length>0);
  const first=controls[0],last=controls.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 });
}
}
