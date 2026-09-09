import type {PhotoName} from './photos';
type GalleryEntry={name:PhotoName;caption:string};
export const restaurantGalleries:Record<string,GalleryEntry[]>={
 jardins:[
  {name:'jardins',caption:'O salão dos Jardins'},
  {name:'jardinsHero',caption:'Mesas preparadas para receber'},
  {name:'jardinsDirectory',caption:'Madeira, luz e acolhimento'},
  {name:'jardinsGallery',caption:'Um olhar pelo salão'},
  {name:'jardinsSala',caption:'A sala e suas mesas'},
  {name:'reservasHero',caption:'Encontros à mesa'},
  {name:'mesa',caption:'A luz da mesa'},
  {name:'jardinsMesaNoite',caption:'Mesa posta à noite'},
  {name:'mesaDetalhe',caption:'O cuidado nos detalhes'},
  {name:'jardinsMesaDois',caption:'Uma mesa para dois'},
  {name:'jardinsJanela',caption:'Luz natural na casa'},
  {name:'jardinsPassagem',caption:'Entre os ambientes'},
  {name:'bar',caption:'O bar dos Jardins'},
  {name:'jardinsLounge',caption:'O espaço de estar'},
  {name:'historiaHero',caption:'Iluminação acolhedora'},
 ],
 iguatemi:[
  {name:'iguatemi',caption:'O salão do Iguatemi'},
  {name:'iguatemiDirectory',caption:'Mesas e vegetação'},
  {name:'iguatemiHero',caption:'A casa em movimento'},
  {name:'iguatemiMesa',caption:'À mesa no Iguatemi'},
  {name:'iguatemiAcervo',caption:'A coleção que compõe a casa'},
 ]
};
