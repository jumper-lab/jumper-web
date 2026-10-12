import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { bootstrapTracking } from '../src/tracking-bootstrap.mjs';
import { setupCheckoutLinks, PRIME_CHECKOUT, trackingCheckoutUrl } from '../src/checkout-attribution.ts';
import { prepareCerroCoraTracking } from '../../rodeio-restaurante/scripts/prepare-cerrocora-tracking.mjs';

const defaults = JSON.parse(await readFile(new URL('../data/cerrocora-tracking.json', import.meta.url)));
const positions = ['header', 'hero', 'gallery', 'manifesto', 'prime', 'one', 'footer', 'mobile'];

function bootstrapFixture(config = structuredClone(defaults), existing = []) {
  const scripts = [];
  const document = { scripts, createElement: () => ({}), head: { appendChild: script => scripts.push(script) } };
  const fbq = () => {};
  const window = { dataLayer: existing, fbq };
  const context = vm.createContext({ window, document });
  vm.runInContext(`(${bootstrapTracking.toString()})(${JSON.stringify(config)})`, context);
  return { config, scripts, context, window, fbq };
}

function clickFixture(t, config = structuredClone(defaults)) {
  const store = new Map();
  const storage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  const links = positions.map(placement => {
    const link = new EventTarget();
    link.href = PRIME_CHECKOUT;
    link.dataset = { checkout: placement };
    return link;
  });
  const calls = [];
  const window = new EventTarget();
  Object.assign(window, { sessionStorage: storage, dataLayer: [], fbq: (...args) => calls.push(args) });
  if (config) window.cerroCoraTracking = config;
  const originals = new Map(['window', 'document', 'location'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.assign(globalThis, { window, document: { querySelectorAll: () => links }, location: { search: '?utm_source=teste&utm_id=42&gclid=gc&fbclid=fb&email=private%40example.com' } });
  t.after(() => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  setupCheckoutLinks();
  return { config, window, links, calls, location: globalThis.location };
}

test('both kits load once, share one startup, and preserve existing queues', () => {
  const queue = [{ event: 'consent_ready' }];
  const f = bootstrapFixture(undefined, queue);
  assert.equal(f.window.dataLayer, queue);
  assert.equal(f.window.fbq, f.fbq);
  assert.equal(queue[0].event, 'consent_ready');
  assert.equal(queue.filter(entry => entry.event === 'gtm.js').length, 1);
  assert.deepEqual(f.scripts.map(script => script.src), [
    'https://www.googletagmanager.com/gtag/js?id=G-7CECXK1LS2',
    'https://www.googletagmanager.com/gtm.js?id=GTM-N52MH72F',
    'https://www.googletagmanager.com/gtm.js?id=GTM-TGQTFXTN',
  ]);
  vm.runInContext(`(${bootstrapTracking.toString()})(${JSON.stringify(f.config)})`, f.context);
  assert.equal(f.scripts.length, 3);
  assert.equal(queue.filter(entry => entry.event === 'gtm.js').length, 1);
});

test('Cative off removes its container and direct GA4; Izi has no direct tool bootstrap', () => {
  const config = structuredClone(defaults);
  config.cative.enabled = false;
  const f = bootstrapFixture(config);
  assert.deepEqual(f.scripts.map(script => script.src), ['https://www.googletagmanager.com/gtm.js?id=GTM-TGQTFXTN']);
  assert.equal(f.window.gtag, undefined);
  const serialized = JSON.stringify(f.window.dataLayer);
  assert.ok(!serialized.includes('G-7CECXK1LS2'));
  assert.equal(f.window.dataLayer[0].cative_enabled, false);
});

test('GA4 migration switch disables only the direct path and retains both GTMs', () => {
  const config = structuredClone(defaults);
  config.cative.legacy.ga4Direct.enabled = false;
  const f = bootstrapFixture(config);
  assert.equal(f.scripts.length, 2);
  assert.equal(f.window.gtag, undefined);
});

test('disabled kits still retain the common dataLayer without loading scripts', () => {
  const config = structuredClone(defaults);
  config.izi.enabled = config.cative.enabled = false;
  const f = bootstrapFixture(config);
  assert.equal(f.scripts.length, 0);
  assert.equal(f.window.dataLayer.length, 1);
});

test('an existing GTM startup is reused without erasing messages', () => {
  const queue = [{ 'gtm.start': 123, event: 'gtm.js' }, { event: 'existing_event' }];
  bootstrapFixture(undefined, queue);
  assert.equal(queue.filter(entry => entry.event === 'gtm.js').length, 1);
  assert.equal(queue[1].event, 'existing_event');
});

test('all eight placements emit once and the legacy Meta call targets only Cative', t => {
  const f = clickFixture(t);
  setupCheckoutLinks(); // Accidental repeated setup must not duplicate handlers.
  f.links.forEach(link => link.dispatchEvent(new Event('click')));
  assert.equal(f.window.dataLayer.length, 8);
  assert.deepEqual(f.window.dataLayer.map(event => event.placement), positions);
  for (const event of f.window.dataLayer) {
    assert.equal(event.event, 'checkout_click');
    assert.equal(event.site_id, 'cerrocora');
    assert.equal(event.cative_checkout_source, 'legacy');
    assert.equal(event.utm_id, '42');
    assert.equal(event.gclid, 'gc');
    assert.equal(event.fbclid, 'fb');
    assert.equal(event.email, undefined);
    assert.ok(!new URL(event.checkout_url).searchParams.has('k'));
    assert.equal(new URL(event.checkout_url).searchParams.get('cupom'), '0,99_IZI');
  }
  assert.deepEqual(f.calls, positions.map(() => ['trackSingle', '922916223883872', 'InitiateCheckout']));
  assert.ok(f.links.every(link => new URL(link.href).searchParams.has('k')));
});

test('GTM checkout mode publishes its source with no direct Meta call', t => {
  const config = structuredClone(defaults);
  config.cative.legacy.metaCheckout.source = 'gtm';
  const f = clickFixture(t, config);
  f.links[0].dispatchEvent(new Event('click'));
  assert.equal(f.window.dataLayer[0].cative_checkout_source, 'gtm');
  assert.equal(f.calls.length, 0);
});

test('Cative off keeps links/campaign/events and cannot call its pixel', t => {
  const config = structuredClone(defaults);
  config.cative.enabled = false;
  const f = clickFixture(t, config);
  f.links[0].dispatchEvent(new Event('click'));
  assert.equal(f.window.dataLayer[0].cative_enabled, false);
  assert.equal(f.window.dataLayer[0].izi_enabled, true);
  assert.equal(f.calls.length, 0);
  assert.equal(new URL(f.links[0].href).searchParams.get('utm_source'), 'teste');
});

test('refresh/back and rapid clicks retain attribution and one logical push per occurrence', t => {
  const f = clickFixture(t);
  f.location.search = '';
  f.window.dispatchEvent(new Event('pageshow'));
  f.links[0].dispatchEvent(new Event('click'));
  f.links[0].dispatchEvent(new Event('click'));
  assert.equal(f.window.dataLayer.length, 2);
  assert.ok(f.window.dataLayer.every(event => event.utm_source === 'teste'));
  assert.equal(f.calls.length, 2);
});

test('late Meta library does not block checkout or lose its logical event', t => {
  const f = clickFixture(t);
  delete f.window.fbq;
  assert.doesNotThrow(() => f.links[0].dispatchEvent(new Event('click')));
  assert.equal(f.window.dataLayer.length, 1);
  assert.equal(f.window.dataLayer[0].event, 'checkout_click');
  // Receiving the legacy Meta event still depends on its base being available.
});

test('previews without the official configuration retain their legacy payload', t => {
  const f = clickFixture(t, null);
  f.links[0].dispatchEvent(new Event('click'));
  assert.deepEqual(f.calls, [['track', 'InitiateCheckout']]);
  assert.equal(f.window.dataLayer[0].site_id, undefined);
  assert.equal(f.window.dataLayer[0].checkout_url, f.links[0].href);
});

test('sanitized telemetry strips unrelated parameters, credentials and fragment', () => {
  const safe = new URL(trackingCheckoutUrl('https://user:pass@example.com/checkout?k=secret&un=1&pl=2&cupom=a&utm_id=42&email=person%40example.com#private'));
  assert.equal(safe.username, '');
  assert.equal(safe.password, '');
  assert.equal(safe.hash, '');
  assert.deepEqual([...safe.searchParams.keys()], ['un', 'pl', 'cupom', 'utm_id']);
});

test('official packaging replaces only reviewed snippets and respects noscript controls', async () => {
  const source = await readFile(new URL('../dist/simple/index.html', import.meta.url), 'utf8');
  const html = prepareCerroCoraTracking(source, defaults);
  assert.equal((html.match(/id="cerrocora-tracking"/g) || []).length, 1);
  assert.ok(!html.includes('<script async src="https://www.googletagmanager.com/gtag/js'));
  assert.ok(!html.includes("gtag('config','G-7CECXK1LS2')"));
  assert.ok(html.includes('ns.html?id=GTM-TGQTFXTN'));
  assert.ok(html.includes('ns.html?id=GTM-N52MH72F'));
  const off = structuredClone(defaults);
  off.cative.enabled = false;
  assert.ok(!prepareCerroCoraTracking(source, off).includes('ns.html?id=GTM-N52MH72F'));
  assert.throws(() => prepareCerroCoraTracking(html, defaults), /esperado uma vez/);
  assert.throws(() => prepareCerroCoraTracking(source.replaceAll('GTM-N52MH72F', 'GTM-UNREVIEWED'), defaults), /esperado uma vez/);
});
