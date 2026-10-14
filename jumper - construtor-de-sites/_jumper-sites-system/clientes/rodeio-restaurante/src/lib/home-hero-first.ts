import manifest from '../../data/optimized-home-hero.json';
export function homeHeroFirst(base:string){
  const prefix=base.replace(/\/$/,'');
  const variant=(role:keyof typeof manifest.variants)=>({
    src:`${prefix}/${manifest.variants[role][0].path}`,
    srcset:manifest.variants[role].map(image=>`${prefix}/${image.path} ${image.width}w`).join(', '),
  });
  return {phone:variant('phone'),tablet:variant('tablet'),desktop:variant('desktop'),preview:manifest.previewDataUrl};
}
