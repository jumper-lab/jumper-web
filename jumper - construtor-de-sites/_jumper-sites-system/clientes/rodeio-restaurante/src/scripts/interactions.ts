export {};
const menu=document.querySelector<HTMLDialogElement>('#navigation-dialog');
const menuOpener=document.querySelector<HTMLButtonElement>('[data-open-menu]');
function closeMenu(){menu?.close();menuOpener?.focus();}
menuOpener?.addEventListener('click',()=>{menu?.showModal();menuOpener.setAttribute('aria-expanded','true');});
document.querySelector('[data-close-menu]')?.addEventListener('click',closeMenu);
menu?.addEventListener('click',e=>{if(e.target===menu)closeMenu();});
menu?.addEventListener('close',()=>{menuOpener?.setAttribute('aria-expanded','false');menuOpener?.focus();});
menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.close()));
const gallery=document.querySelector<HTMLDialogElement>('#gallery-dialog');
let galleryTrigger:HTMLElement|null=null;
let galleryRequest=0;
const galleryImage=document.querySelector<HTMLImageElement>('#gallery-image');
const galleryStatus=document.querySelector<HTMLElement>('#gallery-status');
let galleryItems:HTMLAnchorElement[]=[];
let galleryIndex=0;
const galleryStage=document.querySelector<HTMLElement>('.gallery-stage');
let galleryTransition:Animation|null=null;
function finishGalleryTransition(){
 galleryTransition?.cancel();galleryTransition=null;
 galleryStage?.querySelector('[data-outgoing-photo]')?.remove();
}
async function showGalleryPhoto(index:number){
 if(!galleryItems.length||!galleryImage||!gallery||!galleryStage)return;
 galleryIndex=(index+galleryItems.length)%galleryItems.length;
 const targetIndex=galleryIndex;
 const link=galleryItems[targetIndex],im=link.querySelector('img');if(!im)return;
 const request=++galleryRequest;
 if(!gallery.open){
  finishGalleryTransition();galleryImage.hidden=true;
  document.querySelector('#gallery-caption')!.textContent='';
  document.querySelector('#gallery-count')!.textContent='';
  document.querySelector<HTMLAnchorElement>('#gallery-original')!.href=link.href;
  gallery.showModal();
 }
 galleryStage.setAttribute('aria-busy','true');
 galleryStatus!.textContent='Carregando fotografia…';
 // Decode offscreen: the displayed photograph is never replaced by a loading frame.
 const incoming=new Image();incoming.decoding='async';incoming.src=link.href;
 try{
  await incoming.decode();
  if(request!==galleryRequest||!gallery.open)return;
  finishGalleryTransition();
  const outgoing=galleryImage.hidden?null:galleryImage.cloneNode(true) as HTMLImageElement;
  if(outgoing){outgoing.removeAttribute('id');outgoing.alt='';outgoing.setAttribute('aria-hidden','true');outgoing.dataset.outgoingPhoto='';galleryStage.prepend(outgoing);}
  galleryImage.src=incoming.src;galleryImage.alt=im.alt;galleryImage.hidden=false;
  document.querySelector('#gallery-caption')!.textContent=im.alt;
  document.querySelector('#gallery-count')!.textContent=`${targetIndex+1} / ${galleryItems.length}`;
  document.querySelector<HTMLAnchorElement>('#gallery-original')!.href=link.href;
  galleryStatus!.textContent='';galleryStage.setAttribute('aria-busy','false');
  if(reducedMotion.matches){outgoing?.remove();return;}
  const animation=galleryImage.animate([{opacity:0},{opacity:1}],{
   duration:outgoing?420:300,easing:'cubic-bezier(.2,.6,.3,1)'
  });
  const fadeOut=outgoing?.animate([{opacity:1},{opacity:0}],{
   duration:420,easing:'cubic-bezier(.2,.6,.3,1)',fill:'forwards'
  });
  if(fadeOut)motionAnimations.add(fadeOut);
  galleryTransition=animation;motionAnimations.add(animation);
  void animation.finished.catch(()=>{}).then(()=>{
   outgoing?.remove();motionAnimations.delete(animation);
   if(fadeOut){fadeOut.cancel();motionAnimations.delete(fadeOut);}
   if(galleryTransition===animation)galleryTransition=null;
  });
 }catch{
  if(request!==galleryRequest)return;
  galleryStage.setAttribute('aria-busy','false');
  galleryStatus!.textContent='Não foi possível carregar esta foto. Escolha outra ou use o link abaixo para abrir o arquivo.';
  document.querySelector<HTMLAnchorElement>('#gallery-original')!.href=link.href;
 }
}
document.querySelectorAll<HTMLAnchorElement>('[data-gallery]').forEach(link=>link.addEventListener('click',event=>{
 if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0||!gallery)return;
 event.preventDefault();galleryTrigger=link;
 galleryItems=Array.from((link.closest('.gallery-grid')??document).querySelectorAll<HTMLAnchorElement>('[data-gallery]'));
 void showGalleryPhoto(galleryItems.indexOf(link));
}));
document.querySelector('[data-gallery-prev]')?.addEventListener('click',()=>void showGalleryPhoto(galleryIndex-1));
document.querySelector('[data-gallery-next]')?.addEventListener('click',()=>void showGalleryPhoto(galleryIndex+1));
gallery?.addEventListener('keydown',event=>{
 if(event.altKey||event.ctrlKey||event.metaKey)return;
 if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();void showGalleryPhoto(galleryIndex+(event.key==='ArrowLeft'?-1:1));}
});
document.querySelector('[data-close-gallery]')?.addEventListener('click',()=>gallery?.close());
gallery?.addEventListener('close',()=>{galleryRequest++;finishGalleryTransition();galleryStage?.setAttribute('aria-busy','false');galleryTrigger?.focus();});
gallery?.addEventListener('click',e=>{if(e.target===gallery)gallery.close();});
document.querySelectorAll<HTMLButtonElement>('[data-map]').forEach(button=>button.addEventListener('click',()=>{
 const host=document.querySelector<HTMLElement>('#map-slot');if(!host)return;
 const frame=document.createElement('iframe');frame.title=button.dataset.title||'Localização do Rodeio';frame.src=button.dataset.map!;frame.referrerPolicy='no-referrer-when-downgrade';frame.width='1200';frame.height='400';
 host.replaceChildren(frame);button.hidden=true;frame.focus();
}));

