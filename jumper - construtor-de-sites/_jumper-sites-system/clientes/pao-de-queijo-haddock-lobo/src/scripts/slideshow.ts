/** Decoded incoming photo over an opaque, optically stable outgoing photo. */
export function initSlideshow() {
  const hero=document.querySelector<HTMLElement>('[data-slideshow]');
  if(!hero||hero.dataset.slideshowReady) return;
  const slides=[...hero.querySelectorAll<HTMLElement>('[data-scene]')];
  const selectors=[...hero.querySelectorAll<HTMLButtonElement>('[data-scene-select]')];
  const controls=hero.querySelector<HTMLElement>('[data-hero-controls]')!;
  const pause=hero.querySelector<HTMLButtonElement>('[data-slideshow-pause]')!;
  const zoom=hero.querySelector<HTMLButtonElement>('[data-zoom-src]')!;
  const preference=matchMedia('(prefers-reduced-motion:reduce)');
  const period=7600;
  let active=0,remaining=period,started=0,timer=0,request=0;
  let userPaused=false,inView=true,hovered=false,focused=false,explicitPlay=false,suspended=false;
  let progress:Animation|null=null,transition:Promise<void>|null=null,finishTransition:(()=>void)|null=null;
  const optics=new Map<number,Animation>();
  const loading=new Map<number,Promise<boolean>>();
  const loaded=(index:number):Promise<boolean> => {
    const image=slides[index].querySelector<HTMLImageElement>('img')!;
    if(image.complete && image.naturalWidth) return Promise.resolve(true);
    if(loading.has(index)) return loading.get(index)!;
    if(image.dataset.src) {
      if(image.dataset.srcset) image.srcset=image.dataset.srcset;
      image.src=image.dataset.src;
    }
    const job=image.decode().then(()=>image.naturalWidth>0).catch(()=>false);
    loading.set(index,job);
    job.then(ok=>{if(!ok) loading.delete(index);});
    return job;
  };
  const canPlay=()=>!userPaused&&!preference.matches&&!document.hidden&&!suspended&&inView&&(explicitPlay||(!hovered&&!focused))&&!document.querySelector('dialog[open]');
  function stopClock() {
    if(!timer) return;
    clearTimeout(timer);timer=0;remaining=Math.max(0,remaining-(performance.now()-started));
  }
  function startOptic(index:number) {
    if(preference.matches||optics.has(index)) return;
    const animation=slides[index].querySelector('img')!.animate([
      {transform:'scale(1.025) translateX(.35%)'},
      {transform:'scale(1.075) translateX(-.35%)'}
    ],{duration:11500,fill:'both',easing:'linear'});
    animation.pause();optics.set(index,animation);
  }
  function resetProgress() {
    stopClock();progress?.cancel();remaining=period;
    const fill=selectors[active].querySelector<HTMLElement>('.scene-timer>span')!;
    progress=fill.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:period,fill:'forwards',easing:'linear'});
    progress.pause();
  }
  function sync() {
    stopClock();
    const playing=canPlay();
    hero!.dataset.playback=playing?'playing':'paused';
    pause.disabled=preference.matches;
    pause.setAttribute('aria-pressed',String(userPaused||preference.matches));
    pause.setAttribute('aria-label',preference.matches?'Slideshow automático desativado: movimento reduzido':userPaused?'Retomar slideshow':'Pausar slideshow');
    optics.forEach(animation=>{
      if(playing&&animation.playState==='paused')animation.play();
      else if(!playing&&animation.playState==='running')animation.pause();
    });
    if(playing) {
      started=performance.now();progress?.play();
      timer=window.setTimeout(()=>{timer=0;remaining=0;void select((active+1)%slides.length,false);},remaining);
    } else progress?.pause();
  }
  function dissolve(previous:number,index:number) {
    slides[previous].classList.add('is-leaving');
    slides[previous].classList.remove('is-active','is-settled');
    // Commit a hidden starting frame before promoting the decoded incoming image.
    slides[index].classList.remove('is-settled');
    void slides[index].offsetWidth;
    slides[index].classList.add('is-active');
    transition=new Promise(resolve=>{
      let fallback=0;
      const finish=()=>{
        clearTimeout(fallback);slides[index].removeEventListener('transitionend',onEnd);
        slides[previous].classList.remove('is-leaving');
        slides[index].classList.add('is-settled');
        optics.get(previous)?.cancel();optics.delete(previous);
        finishTransition=null;transition=null;resolve();
      };
      const onEnd=(event:TransitionEvent)=>{if(event.target===slides[index]&&event.propertyName==='opacity')finish();};
      finishTransition=finish;
      slides[index].addEventListener('transitionend',onEnd);
      fallback=window.setTimeout(finish,preference.matches?0:1700);
    });
  }
  async function select(index:number,manual:boolean) {
    const token=++request;
    if(manual) {userPaused=true;explicitPlay=false;sync();}
    if(index===active) return;
    const [ready]=await Promise.all([loaded(index),transition]);
    if(token!==request||suspended) return;
    if(!ready||(!manual&&!canPlay())) {resetProgress();sync();return;}
    const previous=active;startOptic(index);dissolve(previous,index);active=index;
    slides.forEach((slide,i)=>slide.setAttribute('aria-hidden',String(i!==index)));
    selectors.forEach((button,i)=>{button.classList.toggle('is-selected',i===index);button.setAttribute('aria-pressed',String(i===index));});
    const label=selectors[index].dataset.sceneLabel!;
    hero!.querySelector('[data-scene-number]')!.textContent=String(index+1).padStart(2,'0');
    hero!.querySelector('[data-scene-caption]')!.textContent=label;
    const image=slides[index].querySelector<HTMLImageElement>('img')!;
    zoom.dataset.zoomSrc=slides[index].dataset.sceneFull;
    zoom.dataset.zoomAlt=image.alt;zoom.dataset.zoomCaption=label;
    zoom.setAttribute('aria-label',`Ampliar fotografia: ${label}`);
    if(manual) hero!.querySelector('[data-slideshow-status]')!.textContent=`Fotografia ${index+1} de ${slides.length}: ${label}. Reprodução pausada.`;
    resetProgress();sync();
    // Load just one scene ahead, never all three on the first visit.
    if(!document.hidden&&!preference.matches) window.setTimeout(()=>{if(!suspended)void loaded((index+1)%slides.length);},1800);
  }
  selectors.forEach((button,index)=>button.addEventListener('click',()=>void select(index,true)));
  pause.addEventListener('click',()=>{userPaused=!userPaused;explicitPlay=!userPaused;sync();});
  controls.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovered=true;sync();}});
  controls.addEventListener('pointerover',event=>{
    if(event.pointerType==='mouse'&&(event.target as Element).closest('button')!==pause){explicitPlay=false;sync();}
  });
  controls.addEventListener('pointerleave',()=>{hovered=false;sync();});
  controls.addEventListener('focusin',event=>{focused=true;if(event.target!==pause)explicitPlay=false;sync();});
  controls.addEventListener('focusout',()=>{queueMicrotask(()=>{focused=controls.contains(document.activeElement);sync();});});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)finishTransition?.();sync();});
  window.addEventListener('pagehide',()=>{suspended=true;++request;finishTransition?.();sync();});
  window.addEventListener('pageshow',()=>{
    suspended=false;const rect=hero!.getBoundingClientRect();
    inView=Math.max(0,Math.min(innerHeight,rect.bottom)-Math.max(0,rect.top))/rect.height>=.18;
    sync();
  });
  preference.addEventListener('change',()=>{
    finishTransition?.();
    if(preference.matches){optics.forEach(animation=>animation.cancel());optics.clear();}
    else startOptic(active);
    sync();
  });
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting&&entries[0].intersectionRatio>=.18;sync();},{threshold:[0,.18]}).observe(hero);
  document.querySelectorAll('dialog').forEach(dialog=>new MutationObserver(sync).observe(dialog,{attributes:true,attributeFilter:['open']}));
  hero.dataset.slideshowReady='true';
  slides[0].classList.add('is-settled');startOptic(0);resetProgress();sync();
  // First scene remains the only initial image request and LCP candidate.
  void loaded(0).then(()=>window.setTimeout(()=>{if(inView&&!suspended&&!document.hidden&&!preference.matches) void loaded(1);},2600));
}
