import test from 'node:test';
import assert from 'node:assert/strict';
import { readCampaign, checkoutUrl, PRIME_CHECKOUT } from '../src/checkout-attribution.ts';
const memory = () => { const data = new Map(); return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }; };
test('arrival UTMs persist after navigation without a query', () => {
 const storage = memory();
 const expected = readCampaign('?utm_source=teste&utm_medium=email&utm_campaign=izi', storage);
 assert.deepEqual(readCampaign('', storage), expected);
 assert.deepEqual(readCampaign('#planos', storage), expected);
 const url = new URL(checkoutUrl(readCampaign('', storage)));
 assert.equal(url.searchParams.get('cupom'), '0,99_IZI');
 assert.equal(url.searchParams.get('utm_campaign'), 'izi');
 assert.equal(url.searchParams.get('pl'), '2');
});
test('campaign data cannot replace coupon, plan, unit or checkout account', () => {
 const campaign = readCampaign('?utm_source=teste&cupom=OUTRO&pl=99&un=7&k=outro', memory());
 const url = new URL(checkoutUrl({ ...campaign, cupom: 'OUTRO', pl: '99' }));
 const base = new URL(PRIME_CHECKOUT);
 for (const key of ['cupom', 'pl', 'un', 'k']) assert.equal(url.searchParams.get(key), base.searchParams.get(key));
});
test('a new campaign replaces stale session attribution', () => {
 const storage = memory();
 readCampaign('?utm_source=antigo&utm_medium=velho&utm_campaign=anterior', storage);
 assert.deepEqual(readCampaign('?utm_source=novo', storage), { utm_source: 'novo' });
 assert.deepEqual(readCampaign('', storage), { utm_source: 'novo' });
});
test('campaign values are URL encoded and custom UTM keys are retained', () => {
 const url = new URL(checkoutUrl(readCampaign('?utm_content=treino%20%26%20sa%C3%BAde&utm_id=123&fbclid=abc', memory())));
 assert.equal(url.searchParams.get('utm_content'), 'treino & saúde');
 assert.equal(url.searchParams.get('utm_id'), '123');
 assert.equal(url.searchParams.get('fbclid'), 'abc');
});
test('blocked or corrupt storage does not break direct checkout', () => {
 const blocked = { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('blocked'); } };
 assert.deepEqual(readCampaign('?utm_source=teste', blocked), { utm_source: 'teste' });
 assert.deepEqual(readCampaign('', blocked), {});
 assert.deepEqual(readCampaign('', { ...memory(), getItem: () => '{invalid' }), {});
 assert.equal(new URL(checkoutUrl({})).searchParams.get('cupom'), '0,99_IZI');
});
