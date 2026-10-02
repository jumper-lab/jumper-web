import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const content = JSON.parse(await fs.readFile('data/content.json', 'utf8'));
const expected = content.pages.history.paragraphs;
// Fingerprint of the seven full paragraphs explicitly approved in the chat.
const approvedSha256 = '64696d40fd8fbaf9b403f5cb29793e9ab548ce3fae2ee140deab03abd60c2a6e';
assert.equal(expected.length, 7);
assert.equal(createHash('sha256').update(expected.join('\n\n')).digest('hex'), approvedSha256);
assert.equal(content.positioning.story, expected.join('\n\n'));
const base = process.env.REVIEW_URL || 'http://127.0.0.1:4326/rodeio';
const out = `data/visual-review/historia-integral/${process.env.REVIEW_LABEL || 'local'}`;
await fs.mkdir(out, { recursive: true });
const report = { date: new Date().toISOString(), base, approvedSha256, checks: [] };
for (const [engine, type] of Object.entries({ chromium, firefox, webkit })) {
  const executablePath = process.env[`REVIEW_${engine.toUpperCase()}_EXECUTABLE`];
  const browser = await type.launch({ headless: true, ...(engine === 'chromium' ? { channel: 'chrome' } : {}), ...(executablePath ? { executablePath } : {}) });
  const widths = engine === 'chromium' ? [320, 390, 768, 1024, 1440, 1920] : [390, 1440];
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: width > 1000 ? 900 : 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(`${base}/historia/`, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      for (const img of document.querySelectorAll('img[src]')) { img.loading = 'eager'; await img.decode().catch(() => {}); }
    });
    assert.equal(response.status(), 200);
    assert.deepEqual(await page.locator('.history-narrative > p').allTextContents(), expected);
    const state = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages: [...document.querySelectorAll('img[src]')].filter(img => !img.complete || !img.naturalWidth).map(img => img.src),
      landmarks: [...document.querySelectorAll('.history-landmarks li > span')].map(el => el.textContent),
      narrativeBeforeArchive: Boolean(document.querySelector('.history-narrative').compareDocumentPosition(document.querySelector('.history-archive')) & Node.DOCUMENT_POSITION_FOLLOWING),
      heading: document.querySelector('#history-chapter-title').innerText.replace(/\s+/g, ' ').trim()
    }));
    assert.equal(state.overflow, false);
    assert.deepEqual(state.brokenImages, []);
    assert.deepEqual(state.landmarks, ['1958', '1959', '1986', '2001', '2011', '2026']);
    assert.equal(state.narrativeBeforeArchive, true);
    assert.equal(state.heading, 'Uma história que atravessa gerações.');
    assert.deepEqual(errors, []);
    const violations = engine === 'chromium' && [390, 1440].includes(width)
      ? (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations.map(v => ({ id: v.id, impact: v.impact })) : [];
    assert.deepEqual(violations, []);
    await page.evaluate(() => { const section = document.querySelector('#proxima-secao'); const header = document.querySelector('header'); window.scrollTo({ top: scrollY + section.getBoundingClientRect().top - (header?.getBoundingClientRect().height || 96) - 24, behavior: 'instant' }); });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.evaluate(async () => { await Promise.all(document.querySelector('#history-chapter-title').getAnimations().map(animation => animation.finished.catch(() => {}))); });
    assert.equal(await page.locator('#history-chapter-title').evaluate(el => getComputedStyle(el).opacity), '1');
    await page.screenshot({ path: `${out}/${engine}-${width}-narrative.jpg`, type: 'jpeg', quality: 85 });
    report.checks.push({ engine, width, paragraphs: 7, exactApprovedCopy: true, ...state, violations, errors, passed: true });
    await context.close();
    console.log(`${engine} ${width}px: sete parágrafos integrais, ordem correta, sem falhas.`);
  }
  await browser.close();
}
await fs.writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
