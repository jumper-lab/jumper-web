export {};
const menu=document.querySelector<HTMLDialogElement>('#navigation-dialog');
const menuOpener=document.querySelector<HTMLButtonElement>('[data-open-menu]');
const viewportMeta=document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
const themeMeta=document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
let menuViewportContent:string|null=null;
let menuThemeContent:string|null=null;
let menuPageScroll={x:0,y:0};
function closeMenu(){menu?.close();}
menuOpener?.addEventListener('click',()=>{
 if(!menu||menu.open)return;
 menuPageScroll={x:window.scrollX,y:window.scrollY};
 menuViewportContent=viewportMeta?.getAttribute('content')??null;
 menuThemeContent=themeMeta?.getAttribute('content')??null;
 // Let only the open menu extend beneath mobile browser controls and the notch.
 if(viewportMeta)viewportMeta.content=(menuViewportContent||'width=device-width, initial-scale=1').replace(/(?:^|,)\s*viewport-fit\s*=\s*[^,]+/gi,'')+', viewport-fit=cover';
 if(themeMeta)themeMeta.content=getComputedStyle(menu).backgroundColor;
 menu.showModal();menuOpener.setAttribute('aria-expanded','true');
});
document.querySelector('[data-close-menu]')?.addEventListener('click',closeMenu);
function clickedBackdrop(event:MouseEvent,dialog:HTMLDialogElement){
 if(event.target!==dialog)return false;
 const rect=dialog.getBoundingClientRect();
 return event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom;
}
menu?.addEventListener('click',event=>{if(clickedBackdrop(event,menu))closeMenu();});
menu?.addEventListener('close',()=>{
 if(viewportMeta&&menuViewportContent!==null)viewportMeta.content=menuViewportContent;
 if(themeMeta&&menuThemeContent!==null)themeMeta.content=menuThemeContent;
 menuOpener?.setAttribute('aria-expanded','false');
 window.scrollTo({left:menuPageScroll.x,top:menuPageScroll.y,behavior:'instant'});
 if(!document.querySelector('.digital-menu-dialog[open]'))menuOpener?.focus({preventScroll:true});
});
menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.close()));
const gallery=document.querySelector<HTMLDialogElement>('#gallery-dialog');
let galleryTrigger:HTMLElement|null=null;
let galleryRequest=0;
const galleryImage=document.querySelector<HTMLImageElement>('#gallery-image');
const galleryStatus=document.querySelector<HTMLElement>('#gallery-status');
let galleryItems:HTMLAnchorElement[]=[];
let galleryIndex=0;
const galleryStage=document.querySelector<HTMLElement>('.gallery-stage');
let photoZoom=1,photoPan={x:0,y:0};
let photoGesture:{distance:number;zoom:number;center:{x:number;y:number};pan:{x:number;y:number}}|null=null;
function applyPhotoZoom(){
 if(!galleryImage||!galleryStage)return;
 const fit=Math.min(galleryStage.clientWidth/(galleryImage.naturalWidth||1),galleryStage.clientHeight/(galleryImage.naturalHeight||1));
 const limitX=Math.max(0,((galleryImage.naturalWidth||1)*fit*photoZoom-galleryStage.clientWidth)/2);
 const limitY=Math.max(0,((galleryImage.naturalHeight||1)*fit*photoZoom-galleryStage.clientHeight)/2);
 photoPan.x=Math.max(-limitX,Math.min(limitX,photoPan.x));
 photoPan.y=Math.max(-limitY,Math.min(limitY,photoPan.y));
 galleryImage.style.transform=`translate(${photoPan.x}px,${photoPan.y}px) scale(${photoZoom})`;
 galleryStage.dataset.zoom=photoZoom.toFixed(2);
}
function resetPhotoZoom(){photoZoom=1;photoPan={x:0,y:0};photoGesture=null;applyPhotoZoom();}
function touchGeometry(touches:TouchList){
 const first=touches[0],second=touches[1]||first;
 const rect=galleryStage!.getBoundingClientRect();
 return {distance:Math.max(1,Math.hypot(second.clientX-first.clientX,second.clientY-first.clientY)),center:{x:(first.clientX+second.clientX)/2-rect.left-rect.width/2,y:(first.clientY+second.clientY)/2-rect.top-rect.height/2}};
}
function beginPhotoGesture(touches:TouchList){
 if(!touches.length||!galleryImage||galleryImage.hidden){photoGesture=null;return;}
 const geometry=touchGeometry(touches);
 photoGesture={...geometry,zoom:photoZoom,pan:{...photoPan}};
}
galleryStage?.addEventListener('touchstart',event=>{
 beginPhotoGesture(event.touches);
 if(event.touches.length>1||photoZoom>1)event.preventDefault();
},{passive:false});
galleryStage?.addEventListener('touchmove',event=>{
 if(!photoGesture||!event.touches.length)return;
 if(event.touches.length<2&&photoZoom===1)return;
 event.preventDefault();
 const geometry=touchGeometry(event.touches);
 photoZoom=event.touches.length>1?Math.max(1,Math.min(4,photoGesture.zoom*geometry.distance/photoGesture.distance)):photoGesture.zoom;
 const ratio=photoZoom/photoGesture.zoom;
 photoPan={x:geometry.center.x-(photoGesture.center.x-photoGesture.pan.x)*ratio,y:geometry.center.y-(photoGesture.center.y-photoGesture.pan.y)*ratio};
 applyPhotoZoom();
},{passive:false});
galleryStage?.addEventListener('touchend',event=>beginPhotoGesture(event.touches),{passive:true});
galleryStage?.addEventListener('touchcancel',()=>{photoGesture=null;},{passive:true});
window.addEventListener('resize',()=>{photoGesture=null;applyPhotoZoom();});

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
  document.querySelector('#gallery-count')!.textContent='';
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
  galleryImage.src=incoming.src;galleryImage.alt=im.alt;galleryImage.hidden=false;resetPhotoZoom();
  document.querySelector('#gallery-count')!.textContent=`${targetIndex+1} / ${galleryItems.length}`;
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
  galleryStatus!.textContent='Não foi possível carregar esta foto. Escolha outra fotografia.';
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
gallery?.addEventListener('close',()=>{galleryRequest++;finishGalleryTransition();resetPhotoZoom();galleryStage?.setAttribute('aria-busy','false');galleryTrigger?.focus();});
gallery?.addEventListener('click',event=>{if(clickedBackdrop(event,gallery))gallery.close();});
document.querySelectorAll<HTMLButtonElement>('[data-map]').forEach(button=>button.addEventListener('click',()=>{
 const host=document.querySelector<HTMLElement>('#map-slot');if(!host)return;
 const frame=document.createElement('iframe');frame.title=button.dataset.title||'Localização do Rodeio';frame.src=button.dataset.map!;frame.referrerPolicy='no-referrer-when-downgrade';frame.width='1200';frame.height='400';
 host.replaceChildren(frame);button.hidden=true;frame.focus();
}));

