import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

console.log('====================================');
console.log('PS COLOR COLOR DESIGN TIPS TEST');
console.log('====================================\n');

let passedTests = 0;
let totalTests = 0;

function report(name, passed, detail = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`[PASS] ${name}${detail ? ` (${detail})` : ''}`);
  } else {
    console.error(`[FAIL] ${name}${detail ? ` (${detail})` : ''}`);
    throw new Error(`Assertion failed for: ${name} ${detail}`);
  }
}

const systemChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const localBrowser = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe');
const executablePath = (localBrowser && existsSync(localBrowser)) ? localBrowser : (existsSync(systemChrome) ? systemChrome : undefined);

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {})
});

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const pageErrors = [];
page.on('pageerror', err => pageErrors.push(err.message));

try {
  await page.goto('http://localhost:5173');
  await page.locator('.palette-card').first().waitFor();

  // 1. Initial State & Content Cleanliness
  const tipsContainer = page.locator('#design-tips');
  report('Color Design Tips container is present in right sidebar', await tipsContainer.isVisible());
  report('No "Sponsored" or "Advertisement" labels inside design tips', !(await tipsContainer.innerText()).toLowerCase().includes('sponsored'));

  // Verify only allowed elements exist: category badge, counter, title, description, dots, next button
  report('Card contains tip category badge', await tipsContainer.locator('.tip-badge').isVisible());
  report('Card contains tip counter (1/5)', (await tipsContainer.locator('.tip-counter').innerText()) === '1/5');
  report('Card contains tip title', await tipsContainer.locator('.tip-title').isVisible());
  report('Card contains tip description', await tipsContainer.locator('.tip-description').isVisible());
  report('Card contains pagination dot indicators', (await tipsContainer.locator('.tip-dot').count()) === 5);
  report('Card contains Next Tip button', await tipsContainer.locator('#btn-next-tip').isVisible());

  // Strict verification: No "Dismiss", "Settings", or "Save Changes" buttons exist
  const cardText = await tipsContainer.innerText();
  report('Strict check: No "Dismiss" text or button in card', !cardText.includes('Dismiss'));
  report('Strict check: No "Settings" text or button in card', !cardText.includes('Settings'));
  report('Strict check: No "Save Changes" text or button in card', !cardText.includes('Save Changes'));
  report('Strict check: No mock-btn elements inside card', (await tipsContainer.locator('.mock-btn').count()) === 0);

  const initialTitle = await tipsContainer.locator('.tip-title').innerText();
  report('Initial tip displays 60-30-10 rule', initialTitle.includes('60–30–10'), initialTitle);

  // Capture screenshot of Light Mode
  await page.screenshot({ path: 'test-results/design-tips-light.png' });
  report('Saved design tips light mode screenshot', true);

  // 2. Next Tip Interaction
  await page.locator('#btn-next-tip').click();
  await page.waitForTimeout(100);
  const secondTitle = await tipsContainer.locator('.tip-title').innerText();
  report('Clicking Next Tip advances to Warm & Cool Temperature', secondTitle.includes('Warm & Cool'), secondTitle);
  report('Counter advances to 2/5', (await tipsContainer.locator('.tip-counter').innerText()) === '2/5');

  // 3. Third Tip (Accessible Contrast)
  await page.locator('#btn-next-tip').click();
  await page.waitForTimeout(100);
  const thirdTitle = await tipsContainer.locator('.tip-title').innerText();
  report('Advancing to third tip displays Accessible Text Contrast', thirdTitle.includes('Accessible Text Contrast'), thirdTitle);

  // 4. Dot Navigation to Tip 4 (The Power of One Accent)
  await page.locator('[data-tip-index="3"]').click(); // 4th tip (Hierarchy / Accent)
  await page.waitForTimeout(100);
  const fourthTitle = await tipsContainer.locator('.tip-title').innerText();
  report('Clicking dot jumps directly to "The Power of One Accent"', fourthTitle.includes('One Accent'), fourthTitle);
  
  // Verify Tip 4 strictly contains NO unrelated buttons
  const tip4Text = await tipsContainer.innerText();
  report('Tip 4 strictly contains no Dismiss, Settings, or Save Changes', !tip4Text.includes('Dismiss') && !tip4Text.includes('Settings') && !tip4Text.includes('Save Changes'));

  // 5. One-Click Dark Mode Toggle
  report('Theme toggle button is present on header', await page.locator('#theme-toggle').isVisible());
  await page.locator('#theme-toggle').click();
  await page.waitForTimeout(150);
  report('No theme popover appears when clicking theme toggle', (await page.locator('#theme-popover').count()) === 0);

  const darkCardBg = await tipsContainer.evaluate(el => getComputedStyle(el).backgroundColor);
  report('Design tips card adapts to Dark Mode surface token (#1B1E26 rgb)', darkCardBg === 'rgb(27, 30, 38)');

  await page.screenshot({ path: 'test-results/design-tips-dark.png' });
  report('Saved design tips dark mode screenshot', true);

  // 6. Navigation to Palette Detail
  const paletteId = await page.locator('.palette-card').first().getAttribute('data-id');
  await page.goto(`http://localhost:5173/palette/${paletteId}`);
  await page.locator('.detail').waitFor();
  report('Design tips card remains active and visible on palette detail page', await tipsContainer.isVisible());

  // 7. Hidden on Visualizer route
  await page.goto('http://localhost:5173/visualizer');
  await page.locator('.visualizer-workspace').waitFor();
  report('Design tips card is hidden in full-width Live UI Visualizer', !(await tipsContainer.isVisible()));

  // 8. Zero Page Errors
  report('Zero browser JavaScript errors during all interactions', pageErrors.length === 0, pageErrors.join(', '));

} finally {
  await browser.close();
}

console.log('\n====================================');
console.log(`ALL DESIGN TIPS TESTS PASSED (${passedTests}/${totalTests})`);
console.log('====================================\n');
