import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {inventory} from '../validate-izi-release.mjs';
import {readPromotion,validatePromotionScope,compareProtectedPages,protectedPages} from '../preflight-hoster.mjs';

test('release permits only the two official pages, never Rodeio or previews', async()=>{
  const r=await readPromotion(['--promote=izi-official-2026-11-01']);
  assert.deepEqual(r.pages.map(x=>x.asset).sort(),['_official/izigym/index.shell','cerrocora/index.html']);
  for(const asset of ['rodeio/index.html','izigym/index.html','izigym-lp-vilaromana/index.html'])
    assert.throws(()=>validatePromotionScope({...r,pages:[...r.pages,{...r.pages[0],asset}]},'izi-official-2026-11-01'));
});

test('asset inventory detects added, changed and removed files',async()=>{
  const root=await mkdtemp(join(tmpdir(),'izi-inventory-'));
  try {
    await mkdir(join(root,'cerrocora'));await mkdir(join(root,'_official/izigym'),{recursive:true});
    const file=join(root,'cerrocora/index.html');await writeFile(file,'reviewed');
    const baseline=await inventory(root);
    await writeFile(file,'changed');assert.notDeepEqual(await inventory(root),baseline);
    await writeFile(file,'reviewed');await writeFile(join(root,'cerrocora/extra.js'),'extra');assert.notDeepEqual(await inventory(root),baseline);
    await rm(file);assert.notDeepEqual(await inventory(root),baseline);
  }finally{await rm(root,{recursive:true});}
});

test('prepared package allows only reviewed official differences', async()=>{
  const r=await readPromotion(['--promote=izi-official-2026-11-01']);
  const root=new URL('../../hoster-dist/',import.meta.url);
  const candidate=asset=>readFile(new URL(asset,root));
  const fake=async url=>{
    const entry=protectedPages.find(x=>x[1]===url);
    return new Response(await candidate(entry[2]));
  };
  assert.deepEqual(await compareProtectedPages(candidate,fake,r),[]);
  const drift=async url=>url.includes('/rodeio/')?new Response('other client drift'):fake(url);
  assert.ok((await compareProtectedPages(candidate,drift,r)).some(x=>x.includes('Rodeio')));
});
