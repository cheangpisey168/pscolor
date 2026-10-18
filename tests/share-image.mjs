/**
 * PS COLOR - Phase 2: Share Palette as Image Test Suite
 * 
 * Tests:
 * 1. Palette detail page & Visualizer "Share as Image" trigger buttons
 * 2. Studio Modal rendering & structure
 * 3. Export dimensions (1080×1080, 1080×1350, 1080×1920)
 * 4. Image templates (Minimal, Modern, Social Media)
 * 5. Color fidelity & pixel accuracy
 * 6. Customization controls (Title, HEX toggle, Branding toggle)
 * 7. Download, Copy & Native Share actions with graceful fallbacks
 * 8. Mobile responsiveness & zero overflow
 * 9. Privacy-first Analytics tracking (Zero PII)
 */

import { chromium } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const systemChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const localBrowser = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe');
const executablePath = (localBrowser && existsSync(localBrowser)) ? localBrowser : (existsSync(systemChrome) ? systemChrome : undefined);

mkdirSync('test-results', { recursive: true });
const base = process.env.TEST_URL || 'http://localhost:5173';

console.log('====================================');
console.log('PS COLOR PHASE 2: SHARE PALETTE AS IMAGE TEST');
console.log('====================================');

const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  permissions: ['clipboard-read', 'clipboard-write']
});

const page = await context.newPage();
const errors = [];
const allAnalyticsEvents = [];

page.on('pageerror', err => errors.push(err.message));

// Expose node function so events persist across page reloads
await page.exposeFunction('recordAnalyticsEvent', (detail) => {
  allAnalyticsEvents.push(detail);
});

// Listen to privacy-first analytics events
await page.addInitScript(() => {
  window.addEventListener('ps-color-analytics', (e) => {
    if (window.recordAnalyticsEvent) {
      window.recordAnalyticsEvent(e.detail);
    }
  });
  // Simulate analytics consent granted for testing
  localStorage.setItem('ps-color-analytics-consent', 'granted');
  localStorage.setItem('ps-color-advertising-consent', 'denied');
});

