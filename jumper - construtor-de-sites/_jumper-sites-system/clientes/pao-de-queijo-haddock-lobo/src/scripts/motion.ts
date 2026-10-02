export function initMotion() {
  const preference=matchMedia('(prefers-reduced-motion:reduce)');
  const header=document.querySelector<HTMLElement>('.site-header');
  const hero=document.querySelector<HTMLElement>('.immersive-hero');
  let previous=scrollY,direction='up',frame=0;
  function followScroll() {
    frame=0;
    if(!hero||!header) return;
    const y=scrollY,delta=y-previous;
    if(Math.abs(delta)>2) direction=delta>0?'down':'up';
    previous=y;
    const over=hero.getBoundingClientRect().bottom>header.offsetHeight;
    header.classList.toggle('is-over-hero',over);
    const opacity=y<24||direction==='up'?1:over?Math.max(.16,1-y/(hero.offsetHeight*.48)):0;
    header.style.setProperty('--header-opacity',String(opacity));
    header.classList.toggle('is-away',!over&&opacity===0);
    if(hero.classList.contains('immersive-hero')&&!preference.matches&&innerWidth>700&&matchMedia('(pointer:fine)').matches) hero.style.setProperty('--hero-drift',`${Math.min(hero.offsetHeight,y)*.022}px`);
    else hero.style.removeProperty('--hero-drift');
  }
  window.addEventListener('scroll',()=>{if(!frame) frame=requestAnimationFrame(followScroll);},{passive:true});
  window.addEventListener('resize',followScroll,{passive:true});
  // BFCache restores scroll independently of a new document load.
  window.addEventListener('pageshow',followScroll);
  preference.addEventListener('change',()=>{
    followScroll();
    if(preference.matches) document.querySelectorAll('.type-reveal,.photo-unfold').forEach(element=>element.classList.add('is-revealed'));
  });
  followScroll();
  document.querySelectorAll<HTMLElement>('.button').forEach(button=>{
    let returning=0;
    const clearReturn=()=>{clearTimeout(returning);button.classList.remove('is-ink-returning');};
    const origin=(x:number,y:number)=>{
      const rect=button.getBoundingClientRect();
      x=Math.max(0,Math.min(rect.width,x));y=Math.max(0,Math.min(rect.height,y));
      const radius=Math.hypot(Math.max(x,rect.width-x),Math.max(y,rect.height-y))+2;
      button.style.setProperty('--ink-x',`${x}px`);button.style.setProperty('--ink-y',`${y}px`);
      button.style.setProperty('--ink-size',`${radius*2}px`);
    };
    const leave=()=>{
      if(button.matches(':hover,:focus-visible')) return;
      clearReturn();
      if(preference.matches) return;
      // Keep a contrasting base while the red ink retracts, then restore paper.
      button.classList.add('is-ink-returning');returning=window.setTimeout(clearReturn,650);
    };
    button.addEventListener('pointerenter',event=>{
      clearReturn();const rect=button.getBoundingClientRect();origin(event.clientX-rect.left,event.clientY-rect.top);
    });
    button.addEventListener('pointerleave',leave);
    button.addEventListener('focusin',()=>{
      clearReturn();if(button.matches(':focus-visible')){const rect=button.getBoundingClientRect();origin(rect.width/2,rect.height/2);}
    });
    button.addEventListener('focusout',()=>queueMicrotask(leave));
    window.addEventListener('pagehide',clearReturn);
    preference.addEventListener('change',()=>{if(preference.matches)clearReturn();});
  });
  if(preference.matches||!('IntersectionObserver' in window)) return;
  const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting) return;
    entry.target.classList.add('is-revealed');
    reveal.unobserve(entry.target);
  }),{rootMargin:'0px 0px -6% 0px',threshold:.08});
  document.querySelectorAll<HTMLElement>('h2,.page-hero h1,.footer-display').forEach(heading=>{
    // Never hide an already-painted heading when the module loads late.
    const visible=heading.getBoundingClientRect().top<innerHeight;
    // Preserve the original line breaks and a single, intact accessible heading.
    const original=heading.innerHTML;
    const lines=original.split(/<br\s*\/?\s*>/i);
    const plain=document.createElement('span');plain.innerHTML=lines.join(' ');
    const label=plain.textContent!.trim().replace(/\s+/g,' ');
    if(/^H[1-6]$/.test(heading.tagName)) heading.setAttribute('aria-label',label);
    heading.innerHTML='';
    if(!/^H[1-6]$/.test(heading.tagName)) {
      const readable=document.createElement('span');readable.className='sr-only';readable.textContent=label;heading.append(readable);
    }
    lines.forEach((line,index)=>{
      const clip=document.createElement('span');clip.className='type-line-clip';clip.setAttribute('aria-hidden','true');
      const type=document.createElement('span');type.className='type-line';type.style.setProperty('--type-line',String(index));type.innerHTML=line;
      clip.append(type);heading.append(clip);
    });
    if(visible) heading.classList.add('is-revealed');
    heading.classList.add('type-reveal');reveal.observe(heading);
  });
  document.querySelectorAll<HTMLElement>('.photo-button,.story-intro-photo,.events-photo,.take-home-photo,.location-image,.page-hero-photo').forEach(container=>{
    const visible=container.getBoundingClientRect().top<innerHeight;
    // In a captioned figure, wrap the photograph alone, not the caption.
    let frame=container;
    if(container.classList.contains('story-intro-photo')) {
      const image=container.querySelector('img')!;
      frame=document.createElement('div');image.before(frame);frame.append(image);
    }
    frame.classList.add('photo-unfold');
    if(visible) {frame.classList.add('is-revealed');return;}
    for(let i=0;i<5;i++) {
      const strip=document.createElement('span');strip.className='photo-reveal-strip';strip.style.setProperty('--fold',String(i));strip.setAttribute('aria-hidden','true');frame.append(strip);
    }
    reveal.observe(frame);
    frame.addEventListener('focusin',()=>frame.classList.add('is-revealed'));
  });
}