// Keep keyboard focus within open dialogs, including the browser-chrome boundary.
document.querySelectorAll<HTMLDialogElement>('dialog').forEach(dialog=>dialog.addEventListener('keydown',event=>{
 if(event.key!=='Tab')return;
 const items=Array.from(dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex="0"]')).filter(el=>el.getClientRects().length>0);
 const first=items[0],last=items.at(-1);if(!first||!last)return;
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
}));

// Hospitality rhythm: enter once, then remain still. Content is never CSS-hidden.
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const motionAnimations=new Set<Animation>();
function serve(element:Element,delay=0){
 if(reducedMotion.matches)return;
 const animation=element.animate([
  {opacity:0,transform:'translateY(18px)'},
  {opacity:1,transform:'translateY(0)'}
 ],{duration:720,delay,easing:'cubic-bezier(.22,.7,.2,1)',fill:'backwards'});
 motionAnimations.add(animation);
 animation.finished.then(()=>motionAnimations.delete(animation)).catch(()=>motionAnimations.delete(animation));
}
// Home enters with its first CSS paint; never hide it again when this module arrives.
const entrance=document.querySelectorAll('.hero:not(.hero-home) .hero-copy > :not(.hero-note), .not-found > *');
entrance.forEach((element,index)=>serve(element,Math.min(index*85,340)));
// Frames remain anchored; each photograph reveals within its own bounds.
const chapters=document.querySelectorAll('main > section:not(.hero) h2, .timeline-item > :not(h2), .event-detail > *, .footer-top > div > *, .house-info > *');
const media=document.querySelectorAll<HTMLImageElement>('main [data-photo-entrance]');
type PhotoMotionState={armed:boolean;prepared:boolean;request:number;animation?:Animation};
const photoMotion=new WeakMap<HTMLImageElement,PhotoMotionState>();
function preparePhoto(element:HTMLImageElement,state:PhotoMotionState){
 state.request++;state.animation?.cancel();
 state.armed=true;state.prepared=!reducedMotion.matches;
 element.style.transform=state.prepared?(element.closest('.gallery-grid')?'scale(1.035)':'scale(1.065)'):'';
}
async function revealPhoto(element:HTMLImageElement,state:PhotoMotionState){
 const request=++state.request;
 // Do not animate an empty frame while a lazy-loaded image is decoding.
 try{await element.decode();}catch{return;}
 if(reducedMotion.matches||!element.isConnected||request!==state.request||!state.prepared)return;
 const rect=element.getBoundingClientRect();
 if(rect.bottom<=0||rect.top>=innerHeight)return;
 const inGallery=!!element.closest('.gallery-grid');
 // The frame stays filled: a gentle camera pull-back, with no cutout or blank edges.
 const animation=element.animate([
  {transform:inGallery?'scale(1.035)':'scale(1.065)'},
  {transform:'scale(1)'}
 ],{
  duration:inGallery?1100:1600,
  easing:'cubic-bezier(.2,.65,.25,1)',fill:'backwards'
 });
 state.prepared=false;
 element.style.transform='';
 state.animation=animation;
 motionAnimations.add(animation);
 void animation.finished.catch(()=>{}).then(()=>{
  motionAnimations.delete(animation);
  if(state.animation===animation)state.animation=undefined;
 });
}
const observer=new IntersectionObserver(entries=>{
 entries.filter(entry=>entry.isIntersecting).forEach((entry,index)=>{
  observer.unobserve(entry.target);
  serve(entry.target,Math.min(index*75,225));
 });
},{threshold:0.08});
chapters.forEach(element=>{if(!element.querySelector('[data-photo-entrance]'))observer.observe(element);});
// Observe the stationary frame, not the scaled image. Re-arm only after full exit;
// the 8% entry threshold prevents tiny direction changes from restarting the effect.
const photoObserver=new IntersectionObserver(entries=>{
 entries.forEach(entry=>{
  const element=entry.target.querySelector<HTMLImageElement>('[data-photo-entrance]');
  if(!element)return;
  const state=photoMotion.get(element)!;
  if(!entry.isIntersecting){
   preparePhoto(element,state);
  }else if(entry.intersectionRatio>=0.08&&state.armed){
   state.armed=false;
   void revealPhoto(element,state);
  }
 });
},{threshold:[0,0.08]});
media.forEach(element=>{
 const state:PhotoMotionState={armed:true,prepared:false,request:0};
 photoMotion.set(element,state);
 const rect=element.getBoundingClientRect();
 if(rect.bottom<=0||rect.top>=innerHeight)preparePhoto(element,state);
 photoObserver.observe(element.closest('.photo-viewport')!);
});
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){
 motionAnimations.forEach(animation=>animation.cancel());
 media.forEach(element=>{const state=photoMotion.get(element)!;state.request++;state.prepared=false;element.style.transform='';});
}});

window.addEventListener('pagehide',()=>{media.forEach(element=>{photoMotion.get(element)!.request++;});motionAnimations.forEach(animation=>animation.cancel());});
// Restoring a page from the back/forward cache must never replay hidden entrances.
window.addEventListener('pageshow',event=>{if(event.persisted){motionAnimations.forEach(animation=>animation.cancel());menu?.close();gallery?.close();}});
