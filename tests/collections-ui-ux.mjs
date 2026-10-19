import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

console.log('====================================');
console.log('PS COLOR MY COLLECTIONS UI/UX TEST');
console.log('====================================\n');

mkdirSync('test-results', { recursive: true });

const systemChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const localBrowser = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe');
const executablePath = (localBrowser && existsSync(localBrowser)) ? localBrowser : (existsSync(systemChrome) ? systemChrome : undefined);

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {})
});

const base = process.env.TEST_URL || 'http://localhost:5173';
const errors = [];

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write']
  });
  const page = await context.newPage();
  page.on('pageerror', err => errors.push(err.message));

  // -----------------------------------------------------------------
  // 1. Test Empty State (0 Palettes)
  // -----------------------------------------------------------------
  console.log('--- 1. Testing Empty State (0 Palettes) ---');
  await page.goto(base);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('ps-color-collections', JSON.stringify([
      {
        id: 'favorites',
        name: 'Favorites',
        description: 'Your favorite hand-picked color schemes',
        paletteIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ]));
    localStorage.setItem('ps-color-active-collection', 'favorites');
  });
  await page.goto(`${base}/collection`);
  await page.locator('#collection-manager').waitFor();

  assert.equal(await page.locator('.palette-card').count(), 0, 'Zero cards when collection has 0 palettes');
  assert.equal(await page.locator('.empty').count(), 1, 'Empty state container rendered');
  assert.match(await page.locator('.empty h2').innerText(), /Your collection starts here/);
  assert.equal(await page.locator('.empty button[data-route="/"]').count(), 1, 'Explore palettes button present');
  await page.screenshot({ path: 'test-results/collections-empty.png', fullPage: false });
  console.log('[PASS] 0 Palettes empty state validated');

  // -----------------------------------------------------------------
  // 2. Test 1 Palette Saved
  // -----------------------------------------------------------------
  console.log('\n--- 2. Testing 1 Palette Saved ---');
  await page.evaluate(() => {
    const col = JSON.parse(localStorage.getItem('ps-color-collections'));
    col[0].paletteIds = ['f7f0dcd9e4c8a2b89b52796f'];
    localStorage.setItem('ps-color-collections', JSON.stringify(col));
    localStorage.setItem('ps-color-saved', JSON.stringify(['f7f0dcd9e4c8a2b89b52796f']));
  });
  await page.reload();
  await page.locator('#collection-manager').waitFor();
  assert.equal(await page.locator('.palette-card').count(), 1, 'Exactly 1 palette card rendered');
  assert.equal(await page.locator('.empty').count(), 0, 'No empty state when palettes exist');
  console.log('[PASS] 1 Palette view validated');

  // -----------------------------------------------------------------
  // 3. Test 10 Palettes Saved
  // -----------------------------------------------------------------
  console.log('\n--- 3. Testing 10 Palettes Saved ---');
  await page.evaluate(() => {
    // Generate 10 valid palette IDs from sample 24-char hex strings
    const ids = [
      'f7f0dcd9e4c8a2b89b52796f',
      '2b2d428d99aeedf2f4ef233c',
      'e63946f1faeef1faeea8dadc',
      '2646532a9d8fe9c46af4a261',
      '003049d62828fdf0d5669bbc',
      'f4f1dee07a5f3d405b81b29a',
      'dad7cd5881573a5a40344e41',
      'ffbe0bfa8f11fb5607ff006e',
      'cdb4dbffc8ddffafccbde0fe',
      '3d5a8098c1d9e0fbfc293241'
    ];
    const col = JSON.parse(localStorage.getItem('ps-color-collections'));
    col[0].paletteIds = ids;
    localStorage.setItem('ps-color-collections', JSON.stringify(col));
    localStorage.setItem('ps-color-saved', JSON.stringify(ids));
  });
  await page.reload();
  await page.locator('#collection-manager').waitFor();
  assert.equal(await page.locator('.palette-card').count(), 10, 'Exactly 10 palette cards rendered');
  console.log('[PASS] 10 Palettes view validated');

  // -----------------------------------------------------------------
  // 4. Test 100 Palettes Saved (Performance & Grid Consistency)
  // -----------------------------------------------------------------
  console.log('\n--- 4. Testing 100 Palettes Saved ---');
  await page.evaluate(() => {
    const baseIds = [
      'f7f0dcd9e4c8a2b89b52796f', '2b2d428d99aeedf2f4ef233c',
      'e63946f1faeef1faeea8dadc', '2646532a9d8fe9c46af4a261',
      '003049d62828fdf0d5669bbc', 'f4f1dee07a5f3d405b81b29a',
      'dad7cd5881573a5a40344e41', 'ffbe0bfa8f11fb5607ff006e',
      'cdb4dbffc8ddffafccbde0fe', '3d5a8098c1d9e0fbfc293241'
    ];
    const hundredIds = [];
    for (let i = 0; i < 100; i++) {
      const hexIndex = (i + 1).toString(16).padStart(6, '0');
      hundredIds.push(`${baseIds[i % baseIds.length].slice(0, 18)}${hexIndex}`);
    }
    const col = JSON.parse(localStorage.getItem('ps-color-collections'));
    col[0].paletteIds = hundredIds;
    localStorage.setItem('ps-color-collections', JSON.stringify(col));
    localStorage.setItem('ps-color-saved', JSON.stringify(hundredIds));
  });
  await page.reload();
  await page.locator('#collection-manager').waitFor();
  const initialCardsCount = await page.locator('.palette-card').count();
  assert.equal(initialCardsCount, 36, 'First page of 100 palettes renders 36 cards');
  assert.equal(await page.locator('#load-more').count(), 1, 'Load more button present for large collections');

  await page.locator('#load-more').click();
  assert.equal(await page.locator('.palette-card').count(), 72, 'Clicking load more renders 72 cards smoothly');
  console.log('[PASS] 100 Palettes view & pagination validated');

  // Reset back to 10 palettes for visual screenshots
  await page.evaluate(() => {
    const ids = [
      'f7f0dcd9e4c8a2b89b52796f', '2b2d428d99aeedf2f4ef233c',
      'e63946f1faeef1faeea8dadc', '2646532a9d8fe9c46af4a261',
      '003049d62828fdf0d5669bbc', 'f4f1dee07a5f3d405b81b29a'
    ];
    const col = JSON.parse(localStorage.getItem('ps-color-collections'));
    col[0].paletteIds = ids;
    col.push({
      id: 'brand-2026',
      name: 'Brand Identity',
      description: 'Official product design colors',
      paletteIds: ['2646532a9d8fe9c46af4a261', 'f4f1dee07a5f3d405b81b29a'],
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    localStorage.setItem('ps-color-collections', JSON.stringify(col));
  });
  await page.reload();

  // -----------------------------------------------------------------
  // 5. Desktop Screenshots (Light & Dark Mode)
  // -----------------------------------------------------------------
  console.log('\n--- 5. Capturing Desktop Screenshots ---');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'test-results/collections-desktop-light.png', fullPage: false });

  // Open compact options menu (⋮)
  await page.locator('#collection-menu-trigger').click();
  await page.locator('#collection-menu-dropdown:not([hidden])').waitFor();
  await page.screenshot({ path: 'test-results/collections-menu-open.png', fullPage: false });
  await page.keyboard.press('Escape');

  // Toggle Dark Mode
  await page.locator('#theme-toggle').click();
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => document.documentElement.getAttribute('data-theme')), 'dark');
  await page.screenshot({ path: 'test-results/collections-desktop-dark.png', fullPage: false });
  console.log('[PASS] Desktop screenshots captured (Light, Dark, Menu Open)');

  // -----------------------------------------------------------------
  // 6. Responsive Viewport Tests: 1440px, 768px, 375px, 320px
  // -----------------------------------------------------------------
  console.log('\n--- 6. Testing Responsive Breakpoints (Zero Overflow) ---');
  const viewports = [
    { width: 1440, height: 900, label: '1440px Desktop' },
    { width: 768, height: 1024, label: '768px Tablet' },
    { width: 375, height: 812, label: '375px Mobile' },
    { width: 320, height: 568, label: '320px Ultra-Compact' }
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(100);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, `No horizontal overflow at ${vp.label}`);

    if (vp.width === 375) {
      // Capture 375px Dark Mode screenshot
      await page.screenshot({ path: 'test-results/collections-mobile-dark.png', fullPage: false });
      // Toggle back to Light Mode for mobile light screenshot
      await page.locator('#theme-toggle').click();
      await page.waitForTimeout(100);
      await page.screenshot({ path: 'test-results/collections-mobile-light.png', fullPage: false });
    }
    console.log(`[PASS] Responsive view verified at ${vp.label}`);
  }

  // -----------------------------------------------------------------
  // 7. Error-Free Verification
  // -----------------------------------------------------------------
  assert.deepEqual(errors, [], 'Strictly zero console/runtime errors');
  console.log('\n====================================');
  console.log('ALL MY COLLECTIONS UI/UX TESTS PASSED!');
  console.log('====================================\n');

} finally {
  await browser.close();
}
