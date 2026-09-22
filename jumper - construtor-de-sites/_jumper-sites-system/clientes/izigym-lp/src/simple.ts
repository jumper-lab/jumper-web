const reducedMotion=matchMedia('(prefers-reduced-motion:reduce)');
const mobile=matchMedia('(max-width:767px)');
const nav=document.querySelector<HTMLElement>('#navigation')!;
const menu=document.querySelector<HTMLButtonElement>('.menu-toggle')!;
const setMenu=(open:boolean)=>{nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));nav.inert=mobile.matches&&!open;};
setMenu(false);menu.addEventListener('click',()=>setMenu(menu.getAttribute('aria-expanded')!=='true'));
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
mobile.addEventListener('change',()=>setMenu(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){setMenu(false);menu.focus();}});
document.addEventListener('click',e=>{if(!(e.target as Element).closest('.header'))setMenu(false);});
// Lightweight editorial motion: transforms and opacity only on mobile, richer masks on larger screens.
const editorial='cubic-bezier(.22,1,.36,1)';
const activeAnimations=new WeakMap<Element,Animation>();
const play=(el:Element,frames:Keyframe[],duration=760,delay=0)=>{
 if(reducedMotion.matches){el.classList.add('is-revealed');return;}
 activeAnimations.get(el)?.cancel();
 const html=el as HTMLElement;
 html.style.willChange='transform, opacity';
 const animation=el.animate(frames,{duration:mobile.matches?Math.min(duration,500):duration,delay:mobile.matches?Math.min(delay,120):delay,easing:editorial,fill:'both'});
 activeAnimations.set(el,animation);
 animation.finished.then(()=>{el.classList.add('is-revealed');animation.cancel();html.style.willChange='';activeAnimations.delete(el);}).catch(()=>{html.style.willChange='';});
};
const animate=(el:Element,delay=0)=>play(el,[{opacity:0,transform:'translate3d(0,28px,0) scale(.99)'},{opacity:1,transform:'translate3d(0,0,0) scale(1)'}],760,delay);
const reveal=(el:Element)=>{
 if(el.matches('.pillar-photo,.location-photo,.photo-rail figure')){
  const index=el.matches('.photo-rail figure')?[...el.parentElement!.children].indexOf(el):0;
  play(el,[{opacity:0,transform:`translate3d(${mobile.matches?22:0}px,${mobile.matches?0:30}px,0) scale(.985)`},{opacity:1,transform:'translate3d(0,0,0) scale(1)'}],mobile.matches?560:760,index*45);
  const image=el.querySelector('img');if(image)play(image,[{transform:'scale(1.055)'},{transform:'scale(1)'}],850,index*45);
  return;
 }
 if(el.matches('.section-kicker')){play(el,[{opacity:0,transform:'translate3d(0,16px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],620);return;}
 animate(el);
};
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){reveal(e.target);observer.unobserve(e.target);}}),{threshold:mobile.matches?.08:.14,rootMargin:'0px 0px -7% 0px'});
document.querySelectorAll('[data-enter],.section-kicker,.pillar-photo,.location-photo,.photo-rail figure,.intro-copy,.section-heading>p,.location-copy>p,.plan,.faq details,.footer-follow,.footer-links>*,.footer-brand').forEach(el=>{if(!el.closest('.hero')){el.classList.add('motion-target');observer.observe(el);}});
// Hero has its own load sequence so the offer reads in the same order as the sales argument.
requestAnimationFrame(()=>{
 play(document.querySelector('.hero-image')!,[{opacity:.68,transform:'scale(1.035)'},{opacity:1,transform:'scale(1)'}],1250,0);
 play(document.querySelector('.header')!,[{opacity:0,transform:'translate3d(0,-22px,0) scale(.985)'},{opacity:1,transform:'translate3d(0,0,0) scale(1)'}],760,40);
 if(!mobile.matches)document.querySelectorAll<HTMLElement>('.header nav a').forEach((link,i)=>play(link,[{opacity:0,transform:'translate3d(0,-12px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],540,130+i*65));
 const heroItems=[...document.querySelectorAll<HTMLElement>('.hero-story>*')];
 heroItems.forEach((el,i)=>play(el,[{transform:'translate3d(0,24px,0)'},{transform:'translate3d(0,0,0)'}],650,70+i*70));
 play(document.querySelector('.scroll-cue')!,[{opacity:0,transform:'scale(.7)'},{opacity:1,transform:'scale(1)'}],650,680);
});
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)document.getAnimations().forEach(a=>a.cancel());});
// Keep the navigation connected to the section currently crossing the reading line.
const navigationLinks=[...nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
const activateNavigation=(id:string)=>navigationLinks.forEach(link=>{const active=link.hash===`#${id}`;link.classList.toggle('is-active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
const sectionSpy=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)activateNavigation((entry.target as HTMLElement).id);}),{rootMargin:'-22% 0px -68% 0px',threshold:0});
navigationLinks.forEach(link=>{const section=document.querySelector<HTMLElement>(link.hash);if(section)sectionSpy.observe(section);});
// Bounded requestAnimationFrame work. Parallax runs only for visible media and stays off on mobile.
const heroSection=document.querySelector<HTMLElement>('.hero')!;
const movingPhotos=[...document.querySelectorAll<HTMLElement>('.manifesto>img,.location-photo>img')];
const activePhotos=new Set<HTMLElement>();
const mediaObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{const image=(entry.target as HTMLElement).querySelector<HTMLElement>('img')||(entry.target as HTMLElement);if(entry.isIntersecting)activePhotos.add(image);else{activePhotos.delete(image);image.style.transform='';image.style.willChange='';}}),{rootMargin:'15% 0px'});
movingPhotos.forEach(photo=>mediaObserver.observe(photo.parentElement!));
let frame=0;
const updateScroll=()=>{frame=0;if(reducedMotion.matches||mobile.matches){movingPhotos.forEach(el=>{el.style.transform='';el.style.willChange='';});return;}
 const heroRect=heroSection.getBoundingClientRect();
 activePhotos.forEach(img=>{const r=img.parentElement!.getBoundingClientRect();const progress=(innerHeight-r.top)/(innerHeight+r.height);img.style.willChange='transform';img.style.transform=`scale(1.06) translate3d(0,${(progress-.5)*5}%,0)`;});
};
const requestScroll=()=>{if(!frame)frame=requestAnimationFrame(updateScroll);};
window.addEventListener('scroll',requestScroll,{passive:true});window.addEventListener('resize',requestScroll,{passive:true});reducedMotion.addEventListener('change',requestScroll);requestScroll();
const tabs=[...document.querySelectorAll<HTMLButtonElement>('[role=tab]')];
const select=(index:number)=>{tabs.forEach((t,i)=>{const active=i===index;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById(t.getAttribute('aria-controls')!)!.hidden=!active;});const panel=document.getElementById(tabs[index].getAttribute('aria-controls')!)!;const photo=panel.querySelector('img')!;play(photo,[{opacity:0,transform:'scale(1.12)'},{opacity:1,transform:'scale(1)'}],850);animate(panel.querySelector('.pillar-caption')!);};
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(i));tab.addEventListener('keydown',e=>{let target=i;if(e.key==='ArrowRight')target=(i+1)%tabs.length;else if(e.key==='ArrowLeft')target=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')target=0;else if(e.key==='End')target=tabs.length-1;else return;e.preventDefault();select(target);tabs[target].focus();});});
const bar=document.querySelector<HTMLElement>('.mobile-cta')!;
new IntersectionObserver(([entry])=>{const show=!entry.isIntersecting&&entry.boundingClientRect.bottom<0;bar.classList.toggle('is-visible',show);bar.inert=!show;document.querySelector('.header')?.classList.toggle('scrolled',show);}).observe(document.querySelector('.hero')!);
const track=document.querySelector<HTMLElement>('.photo-rail')!;
const originalSlides=[...track.children] as HTMLElement[];
const slideCount=originalSlides.length;
const cloneSlide=(slide:HTMLElement)=>{const clone=slide.cloneNode(true) as HTMLElement;clone.dataset.clone='true';clone.setAttribute('aria-hidden','true');clone.classList.remove('motion-target');clone.classList.add('is-revealed');clone.style.opacity='1';clone.style.transform='none';clone.querySelectorAll<HTMLElement>('img').forEach(image=>{image.setAttribute('alt','');image.style.removeProperty('transform');image.style.removeProperty('opacity');});return clone;};
originalSlides.forEach(slide=>track.append(cloneSlide(slide)));
[...originalSlides].reverse().forEach(slide=>track.prepend(cloneSlide(slide)));
const railStatus=document.querySelector<HTMLElement>('[data-rail-status]')!;
let railFrame=0;
const railMetrics=()=>{const first=track.children[slideCount] as HTMLElement;const next=track.children[slideCount+1] as HTMLElement;const step=next.offsetLeft-first.offsetLeft;return{step,group:step*slideCount};};
const jumpRail=(left:number)=>{const behavior=track.style.scrollBehavior;track.style.scrollBehavior='auto';track.scrollLeft=left;track.style.scrollBehavior=behavior;};
const updateRail=()=>{railFrame=0;const{step,group}=railMetrics();if(!step)return;if(track.scrollLeft<group-step*.75)jumpRail(track.scrollLeft+group);else if(track.scrollLeft>group*2-step*.25)jumpRail(track.scrollLeft-group);const logical=Math.round((track.scrollLeft-group)/step);const current=((logical%slideCount)+slideCount)%slideCount+1;railStatus.textContent=`${String(current).padStart(2,'0')} / ${String(slideCount).padStart(2,'0')}`;};
track.addEventListener('scroll',()=>{if(!railFrame)railFrame=requestAnimationFrame(updateRail);},{passive:true});
const resetRail=()=>{const{group}=railMetrics();jumpRail(group);updateRail();};
requestAnimationFrame(resetRail);
window.addEventListener('resize',resetRail,{passive:true});
document.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)animate(d.querySelector('p')!);}));
const attribution=new URLSearchParams(location.search);
const campaignKeys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid'];
document.querySelectorAll<HTMLAnchorElement>('[data-cta]').forEach(a=>{const u=new URL(a.href);campaignKeys.forEach(k=>{const v=attribution.get(k);if(v)u.searchParams.set(k,v);});a.href=u.toString();});
const modal=document.querySelector<HTMLDialogElement>('#enrollment')!;
let opener:HTMLElement|null=null;let loaded=false;
document.querySelectorAll<HTMLElement>('[data-enroll]').forEach(button=>button.addEventListener('click',()=>{const w=window as Window & {dataLayer?:unknown[];fbq?:(action:string,event:string)=>void};w.dataLayer=w.dataLayer||[];w.fbq?.('track','InitiateCheckout');w.dataLayer.push({event:'enrollment_open',plan:button.dataset.enroll,...Object.fromEntries(campaignKeys.map(key=>[key,attribution.get(key)]))});opener=button;modal.showModal();modal.querySelector<HTMLButtonElement>('.close')?.focus();document.body.classList.add('modal-open');document.querySelector('#enrollment-title')!.textContent=`Sua matrícula · ${button.dataset.enroll}`;if(!loaded){const host=document.querySelector('#form-host')!;const widget=document.createElement('div');widget.setAttribute('data-yf-widget','DEXAqYo');widget.setAttribute('data-yf-transitive-search-params','utm_source,utm_medium,utm_campaign,utm_content,utm_term,gclid,fbclid');widget.style.cssText='width:100%;height:100%;';host.append(widget);const script=document.createElement('script');script.src='https://embed.yayforms.link/next/embed.js';script.async=true;document.body.append(script);const observer=new MutationObserver(()=>{const frame=host.querySelector('iframe');if(frame){frame.title='Formulário de matrícula IZI Gym';observer.disconnect();}});observer.observe(host,{childList:true,subtree:true});loaded=true;}}));
modal.addEventListener('cancel',event=>{event.preventDefault();modal.close();});
modal.querySelector('.close')!.addEventListener('click',()=>modal.close());modal.addEventListener('click',event=>{if(event.target===modal){const box=modal.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)modal.close();}});modal.addEventListener('close',()=>{document.body.classList.remove('modal-open');opener?.focus();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modal.open)modal.close();});
document.querySelectorAll<HTMLAnchorElement>('[data-cta]').forEach(a=>a.addEventListener('click',()=>{const w=window as Window & {dataLayer?:unknown[];fbq?:(action:string,event:string)=>void};w.dataLayer=w.dataLayer||[];w.fbq?.('track','Contact');const params=new URLSearchParams(location.search);w.dataLayer.push({event:'whatsapp_click',placement:a.dataset.cta,...Object.fromEntries(campaignKeys.map(key=>[key,params.get(key)]))});}));
