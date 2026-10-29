import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareInstitutionalPreview } from '../prepare-institutional-preview.mjs';
test('copy scopes root paths without duplicating base or changing external URLs', () => {
  const html = '<img src="/images/hero.jpg"><script src="/izigym/assets/app.js"></script><img srcset="/cdn-cgi/image/w=640/images/hero.jpg 640w, /images/hero.jpg 960w"><a href="https://example.com/images/a.jpg">';
  const text = prepareInstitutionalPreview(html, 'izigym');
  for (const expected of ['src="/izigym/images/hero.jpg"','src="/izigym/assets/app.js"','/izigym/cdn-cgi/image/w=640/images/hero.jpg',', /izigym/images/hero.jpg 960w','https://example.com/images/a.jpg']) assert.ok(text.includes(expected));
  assert.ok(!text.includes('/izigym/izigym/'));
});
test('copy disables production tracking and indexing only in the preview', () => {
  const source = '<meta name="robots" content="index, follow" /><script>({"izi":{"enabled":true,"gtmId":"GTM-TGQTFXTN"}})</script><noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TGQTFXTN"></iframe></noscript>';
  const text = prepareInstitutionalPreview(source, 'izigym');
  assert.ok(text.includes('noindex, nofollow'));
  assert.ok(text.includes('"enabled":false'));
  assert.ok(!text.includes('<iframe'));
  assert.ok(source.includes('"enabled":true'));
});
test('preserved version gets its own canonical and other slugs are rejected', () => {
  assert.equal(prepareInstitutionalPreview('https://site.jumper.dev.br/izigym/', 'izigym2'), 'https://site.jumper.dev.br/izigym2/');
  assert.throws(() => prepareInstitutionalPreview('', 'rodeio'));
});
