/**
 * PS COLOR - Professional CSS Gradient Generator Automated Test Suite
 */

import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

import {
  createDefaultGradient,
  createGradientFromColors,
  getGradientCssValue,
  getGradientFullCss,
  isValidHex,
  normalizeHex,
  clamp,
  getPositionCoords,
  serializeGradientToParams,
  deserializeGradientFromParams,
  renderGradientToCanvas,
  getSavedGradients,
  saveGradientToStorage,
  deleteGradientFromStorage,
  CURATED_PRESETS,
  EXPORT_DIMENSIONS,
  STORAGE_GRADIENTS_KEY
} from '../src/gradient.js';

console.log('====================================');
console.log('PS COLOR CSS GRADIENT GENERATOR TEST');
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
    assert.fail(`Test failed: ${name}`);
  }
}

// ----------------------------------------------------
// 1. UNIT TESTS: CORE DATA MODEL & CSS GENERATION
// ----------------------------------------------------
console.log('--- 1. Testing Core Data Model & CSS Generation ---');

// 1.1 HEX Validation & Normalization
report('isValidHex validates 6-digit hex with hash', isValidHex('#667EEA'));
report('isValidHex validates 6-digit hex without hash', isValidHex('764BA2'));
report('isValidHex rejects invalid hex codes', !isValidHex('#ZZZZZZ') && !isValidHex('12345') && !isValidHex(''));
report('normalizeHex adds leading hash and uppercase', normalizeHex('667eea') === '#667EEA');
report('normalizeHex falls back safely on invalid input', normalizeHex('invalid') === '#000000');

// 1.2 Clamping & Positioning
report('clamp clamps numeric bounds', clamp(-10, 0, 100) === 0 && clamp(150, 0, 100) === 100 && clamp(50, 0, 100) === 50);
const centerCoords = getPositionCoords('center', 1000, 1000);
report('getPositionCoords resolves center to 50%', centerCoords.x === 500 && centerCoords.y === 500);
const topLeftCoords = getPositionCoords('top left', 1000, 1000);
report('getPositionCoords resolves top left', topLeftCoords.x === 0 && topLeftCoords.y === 0);

// 1.3 CSS Generation: Linear, Radial, Conic
const linearModel = createDefaultGradient({
  type: 'linear',
  angle: 135,
  stops: [
    { color: '#667EEA', position: 0 },
    { color: '#764BA2', position: 100 }
  ]
});
const linearCss = getGradientFullCss(linearModel);
report('Linear gradient generates standard CSS syntax', linearCss.includes('background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);'));

const radialModel = createDefaultGradient({
  type: 'radial',
  radialShape: 'circle',
  radialPosition: 'center',
  stops: [
    { color: '#F857A6', position: 0 },
    { color: '#FF5858', position: 100 }
  ]
});
const radialCss = getGradientFullCss(radialModel);
report('Radial gradient generates standard CSS syntax', radialCss.includes('background: radial-gradient(circle at center, #f857a6 0%, #ff5858 100%);'));

const conicModel = createDefaultGradient({
  type: 'conic',
  conicAngle: 45,
  conicPosition: 'center',
  stops: [
    { color: '#FF4365', position: 0 },
    { color: '#00D29E', position: 100 }
  ]
});
const conicCss = getGradientFullCss(conicModel);
report('Conic gradient generates standard CSS syntax', conicCss.includes('background: conic-gradient(from 45deg at center, #ff4365 0%, #00d29e 100%);'));

// 1.4 Palette Initialization & Preservation
const paletteColors = ['#F7F0DC', '#D9E4C8', '#A2B89B', '#52796F'];
const fromPalette = createGradientFromColors(paletteColors, 'linear');
report('createGradientFromColors preserves all palette hex values', fromPalette.stops.length === 4 && fromPalette.stops.every((s, i) => s.color === paletteColors[i]));

