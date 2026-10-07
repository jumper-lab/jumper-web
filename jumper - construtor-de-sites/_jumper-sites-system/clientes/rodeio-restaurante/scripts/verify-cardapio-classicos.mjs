import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const content = JSON.parse(await fs.readFile('data/content.json', 'utf8'));
const base = process.env.REVIEW_URL || 'http://127.0.0.1:4326/rodeio';
const out = `data/visual-review/cardapio-classicos/${process.env.REVIEW_LABEL || 'local'}`;
await fs.mkdir(out, { recursive: true });
const report = { date: new Date().toISOString(), base, checks: [] };
for (const [engine, type] of Object.entries({ chromium, firefox, webkit })) {
  const executablePath = process.env[`REVIEW_${engine.toUpperCase()}_EXECUTABLE`];
  const browser = await type.launch({ headless: true, ...(engine === 'chromium' ? { channel: 'chrome' } : {}), ...(executablePath ? { executablePath } : {}) });
  const sizes = process.env.REVIEW_SIZES?.split(',').map(size => size.split('x').map(Number)) || (engine === 'chromium' ? [[320,740],[390,844],[768,1024],[1024,768],[1440,900],[1920,1080]] : [[390,844],[1440,900]]);
  for (const [width,height] of sizes) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    const response = await page.goto(`${base}/cardapio/`, { waitUntil: 'networkidle' });
    await page.evaluate(async () => { await document.fonts.ready; for (const img of document.querySelectorAll('img[src]')) { img.loading='eager';await img.decode().catch(()=>{}); } });
    const hero=await page.evaluate(()=>{const copy=document.querySelector('.hero-copy');return{clipped:copy.scrollHeight>copy.clientHeight+2,heading:getComputedStyle(document.querySelector('h1')).opacity};});
    assert.equal(hero.clipped,false);
    assert.equal(await page.locator('.hero-scroll').getAttribute('href'), '#proxima-secao');
    const menuLinks=page.getByRole('link',{name:content.pages.menu.cta,exact:true});
    assert.equal(await menuLinks.count(),3);
    for(const link of await menuLinks.all()) assert.equal(await link.getAttribute('href'),content.menu_url);
    assert.equal((await page.locator('#menu-classics-title').innerText()).replace(/\s+/g,' ').trim(),content.pages.menu.intro);
    assert.equal(await page.locator('.menu-classics-access > p').textContent(),content.pages.menu.description);
    assert.deepEqual(await page.locator('.menu-classic-name h3').allTextContents(),['Picanha fatiada','Arroz Rodeio']);
    const dishes = await page.locator('.menu-classics-layout figure').evaluateAll(figures => figures.map(figure => ({
      name: figure.querySelector('figcaption h3')?.textContent,
      alt: figure.querySelector('img')?.alt,
      source: figure.querySelector('img')?.getAttribute('src'),
      ratio: figure.querySelector('img')?.getBoundingClientRect().width / figure.querySelector('img')?.getBoundingClientRect().height,
      intrinsicRatio: Number(figure.querySelector('img')?.getAttribute('width')) / Number(figure.querySelector('img')?.getAttribute('height')),
    })));
    assert.equal(dishes[0].name, 'Picanha fatiada');
    assert.match(dishes[0].source, /home-picanha-fatiada-acervo-2024/);
    assert.equal(dishes[1].name, 'Arroz Rodeio');
    assert.match(dishes[1].source, /menuArrozRodeio/);
    for (const dish of dishes) assert.ok(Math.abs(dish.ratio - dish.intrinsicRatio) < .01, 'Dish photographs must retain their native proportions');
    assert.equal(await page.locator('.menu-classics-names').count(), 0, 'No detached dish names above unrelated photographs');
    const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,brokenImages:[...document.querySelectorAll('img[src]')].filter(img=>!img.complete||!img.naturalWidth).map(img=>img.src),heroImage:document.querySelector('.hero-figure img')?.getBoundingClientRect().width,newPhotos:document.querySelectorAll('.menu-classics-layout img').length, photoBottomAlignment:Math.abs(document.querySelector('.menu-cuts-photo .photo-viewport').getBoundingClientRect().bottom-document.querySelector('.menu-rice-photo .photo-viewport').getBoundingClientRect().bottom)}));
    if(width>=1000)assert.ok(state.photoBottomAlignment<=2, 'Photo captions must align on desktop');
    assert.equal(response.status(),200);assert.equal(state.overflow,false);assert.deepEqual(state.brokenImages,[]);assert.equal(state.newPhotos,2);assert.deepEqual(errors,[]);
    const violations=engine==='chromium'&&[390,1440].includes(width)?(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)})):[];
    assert.deepEqual(violations,[]);
    // Visit every chapter and wait for the existing entry motions before capturing.
    for(const selector of ['#proxima-secao','.menu-rice-photo','.menu-invitation','footer']){await page.locator(selector).scrollIntoViewIfNeeded();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});}
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    if(engine==='chromium'&&[390,1440].includes(width))await page.screenshot({path:`${out}/${width}-cardapio.jpg`,fullPage:true,type:'jpeg',quality:85});
    report.checks.push({engine,width,height,status:response.status(),...hero,...state,dishes,menuLinks:3,approvedCopy:true,violations,errors,passed:true});
    await context.close();console.log(`${engine} ${width}×${height}: layout, texto aprovado e links conferidos.`);
  }
  await browser.close();
}
await fs.writeFile(`${out}/report.json`,JSON.stringify(report,null,2));
