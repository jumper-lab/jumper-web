import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import path from 'node:path';
import seo from '../../data/seo.json' with {type:'json'};
const base=process.argv[2];
assert(base,'Usage: node scripts/tests/seo-contract.mjs <wordpress-package>');
const manifest=JSON.parse(await readFile(path.join(base,'manifest.json')));
const config=JSON.parse(await readFile(path.join(base,'rodeio-2026/releases',manifest.release,'seo.json')));
assert.equal(Object.keys(seo.pages).length,16);
assert.equal(Object.values(seo.pages).filter(p=>p.index).length,12);
for(const field of ['title','description'])assert.equal(new Set(Object.values(seo.pages).map(p=>p[field])).size,16,`Unique ${field}`);
for(const [route,entry] of Object.entries(seo.pages)){
 const file=manifest.routes[route==='/'?'':route.slice(1,-1)];assert(file,route);
 const html=gunzipSync(await readFile(path.join(base,'rodeio-2026/releases',manifest.release,'pages',file))).toString();
 assert.equal((html.match(/<h1\b/g)||[]).length,1,route+' has one H1');
 assert.equal((html.match(/<title>/g)||[]).length,1);
 assert(html.includes(`<title>${entry.title}</title>`),route+' title');
 assert(html.includes(`content="${entry.description}"`),route+' description');
 assert(html.includes(`rel="canonical" href="https://rodeiosp.com.br${route}"`),route+' canonical');
 assert(html.includes(`content="${entry.index?'index':'noindex'}, follow, max-image-preview:large"`),route+' robots');
 assert(!/localhost|site\.jumper\.dev\.br|\/inicio\//.test(html));
 const scripts=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)];assert.equal(scripts.length,1);
 const graph=JSON.parse(scripts[0][1])['@graph'];
 for(const type of ['Organization','WebSite','WebPage','BreadcrumbList'])assert.equal(graph.filter(n=>n['@type']===type).length,1,route+type);
 assert(!JSON.stringify(graph).includes('SearchAction'));
 const unit=graph.find(n=>n['@type']==='Restaurant');
 assert.equal(Boolean(unit),route==='/restaurantes/jardins/'||route==='/restaurantes/iguatemi/');
 if(unit){assert(unit.image&&unit.hasMap&&unit.hasMenu);assert(!unit.telephone,'No unconfirmed unit phone');assert(unit.openingHoursSpecification.length>=3);for(const h of unit.openingHoursSpecification){assert.match(h.opens,/^\d\d:\d\d$/);assert.match(h.closes,/^\d\d:\d\d$/);assert(h.dayOfWeek.every(d=>/^https:\/\/schema.org\/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/.test(d)));}}
}
assert.equal(Object.keys(config.restaurants).length,2);
console.log('SEO contract passed: 16 pages; 12 indexable; 4 utility pages; canonical, metadata, H1, breadcrumbs and local schema.');
