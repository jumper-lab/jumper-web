import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
const root=new URL('../public/',import.meta.url);
test('all ZIP asset paths resolve, including Windows extracted names',async()=>{
 for(const page of ['index.html','proximos-passos.html']) {
  const html=await readFile(new URL(page,root),'utf8');
  const refs=[...html.matchAll(/(?:src=["']|url\(["']?)(assets\/[^"'\)\s]+)/g)].map(x=>x[1]);
  assert.ok(refs.length);for(const asset of new Set(refs))await access(new URL(asset,root));
 }
});
test('four forms share the persisted submit handler; ZIP tracking retained',async()=>{
 const html=await readFile(new URL('index.html',root),'utf8'), script=await readFile(new URL('assets/lead-form.js',root),'utf8');
 assert.equal((html.match(/<form onsubmit="handleFormSubmit\(event\)"/g)||[]).length,4);
 assert.equal((html.match(/function handleFormSubmit/g)||[]).length,0);
 assert.ok(html.includes('assets/lead-form.js'));assert.ok(!script.includes('localStorage'));
 assert.ok(html.includes('GTM-M3GVTFV4'));assert.ok(html.includes('1874149183549598'));assert.ok(script.includes('CADASTRO-LP-CATIVE'));
 assert.ok(script.indexOf("fetch('/api/lead'")<script.indexOf("fbq('track', 'Lead')"));
});

test('thank-you page keeps tracking loaders and PageView without replaying conversion',async()=>{
 const html=await readFile(new URL('proximos-passos.html',root),'utf8');
 assert.ok(html.includes('GTM-M3GVTFV4'));assert.ok(html.includes('1874149183549598'));assert.ok(html.includes("fbq('track', 'PageView')"));
 assert.ok(!html.includes('CADASTRO-LP-CATIVE'));assert.ok(!html.includes("fbq('track', 'Lead')"));assert.ok(!html.includes('CompleteRegistration'));assert.ok(!html.includes('cadastro_concluido'));
});
