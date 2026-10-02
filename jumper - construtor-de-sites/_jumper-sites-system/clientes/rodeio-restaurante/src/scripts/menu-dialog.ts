export {};
const dialog=document.querySelector<HTMLDialogElement>('#digital-menu-dialog');
const closeButton=dialog?.querySelector<HTMLButtonElement>('[data-close-digital-menu]');
const slot=dialog?.querySelector<HTMLElement>('[data-menu-frame-slot]');
const status=dialog?.querySelector<HTMLElement>('[data-menu-status]');
const menuUrl=dialog?.dataset.menuUrl;
let opener:HTMLAnchorElement|null=null;
let frame:HTMLIFrameElement|null=null;
let loadingTimer:ReturnType<typeof setTimeout>|undefined;
function clearLoadingTimer(){if(loadingTimer!==undefined){clearTimeout(loadingTimer);loadingTimer=undefined;}}
if(dialog&&closeButton&&slot&&status&&menuUrl&&typeof dialog.showModal==='function'){
 const showStatus=(text:string)=>{status.textContent=text;status.hidden=false;};
 const slowMessage='O cardápio está demorando a carregar. Você também pode abri-lo em outra aba.';
 // Keep the original href working without JavaScript and for modified clicks.
 document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link=>{
  if(link.href!==menuUrl||dialog.contains(link))return;
  link.setAttribute('aria-haspopup','dialog');link.setAttribute('aria-controls',dialog.id);
  link.addEventListener('click',event=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   event.preventDefault();opener=link;
   if(dialog.open)return;
   showStatus('Carregando o cardápio…');dialog.showModal();closeButton.focus();
   const incoming=document.createElement('iframe');frame=incoming;frame.title='Cardápio digital do Rodeio';frame.referrerPolicy='strict-origin-when-cross-origin';
   frame.addEventListener('load',()=>{if(frame!==incoming||!dialog.open)return;clearLoadingTimer();status.hidden=true;},{once:true});
   frame.addEventListener('error',()=>{if(frame!==incoming||!dialog.open)return;clearLoadingTimer();showStatus('Não foi possível carregar o cardápio. Use o link abaixo para abrir em outra aba.');},{once:true});
   loadingTimer=setTimeout(()=>showStatus(slowMessage),15000);
   frame.src=menuUrl;slot.append(frame);
  });
 });
 closeButton.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const rect=dialog.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
 });
 dialog.addEventListener('close',()=>{clearLoadingTimer();frame?.remove();frame=null;status.hidden=true;opener?.focus({preventScroll:true});});
 // Include the frame in the tab sequence; the close control stays outside it.
 dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const last=dialog.querySelector<HTMLAnchorElement>('.digital-menu-footer a');
  if(event.shiftKey&&document.activeElement===closeButton){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();closeButton.focus();}
 });
}