// Keep keyboard focus within open dialogs, including the browser-chrome boundary.
document.querySelectorAll<HTMLDialogElement>('dialog:not(.digital-menu-dialog)').forEach(dialog=>dialog.addEventListener('keydown',event=>{
 if(event.key!=='Tab')return;
 const items=Array.from(dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex="0"]')).filter(el=>el.getClientRects().length>0);
 const first=items[0],last=items.at(-1);if(!first||!last)return;
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
}));

// Hospitality rhythm: enter once, then remain still. Content is never CSS-hidden.
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const motionAnimations=new Set<Animation>();
function serve(element:Element,delay=0,duration=700,distance=24){
 const host=element as HTMLElement;
 host.dataset.motionState='running';
 if(reducedMotion.matches){host.dataset.motionState='complete';return;}
 const heading=element.matches('h1,h2,h3');
 const animation=element.animate([
  {opacity:0,transform:`translateY(${heading?32:distance}px)`,...(heading?{clipPath:'inset(70% -4% 0 -4%)'}:{})},
  {opacity:1,transform:'translateY(0)',...(heading?{clipPath:'inset(0 -4% 0 -4%)'}:{})}
 ],{duration:heading?800:duration,delay,easing:'cubic-bezier(.22,.7,.2,1)',fill:'backwards'});
 motionAnimations.add(animation);
 void animation.finished.catch(()=>{}).then(()=>{motionAnimations.delete(animation);host.dataset.motionState='complete';});
}
// Home enters with its first CSS paint; never hide it again when this module arrives.
const entrance=document.querySelectorAll('.hero:not(.hero-home) .hero-copy > :not(.hero-note), .not-found > *');
entrance.forEach((element,index)=>serve(element,Math.min(index*45,135)));
// Frames remain anchored; each photograph reveals within its own bounds.
const chapters=document.querySelectorAll('main :is(h1,h2,h3,p,address,figcaption,.action,.archive-date,.timeline-date,.events-form label,.reservation-house,.reservation-assistance,.workspace-help,.workspace-back), .site-footer :is(.footer-navigation,.footer-signoff,.footer-unit,.footer-contact,.footer-bottom)');
const media=Array.from(document.querySelectorAll<HTMLImageElement>('main [data-photo-entrance]')).filter(element=>!element.closest('.hero'));
type PhotoMotionState={armed:boolean;prepared:boolean;request:number;animation?:Animation};
const photoMotion=new WeakMap<HTMLImageElement,PhotoMotionState>();
function preparePhoto(element:HTMLImageElement,state:PhotoMotionState){
 state.request++;state.animation?.cancel();
 state.armed=true;state.prepared=!reducedMotion.matches;
 element.style.transform=state.prepared?(element.closest('.gallery-grid')?'scale(1.015)':'scale(1.025)'):'';
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
  {opacity:.2,clipPath:'inset(10% 0 10% 0)',transform:inGallery?'scale(1.025)':'scale(1.04)'},
  {opacity:1,clipPath:'inset(0 0 0 0)',transform:'scale(1)'}
 ],{
  duration:inGallery?600:800,
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
  serve(entry.target,Math.min(index*40,120));
 });
},{threshold:0.08});
chapters.forEach(element=>{
 // Specialized heroes, carousels and dialogs own their choreography.
 if(element.closest('.hero,.launch,dialog,[data-cuisine-gallery],[aria-hidden="true"]'))return;
 // Enter grouped cards/forms once, without animating their children twice.
 if(element.parentElement?.closest('.reservation-house,.reservation-assistance,.footer-signoff,.footer-unit,.footer-contact,.events-form label'))return;
 if(element.matches('[role="status"]')||element.hasAttribute('hidden'))return;
 observer.observe(element);
});
// Start nearby image transfers before the visitor reaches their entrance.
const nearbyPhotos=new IntersectionObserver(entries=>{
 entries.filter(entry=>entry.isIntersecting).forEach(entry=>{
  const image=entry.target as HTMLImageElement;
  image.loading='eager';
  image.fetchPriority=entry.boundingClientRect.top<innerHeight?'high':'low';
  nearbyPhotos.unobserve(image);
 });
},{rootMargin:'700px 0px',threshold:0});
document.querySelectorAll<HTMLImageElement>('main img[loading="lazy"]:not([data-cuisine-rail] img):not(.hero-slide img)').forEach(image=>nearbyPhotos.observe(image));
// The same discreet rhythm covers headers and every local dialog type.
document.querySelectorAll('.site-header:not(.header-home) :is(.header-brand,.desktop-nav,.header-location,.menu-toggle)').forEach((element,index)=>serve(element,Math.min(index*35,105),420,8));
const dialogMotionObserver=new MutationObserver(records=>{
 for(const record of records){
  const dialog=record.target as HTMLDialogElement;
  if(!dialog.open)continue;
  const children=Array.from(dialog.querySelectorAll<HTMLElement>(':scope > *, .digital-menu-header > *, .digital-menu-footer > a, .navigation-dialog a'))
   .filter(element=>!element.hidden&&!element.matches('style,script')&&!(element.matches('.digital-menu-header,.digital-menu-footer')));
  children.forEach((element,index)=>{
   if(element.parentElement?.closest('.navigation-dialog a'))return;
   if(element.matches('#navigation-dialog nav')||element.closest('.menu-contact')&&!element.matches('.menu-contact'))return;
   serve(element,Math.min(index*50,150),450,12);
  });
 }
});
document.querySelectorAll('dialog').forEach(dialog=>dialogMotionObserver.observe(dialog,{attributes:true,attributeFilter:['open']}));
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
 preparePhoto(element,state);
 photoObserver.observe(element.closest('.photo-viewport')!);
});
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches){
 motionAnimations.forEach(animation=>animation.cancel());
 media.forEach(element=>{const state=photoMotion.get(element)!;state.request++;state.prepared=false;element.style.transform='';});
}});