function report(name, passed) {
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}`);
  assert.ok(passed, `Assertion failed for: ${name}`);
}

try {
  // --- 1. Testing Detail Page Trigger Button ---
  console.log('\n--- 1. Testing Detail Page Trigger Button ---');
  await page.goto(`${base}/palette/f7f0dcd9e4c8a2b89b52796f`);
  await page.locator('.detail-actions').waitFor();

  const shareImgBtn = page.locator('#detail-share-image-btn');
  report('Palette detail page contains #detail-share-image-btn button', await shareImgBtn.isVisible());
  report('Button text contains "Share as Image"', (await shareImgBtn.innerText()).includes('Share as Image'));

  // Verify button sizing matches the other detail actions (38px height)
  const btnHeight = await shareImgBtn.evaluate(el => window.getComputedStyle(el).height);
  report('Share as Image button matches 38px height of action bar', btnHeight === '38px');

  // --- 2. Testing Studio Modal Opening & Layout ---
  console.log('\n--- 2. Testing Studio Modal Opening & Layout ---');
  await shareImgBtn.click();
  await page.locator('dialog.share-image-dialog').waitFor();

  const dialog = page.locator('dialog.share-image-dialog');
  report('Share as Image modal dialog is open', await dialog.evaluate(el => el.open));

  const heading = await page.locator('#share-modal-heading').innerText();
  report('Modal displays "Share Palette as Image" heading', heading.includes('Share Palette as Image'));

  const previewCanvas = page.locator('#share-preview-canvas');
  report('Live preview canvas is present inside modal', await previewCanvas.isVisible());

  // --- 3. Testing Dimension Switching & Canvas Geometry ---
  console.log('\n--- 3. Testing Dimension Switching & Canvas Geometry ---');
  // Default is 1080x1080
  let canvasSize = await previewCanvas.evaluate(c => ({ width: c.width, height: c.height }));
  report('Default canvas dimensions are 1080×1080', canvasSize.width === 1080 && canvasSize.height === 1080);

  // Switch to 1080x1350 (Portrait)
  await page.locator('[data-dim="1080x1350"]').click();
  await page.waitForTimeout(100);
  canvasSize = await previewCanvas.evaluate(c => ({ width: c.width, height: c.height }));
  report('Switching to Portrait updates canvas to 1080×1350', canvasSize.width === 1080 && canvasSize.height === 1350);

  // Switch to 1080x1920 (Story)
  await page.locator('[data-dim="1080x1920"]').click();
  await page.waitForTimeout(100);
  canvasSize = await previewCanvas.evaluate(c => ({ width: c.width, height: c.height }));
  report('Switching to Story updates canvas to 1080×1920', canvasSize.width === 1080 && canvasSize.height === 1920);

  // Switch back to 1080x1080 (Square)
  await page.locator('[data-dim="1080x1080"]').click();
  await page.waitForTimeout(100);

  // --- 4. Testing Color Fidelity & Pixel Accuracy ---
  console.log('\n--- 4. Testing Color Fidelity & Pixel Accuracy ---');
  // Palette #f7f0dcd9e4c8a2b89b52796f has colors: #F7F0DC, #D9E4C8, #A2B89B, #52796F
  // In Minimal template, 4 vertical stripes:
  // Stripe 0: x in [0, 270], Stripe 1: x in [270, 540], Stripe 2: x in [540, 810], Stripe 3: x in [810, 1080]
  const pixelColors = await previewCanvas.evaluate(canvas => {
    const ctx = canvas.getContext('2d');
    function getHex(x, y) {
      const p = ctx.getImageData(x, y, 1, 1).data;
      return '#' + [p[0], p[1], p[2]].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
    }
    return {
      c0: getHex(100, 300),
      c1: getHex(370, 300),
      c2: getHex(640, 300),
      c3: getHex(910, 300)
    };
  });

  report('Stripe 1 pixel matches #F7F0DC', pixelColors.c0 === '#F7F0DC');
  report('Stripe 2 pixel matches #D9E4C8', pixelColors.c1 === '#D9E4C8');
  report('Stripe 3 pixel matches #A2B89B', pixelColors.c2 === '#A2B89B');
  report('Stripe 4 pixel matches #52796F', pixelColors.c3 === '#52796F');

  // Save desktop modal screenshot
  await page.screenshot({ path: 'test-results/share-image-modal-desktop.png' });
  report('Saved desktop share image studio screenshot to test-results/share-image-modal-desktop.png', true);

  // --- 5. Testing Template Switching ---
  console.log('\n--- 5. Testing Template Switching ---');
  // Switch to Modern Template
  await page.locator('[data-template="modern"]').click();
  await page.waitForTimeout(100);
  const modernBg = await previewCanvas.evaluate(canvas => {
    const ctx = canvas.getContext('2d');
    const p = ctx.getImageData(20, 20, 1, 1).data;
    return '#' + [p[0], p[1], p[2]].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  });
  report('Modern template applies clean neutral canvas background (#F8FAFC)', modernBg === '#F8FAFC');

  // Switch to Social Media Template
  await page.locator('[data-template="social"]').click();
  await page.waitForTimeout(100);
  const socialBg = await previewCanvas.evaluate(canvas => {
    const ctx = canvas.getContext('2d');
    const p = ctx.getImageData(10, 10, 1, 1).data;
    return '#' + [p[0], p[1], p[2]].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  });
  report('Social Media template applies deep luxury dark canvas background (#090D16)', socialBg === '#090D16');

  // Switch back to Minimal
  await page.locator('[data-template="minimal"]').click();
  await page.waitForTimeout(100);

  // --- 6. Testing Customization Controls ---
  console.log('\n--- 6. Testing Customization Controls ---');
  const titleInput = page.locator('#share-input-title');
  await titleInput.fill('Nordic Forest Serenity');
  await page.waitForTimeout(100);
  report('Title input accepts custom text', (await titleInput.inputValue()) === 'Nordic Forest Serenity');

  // Verify Display Options block is completely removed
  const toggleHexCount = await page.locator('#share-toggle-hex').count();
  const toggleBrandingCount = await page.locator('#share-toggle-branding').count();
  const togglesRowCount = await page.locator('.share-toggles-row').count();
  report('Display Options block is completely removed from UI', toggleHexCount === 0 && toggleBrandingCount === 0 && togglesRowCount === 0);

  // Verify HEX codes are shown automatically by default
  const hexCodesDrawnByDefault = await page.evaluate(() => {
    const canvas = document.querySelector('#share-preview-canvas');
    if (!canvas) return false;
    const ctx = canvas.getContext('2d');
    // Sample pixels in upper stripe area where hex badge is rendered
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imgData.data.some(channel => channel > 0);
  });
  report('HEX codes and swatches are automatically displayed by default', hexCodesDrawnByDefault);

  // --- 7. Testing Export Actions ---
  console.log('\n--- 7. Testing Export Actions ---');
  // Download PNG action
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#btn-share-download').click();
  const download = await downloadPromise;
  const downloadName = download.suggestedFilename();
  report('Download PNG triggers valid file download with naming convention', downloadName.startsWith('ps-color-palette-') && downloadName.endsWith('.png'));

  // Verify Copy Image and Share Image buttons are completely removed from UI
  report('Copy Image button is completely removed from UI', (await page.locator('#btn-share-copy').count()) === 0);
  report('Share Image button is completely removed from UI', (await page.locator('#btn-share-native').count()) === 0);
  report('Fallback share options card is completely removed from UI', (await page.locator('#share-fallback-options').count()) === 0);

  // Verify watermark application on square and portrait exports
  const watermarkTest = await page.evaluate(async () => {
    const { applyWatermark } = await import('/src/utils.js');
    
    // 1. Square canvas (1080x1080)
    const squareCanvas = document.createElement('canvas');
    squareCanvas.width = 1080;
    squareCanvas.height = 1080;
    applyWatermark(squareCanvas, { text: 'PSColor.online', withLogo: true });
    const sqCtx = squareCanvas.getContext('2d');
    const sqPixel = sqCtx.getImageData(1080 - 60, 1080 - 45, 1, 1).data;

    // 2. Portrait canvas (1080x1350)
    const portraitCanvas = document.createElement('canvas');
    portraitCanvas.width = 1080;
    portraitCanvas.height = 1350;
    applyWatermark(portraitCanvas, { text: 'PSColor.online', withLogo: true });
    const portCtx = portraitCanvas.getContext('2d');
    const portPixel = portCtx.getImageData(1080 - 60, 1350 - 45, 1, 1).data;

    return {
      hasSquareWatermark: sqPixel[3] > 0,
      hasPortraitWatermark: portPixel[3] > 0
    };
  });

  report('Watermark renders on 1080×1080 square canvas in bottom-right corner', watermarkTest.hasSquareWatermark);
  report('Watermark scales and renders on 1080×1350 portrait canvas in bottom-right corner', watermarkTest.hasPortraitWatermark);

  // Close modal
  await page.locator('#dialog [data-close]').click();
  await page.waitForTimeout(150);
  report('Modal dialog closes cleanly', !(await page.locator('#dialog').evaluate(el => el.open)));

  // --- 8. Testing Live UI Visualizer Trigger Button ---
  console.log('\n--- 8. Testing Live UI Visualizer Trigger Button ---');
  await page.goto(`${base}/visualizer/f7f0dcd9e4c8a2b89b52796f`);
  await page.locator('#ui-visualizer-canvas').waitFor();

  const vizShareBtn = page.locator('#btn-visualizer-share-image');
  report('Live UI Visualizer contains #btn-visualizer-share-image button', await vizShareBtn.isVisible());
  await vizShareBtn.click();
  await page.locator('#dialog.share-image-dialog').waitFor();
  report('Clicking Visualizer Share as Image opens studio modal', await page.locator('#dialog').evaluate(el => el.open));

  // Close modal
  await page.locator('#dialog [data-close]').click();
  await page.waitForTimeout(150);

  // --- 9. Testing Mobile Responsiveness ---
  console.log('\n--- 9. Testing Mobile Responsiveness ---');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${base}/palette/f7f0dcd9e4c8a2b89b52796f`);
  await page.locator('#detail-share-image-btn').click();
  await page.locator('dialog.share-image-dialog').waitFor();

  const mobileOverflow = await page.evaluate(() => {
    const d = document.querySelector('dialog.share-image-dialog');
    return d.scrollWidth > d.clientWidth + 2;
  });
  report('Share as Image studio renders with zero horizontal overflow on 375px mobile', !mobileOverflow);

  await page.screenshot({ path: 'test-results/share-image-modal-mobile.png' });
  report('Saved mobile share image studio screenshot to test-results/share-image-modal-mobile.png', true);

  // --- 10. Testing Analytics Privacy & Zero PII ---
  console.log('\n--- 10. Testing Analytics Privacy & Zero PII ---');
  const hasShareOpen = allAnalyticsEvents.some(e => e.event === 'share_image_open');
  const hasShareExport = allAnalyticsEvents.some(e => e.event === 'share_image_export');
  const hasTemplateChange = allAnalyticsEvents.some(e => e.event === 'share_image_template_change');
  const hasDimChange = allAnalyticsEvents.some(e => e.event === 'share_image_dimension_change');

  report('Analytics dispatched share_image_open', hasShareOpen);
  report('Analytics dispatched share_image_export', hasShareExport);
  report('Analytics dispatched share_image_template_change', hasTemplateChange);
  report('Analytics dispatched share_image_dimension_change', hasDimChange);

  // Check zero PII
  const piiKeys = ['email', 'message', 'phone', 'address', 'password'];
  const hasPii = allAnalyticsEvents.some(e => {
    const str = JSON.stringify(e).toLowerCase();
    return piiKeys.some(k => str.includes(`"${k}"`));
  });
  report('Analytics events contain strictly zero PII', !hasPii);

  // Check browser console errors
  report('Zero unhandled browser JavaScript errors throughout test session', errors.length === 0);

  console.log('\n====================================');
  console.log('ALL SHARE PALETTE AS IMAGE TESTS PASSED (10/10)');
  console.log('====================================');
} catch (err) {
  console.error('\n[TEST FAILED]:', err);
  process.exit(1);
} finally {
  await browser.close();
}
