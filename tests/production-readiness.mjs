import { chromium } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

console.log('====================================');
console.log('PS COLOR PRODUCTION READINESS TEST');
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

// 1. Filesystem SEO & Build Artifacts
console.log('--- 1. Testing Static SEO & Prerender Build Artifacts ---');
const robotsPath = 'public/robots.txt';
report('robots.txt exists in public directory', existsSync(robotsPath));
if (existsSync(robotsPath)) {
  const robots = readFileSync(robotsPath, 'utf-8');
  report('robots.txt contains sitemap declaration', robots.includes('sitemap.xml'));
}

const sitemapPath = 'public/sitemap.xml';
report('sitemap.xml exists in public directory', existsSync(sitemapPath));
if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, 'utf-8');
  const urlCount = (sitemap.match(/<loc>/g) || []).length;
  report('sitemap.xml contains full indexed catalog (>= 700 URLs)', urlCount >= 700, `${urlCount} URLs indexed`);
}

const samplePrerender = 'dist/palette/f7f0dcd9e4c8a2b89b52796f/index.html';
report('Static prerendered HTML exists for sample palette in dist/', existsSync(samplePrerender));
if (existsSync(samplePrerender)) {
  const prerenderHtml = readFileSync(samplePrerender, 'utf-8');
  report('Prerendered HTML contains custom title', prerenderHtml.includes('Palette #F7F0DC'));
  report('Prerendered HTML contains canonical link', prerenderHtml.includes('canonical'));
  report('Prerendered HTML contains Open Graph preview image', prerenderHtml.includes('og:image'));
  report('Prerendered HTML contains VisualArtwork JSON-LD schema', prerenderHtml.includes('VisualArtwork'));
}

// 2. Browser Runtime Verification
console.log('\n--- 2. Testing Browser Runtime SEO, SPA Routing, and Analytics ---');
const localBrowser = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe');
const browser = await chromium.launch({ headless: true, ...(localBrowser && existsSync(localBrowser) ? { executablePath: localBrowser } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', err => pageErrors.push(err.message));

const base = process.env.TEST_URL || 'http://localhost:5173';

try {
  // Capture custom analytics events in browser
  await page.addInitScript(() => {
    window.__analyticsEvents = [];
    window.addEventListener('ps-color-analytics', e => {
      window.__analyticsEvents.push(e.detail);
    });
  });

  // 2.1 Homepage SEO & Metadata
  await page.goto(base);
  await page.locator('.palette-card').first().waitFor();
  const homeTitle = await page.title();
  report('Homepage title contains PS color brand tagline', homeTitle.includes('PS color'));

  const homeDesc = await page.locator('meta[name="description"]').getAttribute('content');
  report('Homepage meta description is non-empty', Boolean(homeDesc) && homeDesc.length > 20);

  const homeCanonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  report('Homepage canonical link is correctly set', Boolean(homeCanonical));

  // 2.2 Direct Access to /palette/:id (Deep Linking)
  const testPaletteId = 'f7f0dcd9e4c8a2b89b52796f';
  await page.goto(`${base}/palette/${testPaletteId}`);
  await page.locator('.detail').waitFor();

  const paletteTitle = await page.title();
  report('Direct deep-linked palette detail page sets palette-specific title', paletteTitle.includes('#F7F0DC'), paletteTitle);

  const paletteCanonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  report('Detail page updates canonical link to exact palette path', paletteCanonical?.includes(`/palette/${testPaletteId}`));

  const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
  report('Detail page generates dynamic Open Graph SVG image', Boolean(ogImage) && ogImage.includes('svg'));

  const schemaJson = await page.locator('script[type="application/ld+json"]').innerText();
  let parsedSchema;
  try {
    parsedSchema = JSON.parse(schemaJson);
  } catch {
    parsedSchema = null;
  }
  report('Detail page renders valid Schema.org VisualArtwork structured data', parsedSchema && parsedSchema['@type'] === 'VisualArtwork');

  // 2.3 Analytics event tracking for user interactions
  // Swatch copy
  await page.locator('.color-row').first().click();
  await page.waitForTimeout(200);

  // Export code modal
  await page.locator('[data-open-export]').click();
  await page.locator('.code-modal-header').waitFor();
  await page.locator('#code-tab-tailwind button').click();
  await page.keyboard.press('Escape');

  const events = await page.evaluate(() => window.__analyticsEvents || []);
  const hasViewEvent = events.some(e => e.event === 'view_item');
  const hasCopyEvent = events.some(e => e.event === 'copy_color');
  const hasExportEvent = events.some(e => e.event === 'export_code');

  report('Analytics tracks palette view (view_item) event', hasViewEvent);
  report('Analytics tracks color copy (copy_color) event', hasCopyEvent);
  report('Analytics tracks code export (export_code) event', hasExportEvent);

  // 2.4 Privacy Policy & Telemetry Consent Toggle
  await page.locator('#menu-toggle').click();
  await page.locator('#menu [data-route="/privacy"]').click();
  await page.locator('#toggle-consent').waitFor();

  const initialStatus = await page.locator('#consent-status-text').innerText();
  await page.locator('#toggle-consent').click();
  const toggledStatus = await page.locator('#consent-status-text').innerText();
  report('Privacy Policy allows toggling telemetry consent on/off', initialStatus !== toggledStatus, `from "${initialStatus}" to "${toggledStatus}"`);

  // 2.5 Console & Runtime errors
  report('Zero unhandled JavaScript errors during production readiness checks', pageErrors.length === 0, pageErrors.join('; '));

} finally {
  await browser.close();
}

console.log('\n====================================');
console.log(`PRODUCTION READINESS SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('====================================');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}