window.addEventListener('pagehide',()=>{dialogMotionObserver.disconnect();media.forEach(element=>{photoMotion.get(element)!.request++;});motionAnimations.forEach(animation=>animation.cancel());});
// History restoration replays the internal page's choreography. The carousel
// keeps its own once-per-document entrance and is deliberately excluded above.
window.addEventListener('pageshow',event=>{
 if(!event.persisted)return;
 motionAnimations.forEach(animation=>animation.cancel());menu?.close();gallery?.close();
 document.querySelectorAll('dialog').forEach(dialog=>dialogMotionObserver.observe(dialog,{attributes:true,attributeFilter:['open']}));
 let index=0;
 chapters.forEach(element=>{
  if(element.closest('.hero,.launch,dialog,[data-cuisine-gallery],[aria-hidden="true"]'))return;
  if(element.parentElement?.closest('.reservation-house,.reservation-assistance,.footer-signoff,.footer-unit,.footer-contact,.events-form label'))return;
  const rect=element.getBoundingClientRect();
  if(rect.height&&rect.bottom>0&&rect.top<innerHeight)serve(element,Math.min(index++*70,210));
  else observer.observe(element);
 });
 media.forEach(element=>{
  const state=photoMotion.get(element)!;preparePhoto(element,state);
  const rect=element.getBoundingClientRect();
  if(rect.bottom>0&&rect.top<innerHeight){state.armed=false;void revealPhoto(element,state);}
 });
});
