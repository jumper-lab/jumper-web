import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { compareProtectedPages, protectedPages, readPromotion, validatePromotionScope } from '../preflight-hoster.mjs';
const digest = value => createHash('sha256').update(value).digest('hex');
const asset = 'cerrocora/index.html';
const candidate = name => Buffer.from(`${name}:candidate`);
const fixture = (current = 'previous', otherChanged = false) => async url => {
 const entry = protectedPages.find(([, address]) => address === url);
 const value = entry[2] === asset ? current : (otherChanged && entry[2] === 'rodeio/index.html' ? 'unexpected' : `${entry[2]}:candidate`);
 return new Response(value);
};
const promotion = { pages: [{ asset, candidateSha256: digest(candidate(asset)), publishedSha256: [digest('previous'), digest(candidate(asset))] }] };
test('ordinary preflight rejects changed protected page', async () => {
 assert.equal((await compareProtectedPages(candidate, fixture())).length, 1);
});
test('reviewed promotion accepts only its exact source or destination', async () => {
 assert.deepEqual(await compareProtectedPages(candidate, fixture(), promotion), []);
 assert.deepEqual(await compareProtectedPages(candidate, fixture(`${asset}:candidate`), promotion), []);
 assert.equal((await compareProtectedPages(candidate, fixture('another-deployment'), promotion)).length, 1);
});
test('promotion rejects a candidate differing from the reviewed hash', async () => {
 const changed = name => name === asset ? Buffer.from('unexpected candidate') : candidate(name);
 assert.equal((await compareProtectedPages(changed, fixture(), promotion)).length, 1);
});
test('promotion cannot exempt an unrelated client', async () => {
 const differences = await compareProtectedPages(candidate, fixture('previous', true), promotion);
 assert.equal(differences.length, 1);
 assert.match(differences[0], /Rodeio/);
});

test('franchise admin promotion fixes the exact independent D1 and keeps the existing page scope', async () => {
 const release = await readPromotion(['--promote=izi-franquias-admin-2026-10-08']);
 assert.equal(release.scope, 'izi-franquias-admin');
 assert.deepEqual(release.franchiseDatabase, {binding:'IZI_FRANCHISE_DB',database_id:'4553bc65-eeb8-4404-aa57-e44692bcc9a3'});
 assert.deepEqual(release.pages.map(page=>page.asset).sort(), ['cerrocora/index.html','izigym-lp-vilaromana/index.html']);
 await assert.rejects(readPromotion(['--promote=any-other-client']), /desconhecida/);
});

test('tracking release uses its own reviewed hashes without widening the page scope', async () => {
 const release = await readPromotion(['--promote=cerrocora-tracking-2026-10-12']);
 const previous = await readPromotion(['--promote=cerrocora-direct-checkout-2026-10-08']);
 assert.equal(release.scope, 'cerrocora');
 assert.deepEqual(release.pages.map(page=>page.asset).sort(), ['cerrocora/index.html','izigym-lp-vilaromana/index.html']);
 assert.notEqual(release.pages[0].candidateSha256, previous.pages[0].candidateSha256);
 assert.ok(release.pages[0].publishedSha256.includes(previous.pages[0].candidateSha256));
 assert.deepEqual(release.pages[1].publishedSha256, ['f4fd8685e2b899c49b44d13f4cd738215c6b6d506dc5c2031400c2c6ddbfc3ea']);
 await assert.rejects(readPromotion(['--promote=cerrocora-tracking-2026-10-12', '--promote=any-other-client']), /desconhecida/);
});


test('hours promotion is restricted to the principal and the previously reviewed Vila Romana asset', async () => {
 const release = await readPromotion(['--promote=principal-horarios-2026-10-26']);
 const previous = await readPromotion(['--promote=principal-tracking-2026-10-13']);
 assert.equal(release.scope, 'principal');
 assert.deepEqual(release.pages.map(page=>page.asset).sort(), ['_official/izigym/index.shell','izigym-lp-vilaromana/index.html']);
 assert.deepEqual(release.pages[1], previous.pages[1]);
 assert.ok(release.pages[0].publishedSha256.includes(previous.pages[0].candidateSha256));
 assert.ok(release.pages[0].publishedSha256.includes(release.pages[0].candidateSha256));
 for (const asset of ['rodeio/index.html', 'cerrocora/index.html', 'izigym/index.html']) {
  assert.throws(()=>validatePromotionScope({...release,pages:[...release.pages,{...release.pages[0],asset}]}, 'principal-horarios-2026-10-26'), /escopo revisado/);
 }
});
