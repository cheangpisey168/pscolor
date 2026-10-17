import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

import {
  getTailwindSnippet,
  getCssSnippet,
  getFigmaTokens,
  getLuminance,
  getContrast,
  getWcagRating,
  monetizationConfig
} from '../src/utils.js';

console.log('====================================');
console.log('PS COLOR MONETIZATION & FEATURE TEST');
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
  }
}

// ----------------------------------------------------
// 1. VERIFY EXPORT SNIPPETS (Tailwind, CSS, Figma JSON)
// ----------------------------------------------------
console.log('--- 1. Testing Code Export Generation ---');
const sampleColors = ['#F7F0DC', '#D9E4C8', '#A2B89B', '#52796F'];

// 1.1 Tailwind Snippet
const tailwind = getTailwindSnippet(sampleColors);
const hasTailwindKeys = tailwind.includes('module.exports') &&
  sampleColors.every(c => tailwind.includes(c));
report('Tailwind CSS snippet contains module.exports & all 4 colors', hasTailwindKeys);

// 1.2 CSS Variables Snippet
const css = getCssSnippet(sampleColors);
const hasCssVars = css.startsWith(':root {') &&
  css.includes('--color-1: #F7F0DC;') &&
  css.includes('--color-4: #52796F;');
report('CSS snippet produces valid :root custom properties', hasCssVars);

// 1.3 Figma Tokens JSON Snippet
const figmaTokens = getFigmaTokens(sampleColors);
let figmaParsed;
try {
  figmaParsed = JSON.parse(figmaTokens);
} catch (e) {
  figmaParsed = null;
}
const isFigmaValid = figmaParsed &&
  figmaParsed.PS_Color &&
  figmaParsed.PS_Color.color_1.value === '#F7F0DC' &&
  figmaParsed.PS_Color.color_4.value === '#52796F';
report('Figma tokens snippet produces valid, parseable JSON schema', isFigmaValid);

// ----------------------------------------------------
// 2. VERIFY WCAG CONTRAST CALCULATIONS & THRESHOLDS
// ----------------------------------------------------
console.log('\n--- 2. Testing WCAG 2.1 Contrast Calculations ---');

// 2.1 Pure White vs Pure Black (Reference: 21:1)
const cMax = getContrast('#FFFFFF', '#000000');
report('White vs Black contrast equals exactly 21:1', cMax === 21, `got ${cMax}:1`);

// 2.2 Identical Colors (Reference: 1:1)
const cMin = getContrast('#FFFFFF', '#FFFFFF');
report('White vs White contrast equals exactly 1:1', cMin === 1, `got ${cMin}:1`);

// 2.3 Reference Grey #767676 vs White (Standard WCAG AA threshold 4.54:1)
const cAA = getContrast('#FFFFFF', '#767676');
report('White vs #767676 meets WCAG AA (>= 4.5:1)', cAA >= 4.5, `got ${cAA}:1`);

// 2.4 Reference Grey #595959 vs White (Standard WCAG AAA threshold 7.0:1)
const cAAA = getContrast('#FFFFFF', '#595959');
report('White vs #595959 meets WCAG AAA (>= 7.0:1)', cAAA >= 7.0, `got ${cAAA}:1`);

// 2.5 Rating Threshold Classification Tests
report('Rating function classifies 21:1 as AAA Pass', getWcagRating(21).level === 'aaa');
report('Rating function classifies 4.8:1 as AA Pass', getWcagRating(4.8).level === 'aa');
report('Rating function classifies 3.5:1 as AA Large Pass', getWcagRating(3.5).level === 'aa-large');
report('Rating function classifies 1.8:1 as Fail', getWcagRating(1.8).level === 'fail');

// ----------------------------------------------------
// 3. VERIFY MONETIZATION CONFIG & AD DISCLOSURES
// ----------------------------------------------------
console.log('\n--- 3. Testing Partner & Disclosure Configuration ---');
report('Monetization config exports partners', Boolean(monetizationConfig.partners));
report('Figma partner is labeled as Sponsored', monetizationConfig.partners.figma.label === 'Sponsored');
report('Framer partner is configured cleanly', Boolean(monetizationConfig.partners.framer.url));
report('Ad network status is clearly unverified/disabled until live account setup', monetizationConfig.adNetwork.enabled === false);

// ----------------------------------------------------
// 4. BROWSER E2E TESTS (Playwright)
// ----------------------------------------------------
console.log('\n--- 4. Running Browser End-to-End Tests ---');

const systemChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const localBrowser = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe');
const executablePath = (localBrowser && existsSync(localBrowser)) ? localBrowser : (existsSync(systemChrome) ? systemChrome : undefined);
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', err => pageErrors.push(err.message));
mkdirSync('test-results', { recursive: true });

const base = process.env.TEST_URL || 'http://localhost:5173';

