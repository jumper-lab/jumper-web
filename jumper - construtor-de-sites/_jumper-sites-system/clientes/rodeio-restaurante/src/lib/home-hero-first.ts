import {responsivePhoto,photoVariant} from './responsive-photos';
export function homeHeroFirst(base:string){
  const photo=responsivePhoto('iguatemiAcervoDsc9454');
  if (!photo?.hero) throw new Error('A foto inicial do Rodeio Iguatemi não tem versões para o banner.');
  return {
    phone:photoVariant(photo.hero.phone,base),
    tablet:photoVariant(photo.hero.tablet,base),
    desktop:photoVariant(photo.hero.desktop,base),
    preview:photo.preview,
  };
}