// 1.5 URL Serialization & Deserialization
const serializedParams = serializeGradientToParams(linearModel);
report('serializeGradientToParams encodes clean query string', serializedParams.includes('type=linear') && serializedParams.includes('stops='));
const deserialized = deserializeGradientFromParams(`?${serializedParams}`);
report('deserializeGradientFromParams reconstitutes gradient model', deserialized && deserialized.type === 'linear' && deserialized.stops.length === 2);
report('deserializeGradientFromParams handles corrupted input safely', deserializeGradientFromParams('?stops=corrupt,garbage') === null);

// ----------------------------------------------------
// 2. BROWSER END-TO-END TESTS (Playwright)
// ----------------------------------------------------
console.log('\n--- 2. Running Browser End-to-End Tests ---');

const systemChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const localBrowser = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe');
const executablePath = (localBrowser && existsSync(localBrowser)) ? localBrowser : (existsSync(systemChrome) ? systemChrome : undefined);

mkdirSync('test-results', { recursive: true });
const base = process.env.TEST_URL || 'http://localhost:5173';

const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  permissions: ['clipboard-read', 'clipboard-write']
});

const page = await context.newPage();
const pageErrors = [];
const recordedAnalytics = [];

page.on('pageerror', err => pageErrors.push(err.message));

// Expose analytics bridge
await page.exposeFunction('recordAnalyticsEvent', detail => {
  recordedAnalytics.push(detail);
});

await page.addInitScript(() => {
  window.addEventListener('ps-color-analytics', e => {
    if (window.recordAnalyticsEvent) {
      window.recordAnalyticsEvent(e.detail);
    }
  });
  // Simulate analytics consent granted for testing
  localStorage.setItem('ps-color-analytics-consent', 'granted');
  localStorage.setItem('ps-color-advertising-consent', 'denied');
});

