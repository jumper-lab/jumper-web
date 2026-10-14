import manifest from '../../data/responsive-photos.json';
import type {PhotoName} from './photos';
interface Variant {path:string;width:number;}
interface PreparedPhoto {width:number;height:number;variants:Variant[];preview:string;hero?:Record<'phone'|'tablet'|'desktop',Variant[]>;}
export function responsivePhoto(name:PhotoName){return (manifest as Record<string,PreparedPhoto>)[name];}
export function photoVariant(variants:Variant[],base:string){
 const prefix=base.replace(/\/$/,'');
 return {src:`${prefix}/${variants[0].path}`,srcset:variants.map(image=>`${prefix}/${image.path} ${image.width}w`).join(', ')};
}
