import fs from 'node:fs/promises';
import path from 'node:path';
import desktopConfig from '/Users/marajah/.npm/_npx/5390d7d89c0de19d/node_modules/lighthouse/core/config/desktop-config.js';
import lighthouse from '/Users/marajah/.npm/_npx/5390d7d89c0de19d/node_modules/lighthouse/core/index.js';
import * as chromeLauncher from '/Users/marajah/.npm/_npx/5390d7d89c0de19d/node_modules/chrome-launcher/dist/index.js';
const out='data/visual-review/photo-refresh';await fs.mkdir(out,{recursive:true});
const selected=process.argv.slice(2);const routes=selected.length?selected:['/','/historia/','/cardapio/','/restaurantes/','/restaurantes/jardins/','/restaurantes/iguatemi/','/eventos/','/reservas/'];
const summaries=[];
for(const route of routes){
 const chrome=await chromeLauncher.launch({chromePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',chromeFlags:['--headless','--no-first-run','--disable-background-networking']});
 try {
 const {lhr}=await lighthouse('http://127.0.0.1:4321'+route,{port:chrome.port,logLevel:'error',output:'json',onlyCategories:['performance','accessibility','best-practices','seo']},process.env.LIGHTHOUSE_DESKTOP?desktopConfig:undefined);
 const filename=`lighthouse-${process.env.LIGHTHOUSE_DESKTOP?'desktop-':''}${route.replaceAll('/','')||'home'}-${Date.now()}.json`;
 await fs.writeFile(path.join(out,filename),JSON.stringify(lhr));
 const summary={route,file:filename,scores:Object.fromEntries(Object.entries(lhr.categories).map(([k,v])=>[k,Math.round(v.score*100)])),lcp:lhr.audits['largest-contentful-paint'].numericValue,tbt:lhr.audits['total-blocking-time'].numericValue,cls:lhr.audits['cumulative-layout-shift'].numericValue,bytes:lhr.audits['total-byte-weight'].numericValue,issues:Object.values(lhr.audits).filter(a=>a.score!==null&&a.score<1).map(a=>({id:a.id,title:a.title,display:a.displayValue}))};summaries.push(summary);console.log(JSON.stringify(summary));
 }finally{await Promise.resolve(chrome.kill());}
}
await fs.writeFile(path.join(out,'lighthouse-summary-'+Date.now()+'.json'),JSON.stringify(summaries,null,2));
