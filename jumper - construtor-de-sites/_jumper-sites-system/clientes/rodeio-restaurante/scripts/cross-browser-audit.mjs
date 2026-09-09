import { chromium, firefox, webkit } from 'playwright';
import fs from 'node:fs/promises';

const baseURL = process.env.SITE_URL || 'http://127.0.0.1:4321';
const routes = ['/', '/historia/', '/cardapio/', '/restaurantes/', '/restaurantes/jardins/', '/restaurantes/iguatemi/', '/eventos/', '/reservas/', '/privacidade/', '/404.html'];
const viewports = [{ name: 'mobile', width: 390, height: 844 }, { name: 'desktop', width: 1440, height: 900 }];
const engines = {
  chromium: { type: chromium, launch: { channel: 'chrome' } },
  firefox: { type: firefox, launch: { executablePath: '/Users/marajah/Library/Caches/ms-playwright/firefox-1538/firefox/Nightly.app/Contents/MacOS/firefox' } },
  webkit: { type: webkit, launch: {} },
};
const report = { date: new Date().toISOString(), baseURL, results: [], issues: [] };
const selectedEngines = new Set((process.env.ENGINES || Object.keys(engines).join(',')).split(','));

for (const [engineName, engine] of Object.entries(engines)) {
  if (!selectedEngines.has(engineName)) continue;
  let browser;
  try {
    browser = await engine.type.launch({ headless: true, ...engine.launch });
  } catch (error) {
    const item = { engine: engineName, interaction: 'launch', error: error.message, passed: false };
    report.results.push(item);
    report.issues.push(item);
    continue;
  }
  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport, reducedMotion: 'no-preference' });
      const errors = [];
      page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
      page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });

      for (const route of routes) {
        errors.length = 0;
        const response = await page.goto(baseURL + route, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);
        const state = await page.evaluate(() => {
          const hero = document.querySelector('.hero');
          const photoHero = document.querySelector('.hero-photo');
          const firstImage = document.querySelector('main img');
          return {
            statusContent: document.body.innerText.trim().length > 100,
            overflow: document.documentElement.scrollWidth > innerWidth,
            heroHeight: hero ? Math.round(hero.getBoundingClientRect().height) : null,
            heroWidth: hero ? Math.round(hero.getBoundingClientRect().width) : null,
            photoHeroBottom: photoHero ? Math.round(photoHero.getBoundingClientRect().bottom) : null,
            firstImageLoaded: firstImage ? firstImage.complete && firstImage.naturalWidth > 0 : true,
            errorOverlay: Boolean(document.querySelector('.vite-error-overlay, #webpack-dev-server-client-overlay')),
          };
        });
        // Astro's static preview serves the generated 404.html as a regular file.
        const expectedStatus = 200;
        const passed = response?.status() === expectedStatus && state.statusContent && !state.overflow && !state.errorOverlay && state.firstImageLoaded && (!state.heroHeight || state.heroHeight === viewport.height) && (!state.heroWidth || state.heroWidth === viewport.width) && (!state.photoHeroBottom || state.photoHeroBottom === viewport.height) && errors.length === 0;
        const item = { engine: engineName, viewport: viewport.name, route, status: response?.status(), ...state, errors: [...errors], passed };
        report.results.push(item);
        if (!passed) report.issues.push(item);
      }

      await page.goto(baseURL + '/', { waitUntil: 'networkidle' });
      if (viewport.name === 'mobile') {
        await page.locator('[data-open-menu]').click();
        const dialogOpen = await page.locator('#navigation-dialog').evaluate(dialog => dialog.open);
        await page.keyboard.press('Escape');
        report.results.push({ engine: engineName, viewport: viewport.name, interaction: 'mobile-menu', passed: dialogOpen });
      } else {
        await page.locator('a[href="/cardapio/"]').first().click();
        await page.waitForURL('**/cardapio/');
        report.results.push({ engine: engineName, viewport: viewport.name, interaction: 'navigation', passed: page.url().endsWith('/cardapio/') });
      }

      await page.goto(baseURL + '/restaurantes/jardins/', { waitUntil: 'networkidle' });
      const firstGallery = page.locator('[data-gallery]').first();
      await firstGallery.scrollIntoViewIfNeeded();
      await firstGallery.click();
      await page.waitForFunction(() => document.querySelector('.gallery-stage')?.getAttribute('aria-busy') === 'false');
      const firstCount = await page.locator('#gallery-count').textContent();
      await page.locator('[data-gallery-next]').click();
      await page.waitForFunction(() => document.querySelector('#gallery-count')?.textContent?.startsWith('2 /'));
      await page.keyboard.press('ArrowLeft');
      await page.waitForFunction(() => document.querySelector('#gallery-count')?.textContent?.startsWith('1 /'));
      await page.keyboard.press('Escape');
      const focusReturned = await firstGallery.evaluate(element => element === document.activeElement);
      report.results.push({ engine: engineName, viewport: viewport.name, interaction: 'lightbox', firstCount, focusReturned, passed: firstCount === '1 / 15' && focusReturned });

      await page.goto(baseURL + '/reservas/', { waitUntil: 'networkidle' });
      await page.locator('[data-unit="iguatemi"]').click();
      const reservation = await page.evaluate(() => ({
        pressed: document.querySelector('[data-unit="iguatemi"]')?.getAttribute('aria-pressed'),
        title: document.querySelector('#reservation-title')?.textContent,
        url: new URL(location.href).searchParams.get('unidade'),
      }));
      report.results.push({ engine: engineName, viewport: viewport.name, interaction: 'reservation-unit', ...reservation, passed: reservation.pressed === 'true' && reservation.title === 'Reserva no Rodeio Iguatemi' && reservation.url === 'iguatemi' });
      await page.close();
    }
  } finally {
    await browser.close();
    await fs.mkdir('data/visual-review/cross-browser', { recursive: true });
    await fs.writeFile('data/visual-review/cross-browser/report.partial.json', JSON.stringify(report, null, 2) + '\n');
  }
}

report.summary = {
  checks: report.results.length,
  passed: report.results.filter(result => result.passed).length,
  failed: report.results.filter(result => !result.passed).length,
  engines: [...selectedEngines],
};
await fs.mkdir('data/visual-review/cross-browser', { recursive: true });
await fs.writeFile('data/visual-review/cross-browser/report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.summary));
if (report.summary.failed) {
  console.error(JSON.stringify(report.issues, null, 2));
  process.exitCode = 1;
}
