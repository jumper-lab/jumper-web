import seo from '../../data/seo.json';
export interface SeoEntry { title:string; description:string; label:string; index:boolean; }
export const seoPages=seo.pages as Record<string,SeoEntry>;
export const routeKey=(path:string)=>path==='/'?'/':`/${path.replace(/^\/+|\/+$/g,'')}/`;
export function breadcrumbs(path:string,site:URL,base:string){
 const route=routeKey(path),home=new URL(`${base}/`,site).href;
 const items=[{name:'Início',url:home}];
 if(route!=='/'){
  const segments=route.split('/').filter(Boolean);let key='';
  for(const segment of segments){key+=`/${segment}`;const entry=seoPages[`${key}/`];if(entry)items.push({name:entry.label,url:new URL(`${base}${key}/`,site).href});}
 }
 return items;
}
export function openingHours(hours:{days:string;time:string}[]){
 const days:Record<string,string[]>={
  'Segunda a quinta':['Monday','Tuesday','Wednesday','Thursday'],
  'Sexta e sábado':['Friday','Saturday'],
  'Domingo e feriados':['Sunday'],
  'Sexta, sábado, domingo e feriados':['Friday','Saturday','Sunday'],
 };
 const clock=(value:string)=>{const m=value.trim().match(/^(\d{1,2})h(\d{2})?$/);if(!m)throw new Error(`Invalid opening time: ${value}`);return `${m[1].padStart(2,'0')}:${m[2]||'00'}`;};
 return hours.flatMap(hour=>{if(!days[hour.days])throw new Error(`Unknown opening days: ${hour.days}`);return hour.time.split('/').map(interval=>{const pair=interval.trim().split(' às ');if(pair.length!==2)throw new Error('Invalid hours interval');return {'@type':'OpeningHoursSpecification',dayOfWeek:days[hour.days].map(day=>`https://schema.org/${day}`),opens:clock(pair[0]),closes:clock(pair[1])};});});
}