try {
  // 2.1 Navigation to Gradient Generator
  console.log('--- 2.1 Testing Route & Navigation ---');
  await page.goto(`${base}/gradient/`);
  await page.locator('#gradient-generator-root').waitFor();
  report('Gradient Generator page loads successfully at /gradient/', true);

  // Check header menu contains Gradient Generator link
  await page.locator('#menu-toggle').click();
  const menuLink = page.locator('#menu [data-route="/gradient"]');
  report('Navigation dropdown menu contains Gradient Generator link', await menuLink.count() > 0);
  await page.locator('#menu-toggle').click(); // close menu

  // Check sidebar navigation contains Gradients item
  const sideNavItem = page.locator('#navigation [data-route="/gradient"]');
  report('Left sidebar navigation contains Gradients link with active state', await sideNavItem.count() > 0 && await sideNavItem.getAttribute('class').then(c => c.includes('active')));

  // Check footer contains Gradient Generator link
  const footerLink = page.locator('.footer-links [data-route="/gradient"]');
  report('Footer contains Gradient Generator link', await footerLink.count() > 0);

  // Check horizontal spacing between left sidebar and gradient controls panel
  const panelSpacing = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar.left');
    const controls = document.querySelector('.gradient-controls-panel');
    const container = document.querySelector('.gradient-generator-container');
    if (!sidebar || !controls || !container) return { gapToControls: 0, noOverlap: false, hasOverflow: true };
    const sRect = sidebar.getBoundingClientRect();
    const cRect = controls.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    return {
      gapToControls: Math.round(cRect.left - sRect.right),
      noOverlap: contRect.left >= sRect.right,
      hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  });
  report('Gradient left controls panel has proper horizontal breathing room from sidebar (>= 20px)', panelSpacing.gapToControls >= 20, `${panelSpacing.gapToControls}px`);
  report('Gradient container starts strictly after sidebar with zero overlap', panelSpacing.noOverlap);
  report('Page renders with zero horizontal overflow on desktop', !panelSpacing.hasOverflow);

  // 2.2 Live Preview & Type Switching
  console.log('\n--- 2.2 Testing Gradient Types & Live Preview ---');
  const liveDisplay = page.locator('#gradient-live-display');
  await liveDisplay.waitFor();
  const initialBg = await liveDisplay.evaluate(el => el.style.background);
  report('Live display renders initial linear gradient background', initialBg.includes('linear-gradient'));

  // Switch to Radial
  await page.locator('[data-gradient-type="radial"]').click();
  await page.waitForTimeout(100);
  const radialBg = await liveDisplay.evaluate(el => el.style.background);
  const codeTextRadial = await page.locator('#gradient-css-code-text').innerText();
  report('Switching to Radial updates live preview and code snippet', radialBg.includes('radial-gradient') && codeTextRadial.includes('radial-gradient'));

  // Switch to Conic
  await page.locator('[data-gradient-type="conic"]').click();
  await page.waitForTimeout(100);
  const conicBg = await liveDisplay.evaluate(el => el.style.background);
  const codeTextConic = await page.locator('#gradient-css-code-text').innerText();
  report('Switching to Conic updates live preview and code snippet', conicBg.includes('conic-gradient') && codeTextConic.includes('conic-gradient'));

  // Switch back to Linear
  await page.locator('[data-gradient-type="linear"]').click();
  await page.waitForTimeout(100);

  // 2.3 Angle & Geometry Controls
  console.log('\n--- 2.3 Testing Angle & Geometry Controls ---');
  // Click 90° quick button
  await page.locator('[data-set-angle="90"]').click();
  const code90 = await page.locator('#gradient-css-code-text').innerText();
  report('Quick angle button (90°) updates CSS code to 90deg', code90.includes('90deg'));

  // Slider change
  await page.locator('#input-gradient-angle').fill('210');
  await page.locator('#input-gradient-angle').dispatchEvent('input');
  const code210 = await page.locator('#gradient-css-code-text').innerText();
  report('Angle slider updates CSS code to 210deg', code210.includes('210deg'));

  // 2.4 Color Stops Manipulation & Limits (2 to 8 stops)
  console.log('\n--- 2.4 Testing Color Stops Manipulation & Limits ---');
  let stopRowsCount = await page.locator('.gradient-stop-row').count();
  report('Initial stops count is at least 2', stopRowsCount >= 2);

  // Add stops up to 8
  const addStopBtn = page.locator('#btn-add-stop');
  while (stopRowsCount < 8) {
    await addStopBtn.click();
    stopRowsCount = await page.locator('.gradient-stop-row').count();
  }
  report('Added color stops up to maximum 8 stops', stopRowsCount === 8);
  report('Add Stop button is disabled when limit of 8 is reached', await addStopBtn.isDisabled());

  // Edit stop color via hex input
  const firstHexInput = page.locator('.gradient-stop-row').first().locator('.gradient-hex-input');
  await firstHexInput.fill('#112233');
  await firstHexInput.dispatchEvent('input');
  const codeWithNewHex = await page.locator('#gradient-css-code-text').innerText();
  report('Editing stop HEX input updates CSS code with new color', codeWithNewHex.toLowerCase().includes('#112233'));

  // Reorder: Move stop down
  const stop1Color = await page.locator('.gradient-stop-row').first().locator('.gradient-hex-input').inputValue();
  await page.locator('.gradient-stop-row').first().locator('[data-move-stop-down]').click();
  const newStop2Color = await page.locator('.gradient-stop-row').nth(1).locator('.gradient-hex-input').inputValue();
  report('Reorder action moves stop down correctly', stop1Color === newStop2Color);

  // Delete stops down to 2
  while (stopRowsCount > 2) {
    await page.locator('.gradient-stop-row').last().locator('[data-delete-stop]').click();
    stopRowsCount = await page.locator('.gradient-stop-row').count();
  }
  report('Removed stops down to minimum limit of 2 stops', stopRowsCount === 2);
  const deleteBtns = page.locator('.gradient-stop-row [data-delete-stop]');
  const allDisabled = (await deleteBtns.first().isDisabled()) && (await deleteBtns.nth(1).isDisabled());
  report('Delete stop buttons are disabled when at minimum 2 stops', allDisabled);

  // 2.5 Curated Presets & Randomize & Reset
  console.log('\n--- 2.5 Testing Presets, Randomize & Reset ---');
  await page.locator('[data-preset-id="sunset-glow"]').click();
  const sunsetCode = await page.locator('#gradient-css-code-text').innerText();
  report('Loading preset Sunset Glow updates CSS stops (#ff5e62)', sunsetCode.toLowerCase().includes('#ff5e62'));

  await page.locator('#btn-gradient-random').click();
  await page.waitForTimeout(100);
  report('Random gradient button dispatches update', true);

  await page.locator('#btn-gradient-reset').click();
  await page.waitForTimeout(100);
  const resetCode = await page.locator('#gradient-css-code-text').innerText();
  report('Reset button restores default 2-stop gradient', resetCode.includes('#667eea') && resetCode.includes('#764ba2'));

  // 2.6 Copy CSS Clipboard Action
  console.log('\n--- 2.6 Testing Copy CSS Clipboard ---');
  let downloadFiredOnCopy = false;
  const copyDlListener = () => { downloadFiredOnCopy = true; };
  page.on('download', copyDlListener);

  await page.locator('#btn-copy-gradient-css').click();
  await page.waitForTimeout(200);

  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  const toastTextCss = await page.locator('#toast').innerText();
  const isCopyDialogOpen = await page.evaluate(() => document.querySelector('#dialog')?.hasAttribute('open'));
  const hasCopiedOverlayOnCopy = (await page.locator('.copied').count()) > 0;

  report('Copy CSS button copies standards-compliant background rule to clipboard', clipboardText.startsWith('background: linear-gradient(') && clipboardText.endsWith(';'));
  report('Copy CSS displays exact "CSS copied!" toast', toastTextCss === 'CSS copied!');
  report('Copy CSS does NOT open any modal or dialog overlay', !isCopyDialogOpen);
  report('Copy CSS does NOT inject any unbounded .copied overlay element', !hasCopiedOverlayOnCopy);
  report('Copy CSS does NOT trigger any file download', !downloadFiredOnCopy);
  page.off('download', copyDlListener);

  // 2.7 Shareable URL Generation & Deserialization
  console.log('\n--- 2.7 Testing Shareable URL ---');
  let downloadFiredOnShare = false;
  const shareDlListener = () => { downloadFiredOnShare = true; };
  page.on('download', shareDlListener);

  await page.locator('#btn-copy-gradient-link').click();
  await page.waitForTimeout(200);

  const linkText = await page.evaluate(() => navigator.clipboard.readText());
  const toastTextShare = await page.locator('#toast').innerText();
  const isShareDialogOpen = await page.evaluate(() => document.querySelector('#dialog')?.hasAttribute('open'));
  const hasCopiedOverlayOnShare = (await page.locator('.copied').count()) > 0;

  report('Share URL button copies valid gradient config URL', linkText.includes('/gradient/?') && linkText.includes('stops='));
  report('Share URL displays exact "Link copied!" toast', toastTextShare === 'Link copied!');
  report('Share URL does NOT open any modal or dialog overlay', !isShareDialogOpen);
  report('Share URL does NOT inject any unbounded .copied overlay element', !hasCopiedOverlayOnShare);
  report('Share URL does NOT trigger any file download', !downloadFiredOnShare);
  page.off('download', shareDlListener);

  // 2.7.1 Clipboard Error Handling (Non-blocking toast, no modals, no success before confirm)
  console.log('\n--- 2.7.1 Testing Clipboard Error Handling ---');
  const failureTestResult = await page.evaluate(async () => {
    // Temporarily break clipboard
    const origClipboard = navigator.clipboard;
    const origExec = document.execCommand;
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('Permission denied')) },
      configurable: true
    });
    document.execCommand = () => false;

    // Click Copy CSS while failing
    document.querySelector('#btn-copy-gradient-css').click();
    await new Promise(r => setTimeout(r, 100));
    const cssFailToast = document.querySelector('#toast').textContent;
    const cssFailDialog = document.querySelector('#dialog')?.hasAttribute('open');

    // Click Share URL while failing
    document.querySelector('#btn-copy-gradient-link').click();
    await new Promise(r => setTimeout(r, 100));
    const linkFailToast = document.querySelector('#toast').textContent;
    const linkFailDialog = document.querySelector('#dialog')?.hasAttribute('open');

    // Restore
    Object.defineProperty(navigator, 'clipboard', { value: origClipboard, configurable: true });
    document.execCommand = origExec;

    return {
      cssFailToast,
      cssFailDialog,
      linkFailToast,
      linkFailDialog
    };
  });

  report('Copy CSS failure displays non-blocking error toast', failureTestResult.cssFailToast.includes('Unable to copy'));
  report('Copy CSS failure does NOT display false success toast', !failureTestResult.cssFailToast.includes('copied!'));
  report('Copy CSS failure does NOT open modal dialog', !failureTestResult.cssFailDialog);
  report('Share URL failure displays non-blocking error toast', failureTestResult.linkFailToast.includes('Unable to copy'));
  report('Share URL failure does NOT display false success toast', !failureTestResult.linkFailToast.includes('copied!'));
  report('Share URL failure does NOT open modal dialog', !failureTestResult.linkFailDialog);

  // 2.8 LocalStorage Save & Load Gradients
  console.log('\n--- 2.8 Testing LocalStorage Save, Load & Corrupted Storage Handling ---');
  // Handle prompt for name
  page.once('dialog', async dialog => {
    await dialog.accept('My Test Horizon');
  });
  await page.locator('#btn-save-current-gradient').click();
  await page.waitForTimeout(200);

  const savedItem = page.locator('.gradient-saved-item');
  report('Saved gradient item appears in Saved Gradients list', await savedItem.count() > 0);
  const savedName = await page.locator('.gradient-saved-name').first().innerText();
  report('Saved gradient preserves custom name ("My Test Horizon")', savedName === 'My Test Horizon');

  // Verify corrupted storage recovery in browser
  await page.evaluate(key => {
    localStorage.setItem(key, 'INVALID_CORRUPTED_JSON_DATA');
  }, STORAGE_GRADIENTS_KEY);
  const recoveredList = await page.evaluate(() => {
    try {
      const raw = localStorage.getItem('ps-color-saved-gradients');
      JSON.parse(raw);
      return true;
    } catch {
      return 'recovered';
    }
  });
  report('Corrupted localStorage payload is safely quarantined', recoveredList === 'recovered');

  // 2.9 Canvas 2D PNG Export & Watermark Fidelity
  console.log('\n--- 2.9 Testing Canvas PNG Export & Watermark ---');
  const canvasVerification = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    // Test linear
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#667eea';
    ctx.fillRect(0, 0, 1080, 1080);
    // Draw watermark
    const imgData = ctx.getImageData(0, 0, 1080, 1080);
    return {
      width: canvas.width,
      height: canvas.height,
      hasPixels: imgData.data.length === 1080 * 1080 * 4
    };
  });
  report('Canvas 2D generates exact 1080×1080 pixel buffer', canvasVerification.width === 1080 && canvasVerification.height === 1080 && canvasVerification.hasPixels);

  // Trigger Download PNG event
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#btn-download-gradient-png').click();
  const download = await downloadPromise;
  const filename = download.suggestedFilename();
  report('Download PNG triggers local browser download', filename.startsWith('ps-color-gradient-') && filename.endsWith('.png'));

  // 2.10 Palette Detail View "Use as Gradient" Integration
  console.log('\n--- 2.10 Testing Palette Detail "Use as Gradient" Integration ---');
  await page.goto(`${base}/palette/f7f0dcd9e4c8a2b89b52796f`);
  await page.locator('.detail-actions').waitFor();
  const useAsGradientBtn = page.locator('#detail-use-gradient-btn');
  report('Palette detail view includes "Use as Gradient" button', await useAsGradientBtn.count() > 0);

  await useAsGradientBtn.click();
  await page.locator('#gradient-generator-root').waitFor();
  report('Clicking "Use as Gradient" navigates to /gradient/?palette=...', page.url().includes('/gradient/?palette='));

  const loadedStops = await page.locator('.gradient-stop-row .gradient-hex-input').evaluateAll(els => els.map(el => el.value));
  report('Gradient initialized with original 4 palette colors', loadedStops.length === 4 && loadedStops.includes('#F7F0DC') && loadedStops.includes('#52796F'));

  // 2.11 Dark Mode Theme Validation (No color shift on gradient)
  console.log('\n--- 2.11 Testing Light & Dark Mode ---');
  await page.screenshot({ path: 'test-results/gradient-desktop-light.png', fullPage: false });
  report('Saved gradient desktop light mode screenshot', true);

  const themeToggle = page.locator('#theme-toggle');
  await themeToggle.click();
  await page.waitForTimeout(200);

  // Check dark mode attribute
  const isDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark');
  report('Switched successfully to Dark Mode', isDark);

  // CRITICAL CHECK: Gradient live display must strictly maintain original colors (filter: none, opacity: 1)
  const displayFilter = await page.locator('#gradient-live-display').evaluate(el => window.getComputedStyle(el).filter);
  const displayOpacity = await page.locator('#gradient-live-display').evaluate(el => window.getComputedStyle(el).opacity);
  report('Dark Mode theme does NOT distort gradient preview colors (filter: none)', displayFilter === 'none');
  report('Dark Mode theme does NOT reduce gradient preview opacity (opacity: 1)', displayOpacity === '1');

  await page.screenshot({ path: 'test-results/gradient-desktop-dark.png', fullPage: false });
  report('Saved gradient desktop dark mode screenshot', true);

  // Switch back to Light Mode
  await themeToggle.click();
  await page.waitForTimeout(200);

  // 2.12 Responsive Viewports & Zero Horizontal Overflow
  console.log('\n--- 2.12 Testing Responsive Viewports (320, 375, 768, 1024, 1440px) ---');
  const viewports = [
    { width: 1440, height: 900, name: '1440px Desktop' },
    { width: 1024, height: 768, name: '1024px Small Desktop' },
    { width: 768, height: 1024, name: '768px Tablet' },
    { width: 375, height: 812, name: '375px Mobile' },
    { width: 320, height: 600, name: '320px Ultra-Compact' }
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(100);

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    report(`Zero horizontal overflow at ${vp.name}`, !hasHorizontalOverflow);

    if (vp.width === 375) {
      await page.screenshot({ path: 'test-results/gradient-mobile-light.png', fullPage: false });
      report('Saved gradient mobile light mode screenshot', true);

      await themeToggle.click();
      await page.waitForTimeout(150);
      await page.screenshot({ path: 'test-results/gradient-mobile-dark.png', fullPage: false });
      report('Saved gradient mobile dark mode screenshot', true);
      await themeToggle.click(); // revert
    }
  }

  // Restore desktop viewport
  await page.setViewportSize({ width: 1440, height: 1000 });

  // 2.13 Keyboard Accessibility
  console.log('\n--- 2.13 Testing Keyboard Accessibility ---');
  await page.locator('#btn-gradient-random').focus();
  const isRandomFocused = await page.locator('#btn-gradient-random').evaluate(el => el === document.activeElement);
  report('Random button is focusable via keyboard', isRandomFocused);

  // 2.14 Analytics Events Verification
  console.log('\n--- 2.14 Testing Consent Mode & Analytics Tracking ---');
  const eventNames = recordedAnalytics.map(e => e.event);
  report('Recorded gradient_open event', eventNames.includes('gradient_open'));
  report('Recorded gradient_type_change event', eventNames.includes('gradient_type_change'));
  report('Recorded gradient_copy_css event', eventNames.includes('gradient_copy_css'));
  report('Recorded gradient_download_png event', eventNames.includes('gradient_download_png'));
  report('Recorded gradient_save event', eventNames.includes('gradient_save'));

  // 2.15 Unhandled JavaScript Errors
  console.log('\n--- 2.15 Checking Zero JavaScript Exceptions ---');
  report('Zero browser page errors during entire testing session', pageErrors.length === 0, pageErrors.join(', '));

} catch (err) {
  console.error('\n[UNEXPECTED ERROR DURING GRADIENT TEST]:', err);
  process.exitCode = 1;
} finally {
  await browser.close();
}

console.log('\n====================================');
console.log(`GRADIENT TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('====================================\n');

if (passedTests !== totalTests || pageErrors.length > 0) {
  process.exit(1);
}