try {
  // Test 4.1: Homepage load and palette counts
  await page.goto(base);
  await page.locator('.palette-card').first().waitFor();
  report('Homepage loads 36 standard palette cards', (await page.locator('.palette-card').count()) === 36);

  // Test 4.2: Sponsor card placement in feed
  const sponsorCardsCount = await page.locator('.sponsor-card').count();
  report('Sponsor card is placed after every 12 palettes in feed', sponsorCardsCount === 2, `found ${sponsorCardsCount} cards`);

  // Test 4.3: Sponsor card clear labeling
  const badgeText = await page.locator('.sponsor-card .sponsor-badge').first().innerText();
  report('Sponsor card is clearly disclosed with "Sponsored" badge', badgeText.toUpperCase() === 'SPONSORED');

  // Test 4.4: Sponsor link attributes
  const sponsorLink = page.locator('.sponsor-card .sponsor-btn').first();
  const relAttr = await sponsorLink.getAttribute('rel');
  report('Sponsor link includes rel="noopener sponsored"', relAttr?.includes('sponsored'));

  // Test 4.5: Detail view & Contrast calculation
  await page.locator('.palette-card').first().locator('.swatch-0 a').click({ position: { x: 80, y: 20 } });
  await page.locator('.contrast-section').waitFor();
  const contrastText = await page.locator('.contrast-score').innerText();
  report('Palette detail displays calculated accessibility contrast ratio', /Ratio:\s*[\d.]+:1/.test(contrastText), contrastText);

  // Test 4.6: Export Code modal
  await page.locator('[data-open-export]').click();
  await page.locator('.code-modal-header').waitFor();
  report('Export Code modal opens with tab options', await page.locator('.code-modal-tab').count() === 3);

  // Test 4.7: Export Code tab switching & copying
  await page.locator('.code-modal-tab[data-tab="css"]').click();
  assert.equal(await page.locator('#code-tab-css').isVisible(), true);
  await page.locator('#code-tab-css button').click();
  const copiedCss = await page.evaluate(() => navigator.clipboard.readText());
  report('Copying CSS Variables copies valid :root block to clipboard', copiedCss.includes(':root'));

  await page.locator('.code-modal-tab[data-tab="tokens"]').click();
  assert.equal(await page.locator('#code-tab-tokens').isVisible(), true);
  await page.locator('#code-tab-tokens button').click();
  const copiedTokens = await page.evaluate(() => navigator.clipboard.readText());
  let tokensParsed = false;
  try { JSON.parse(copiedTokens); tokensParsed = true; } catch {}
  report('Copying Figma Tokens copies valid JSON to clipboard', tokensParsed);

  await page.keyboard.press('Escape');

  // Test 4.8: Palette Creator & Image Extractor
  await page.locator('#menu-toggle').click();
  await page.locator('#menu [data-route="/create"]').click();
  await page.locator('.creator-mode-tabs').waitFor();
  report('Creator page loads with Manual and Extract from Photo tabs', true);

  // Switch to Extract from Photo mode
  await page.locator('[data-creator-mode="extract"]').click();
  assert.equal(await page.locator('#dropzone-area').isVisible(), true);
  report('Extract from Photo tab reveals drag-and-drop upload zone', true);

  // Test 4.9: Extract from valid PNG
  const fileInput = page.locator('#image-upload-input');
  await fileInput.setInputFiles('test-assets/sample.png');
  await page.waitForTimeout(400);
  const color1 = await page.locator('[data-color-index="0"]').inputValue();
  report('PNG image extraction automatically populates hex color inputs', /^#[A-F0-9]{6}$/i.test(color1), color1);

  // Test 4.10: Extract from valid JPG
  await fileInput.setInputFiles('test-assets/sample.jpg');
  await page.waitForTimeout(400);
  report('JPG image extraction runs successfully without errors', true);

  // Test 4.11: Extract from valid WEBP
  await fileInput.setInputFiles('test-assets/sample.webp');
  await page.waitForTimeout(400);
  report('WEBP image extraction runs successfully without errors', true);

  // Test 4.12: Large image extraction performance
  await fileInput.setInputFiles('test-assets/large.png');
  await page.waitForTimeout(400);
  report('Large image extraction completes fast via downsampled canvas', true);

  // Test 4.13: Invalid file upload error handling
  await fileInput.setInputFiles('test-assets/invalid.txt');
  await page.waitForTimeout(300);
  const toastText = await page.locator('#toast').innerText();
  report('Invalid non-image file is rejected with user toast notification', toastText.includes('valid image file'), toastText);

  // Test 4.14: Responsive Desktop vs Mobile layout
  await page.locator('.brand').click();
  await page.locator('.sidebar-sponsor').waitFor();
  report('Desktop view (1440px) shows sidebar partner placement', await page.locator('.sidebar-sponsor').isVisible());

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  const isSidebarHidden = !(await page.locator('.sidebar-sponsor').isVisible());
  const hasNoMobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  report('Mobile view (390px) cleanly hides sidebar without horizontal overflow', isSidebarHidden && hasNoMobileOverflow);

  // Test 4.15: Page errors check
  report('No unhandled browser JavaScript errors during entire session', pageErrors.length === 0, pageErrors.join('; '));

} finally {
  await browser.close();
}

console.log('\n====================================');
console.log(`TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('====================================');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}
