import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const localBrowser = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe');
const browser = await chromium.launch({ headless: true, ...(localBrowser && existsSync(localBrowser) ? { executablePath: localBrowser } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
mkdirSync('test-results', { recursive: true });
const base = process.env.TEST_URL || 'http://localhost:5173';

try {
  await page.goto(base);
  await page.locator('.palette-card').first().waitFor();
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: false });
  assert.equal(await page.locator('.palette-card').count(), 36);
  assert.equal(await page.locator('.brand').innerText(), 'PS color');

  // Verify original PS color logo exists in brand
  assert.equal(await page.locator('.brand .logo-icon').count(), 1);

  // Test like interaction
  await page.locator('[data-like]').first().click();

  // Test collection navigation and persistence
  await page.locator('#navigation [data-route="/collection"]').click();
  assert.equal(await page.locator('.palette-card').count(), 1);
  await page.reload();
  assert.equal(await page.locator('.palette-card').count(), 1, 'Collection persists after reload');
  await page.locator('[data-like]').first().click();
  assert.match(await page.locator('.empty').innerText(), /Your collection starts here/);

  // Test category filtering
  await page.locator('.brand').click();
  await page.locator('#categories [data-route="/palettes/pastel"]').click();
  assert.ok(await page.locator('.palette-card').count() > 0);
  assert.equal(await page.locator('.selected-tag').innerText(), 'Pastel\n×');

  // Test search: empty result and valid query
  await page.locator('#clear-search').click();
  await page.locator('#search').fill('zzzzzzz');
  assert.match(await page.locator('.empty').innerText(), /No palettes found/);
  await page.locator('#search').fill('blue');
  assert.ok(await page.locator('.palette-card').count() > 0);
  await page.locator('#search').press('Enter');
  await page.locator('#clear-search').click();

  // Test related search keywords
  await page.locator('#search').fill('galaxy');
  assert.ok(await page.locator('#search-panel').isVisible() || await page.locator('#search-panel section').count() > 0);
  await page.locator('#clear-search').click();

  // Test swatch copy and inline .copied indicator
  const firstId = await page.locator('.palette-card').first().getAttribute('data-id');
  await page.locator('.palette-card').first().locator('.swatch-0').hover();
  await page.locator('.palette-card').first().locator('.swatch-0 .hex').click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), '#F7F0DC');

  // Test detail view
  await page.locator('.palette-card').first().locator('.swatch-0 a').click({ position: { x: 80, y: 20 } });
  assert.ok(page.url().endsWith('/palette/' + firstId));
  assert.equal(await page.locator('.color-row').count(), 4);

  // Test PNG download
  const png = page.waitForEvent('download');
  await page.locator('[data-download]').click();
  assert.match((await png).suggestedFilename(), /^ps-color-.*\.png$/);

  // Test palette creator
  await page.locator('#menu-toggle').click();
  await page.locator('#menu [data-route="/create"]').click();
  await page.locator('[data-color-index="0"]').fill('#123456');
  await page.locator('#create-form button[type="submit"]').click();
  assert.ok(page.url().includes('/palette/123456'));
  assert.equal(await page.locator('.detail-actions [data-like]').getAttribute('aria-pressed'), 'true');

  // Test JSON collection export
  await page.locator('#menu-toggle').click();
  const exported = page.waitForEvent('download');
  await page.locator('[data-export]').click();
  assert.equal((await exported).suggestedFilename(), 'ps-color-collection.json');

  // Test popular view with timeframe
  await page.locator('.brand').click();
  await page.locator('#navigation [data-route="/popular"]').click();
  assert.equal(await page.locator('.timeframe').count(), 1);
  await page.locator('[data-time="All time"]').click();
  assert.ok(await page.locator('.palette-card').count() > 0);

  // Test random shuffle
  await page.locator('#navigation [data-route="/random"]').click();
  const before = await page.locator('.palette-card').evaluateAll(els => els.map(el => el.dataset.id).join(','));
  await page.locator('#navigation [data-route="/random"]').click();
  const after = await page.locator('.palette-card').evaluateAll(els => els.map(el => el.dataset.id).join(','));
  assert.notEqual(before, after, 'Random navigation reshuffles palettes');

  // Test pagination / load more
  await page.locator('.brand').click();
  await page.locator('#load-more').click();
  assert.equal(await page.locator('.palette-card').count(), 72);

  // Test dedicated pages: /about, /terms, /privacy
  await page.locator('#menu-toggle').click();
  await page.locator('#menu [data-route="/about"]').click();
  assert.ok(page.url().endsWith('/about'));
  assert.equal(await page.locator('.content-page').count(), 1);

  await page.locator('#menu-toggle').click();
  await page.locator('#menu [data-route="/terms"]').click();
  assert.ok(page.url().endsWith('/terms'));
  assert.match(await page.locator('.content-page h1').innerText(), /Terms of Service/);

  await page.locator('#menu-toggle').click();
  await page.locator('#menu [data-route="/privacy"]').click();
  assert.ok(page.url().endsWith('/privacy'));
  assert.match(await page.locator('.content-page h1').innerText(), /Privacy Policy/);

  // Test bookmark dialog
  await page.locator('.brand').click();
  await page.locator('#bookmark').click();
  assert.equal(await page.locator('dialog').evaluate(el => el.open), true);
  await page.keyboard.press('Escape');

  // Test mobile view
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.brand').click();
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: false });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'No mobile horizontal overflow');

  await page.locator('#search').click();
  await page.locator('#search-panel [data-tag="pastel"]').click();
  assert.ok(await page.locator('.palette-card').count() > 0);

  await page.locator('#navigation [data-route="/collection"]').click();
  assert.equal(await page.locator('.palette-card').count(), 1);

  // Invalid palette route error handling
  await page.goto(base + '/palette/invalid');
  assert.match(await page.locator('.empty').innerText(), /Palette not found/);

  assert.deepEqual(errors, [], 'No browser JavaScript errors');
  console.log('PASS: desktop/mobile layout, search, categories, collection persistence, clipboard, detail routes, PNG download, creator, export, popular, random, pagination, about/terms/privacy routes, and dialogs.');
} finally {
  await browser.close();
}
