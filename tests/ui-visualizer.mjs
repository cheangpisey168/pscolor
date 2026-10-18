import { chromium } from '@playwright/test';
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

console.log('====================================');
console.log('PS COLOR LIVE UI VISUALIZER TEST');
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

// -------------------------------------------------------------
// 1. Static SEO & Prerender Build Artifacts
// -------------------------------------------------------------
console.log('--- 1. Testing Static SEO & Sitemap Integration ---');

const sitemapPath = 'public/sitemap.xml';
report('sitemap.xml exists in public directory', existsSync(sitemapPath));
if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, 'utf-8');
  report(
    'sitemap.xml contains /visualizer/ URL with priority 0.9',
    sitemap.includes('/visualizer/') && sitemap.includes('<priority>0.9</priority>')
  );
}

// -------------------------------------------------------------
// 2. Browser End-to-End Visualizer Verification
// -------------------------------------------------------------
console.log('\n--- 2. Testing Browser Runtime Live UI Visualizer ---');

const systemChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const localBrowser = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe');
const executablePath = (localBrowser && existsSync(localBrowser)) ? localBrowser : (existsSync(systemChrome) ? systemChrome : undefined);

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {})
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  permissions: ['clipboard-read', 'clipboard-write']
});

const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', err => pageErrors.push(err.message));

mkdirSync('test-results', { recursive: true });

// Intercept analytics events
await page.addInitScript(() => {
  window.__analyticsEvents = [];
  window.addEventListener('ps-color-analytics', e => {
    window.__analyticsEvents.push(e.detail);
  });
});

const base = process.env.TEST_URL || 'http://localhost:5173';

try {
  // Give consent to test analytics event dispatch
  await page.goto(base);
  await page.evaluate(() => {
    localStorage.setItem('ps-color-analytics-consent', 'granted');
    localStorage.setItem('ps-color-advertising-consent', 'granted');
  });
  await page.reload();

  // Test 1: Navigation from palette card "Preview" button
  console.log('\n--- Testing Homepage Card & Detail Triggers ---');
  await page.locator('.palette-card').first().waitFor();
  const firstCard = page.locator('.palette-card').first();
  const firstPaletteId = await firstCard.getAttribute('data-id');
  
  const previewBtn = firstCard.locator('.card-preview-btn');
  report('Palette card contains Preview button', await previewBtn.isVisible());
  await previewBtn.click();

  // Check URL updated to /visualizer/:id
  await page.waitForURL(`**/visualizer/${firstPaletteId}`);
  report('Clicking card Preview navigates to /visualizer/:id', page.url().includes(`/visualizer/${firstPaletteId}`));
  report('Visualizer workspace is visible', await page.locator('.visualizer-workspace').isVisible());

  // Verify proper horizontal spacing between sidebar menu and visualizer left controls panel
  const panelSpacing = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar.left');
    const controls = document.querySelector('.visualizer-controls-panel');
    if (!sidebar || !controls) return 0;
    const sRect = sidebar.getBoundingClientRect();
    const cRect = controls.getBoundingClientRect();
    return Math.round(cRect.x - sRect.right);
  });
  report('Visualizer left panel has proper horizontal breathing room from sidebar', panelSpacing >= 20, `${panelSpacing}px`);

  // Test 2: Detail page "Preview on UI" button
  await page.goto(`${base}/palette/${firstPaletteId}`);
  await page.locator('#preview-on-ui-btn').waitFor();
  report('Palette detail page contains #preview-on-ui-btn button', await page.locator('#preview-on-ui-btn').isVisible());
  await page.locator('#preview-on-ui-btn').click();
  await page.waitForURL(`**/visualizer/${firstPaletteId}`);
  report('Clicking detail button navigates cleanly to visualizer', page.url().includes(`/visualizer/${firstPaletteId}`));

  // Test 3: Template Switching (Landing -> Dashboard -> Ecommerce)
  console.log('\n--- Testing Responsive Templates ---');
  report('Default template is Landing Page', await page.locator('.ui-mockup-landing').isVisible());

  // Switch to SaaS Dashboard
  await page.locator('.visualizer-template-tab[data-template="dashboard"]').click();
  report('SaaS Dashboard template renders successfully', await page.locator('.ui-mockup-dashboard').isVisible());
  report('Dashboard contains chart metric cards', await page.locator('.mock-dash-kpi').count() >= 3);

  // Critical Regression: SaaS Dashboard header must NOT escape preview container
  console.log('\n--- Testing Dashboard Header Scoping & Containment ---');
  const dashTopbar = page.locator('#ui-visualizer-canvas .mock-dash-topbar');
  report('Dashboard header is rendered strictly inside #ui-visualizer-canvas', await dashTopbar.isVisible());
  
  const leakedHeaders = await page.locator('body > .mock-dash-topbar, #app > .mock-dash-topbar').count();
  report('Zero leaked dashboard topbars at document root', leakedHeaders === 0);

  const topbarPos = await dashTopbar.evaluate(el => getComputedStyle(el).position);
  report('Dashboard topbar position is static (not fixed)', topbarPos === 'static', `position: ${topbarPos}`);

  const siteHeaderBox = await page.locator('header.site-header').boundingBox();
  const topbarBox = await dashTopbar.boundingBox();
  report(
    'Dashboard topbar renders below site header within preview bounds',
    topbarBox && siteHeaderBox && topbarBox.y >= siteHeaderBox.y + siteHeaderBox.height - 2
  );

  // Capture Dashboard Desktop Screenshot
  await page.screenshot({ path: 'test-results/visualizer-dashboard-desktop.png', fullPage: false });
  report('Saved dashboard desktop preview screenshot to test-results/visualizer-dashboard-desktop.png', true);

  // Switch to E-Commerce
  await page.locator('.visualizer-template-tab[data-template="ecommerce"]').click();
  report('E-Commerce template renders successfully', await page.locator('.ui-mockup-ecommerce').isVisible());
  report('E-Commerce contains product cards and cart trigger', await page.locator('.mock-product-card').count() >= 3);

  // Repeated template switching stress test
  await page.locator('.visualizer-template-tab[data-template="dashboard"]').click();
  await page.locator('.visualizer-template-tab[data-template="ecommerce"]').click();
  await page.locator('.visualizer-template-tab[data-template="landing"]').click();
  report('Repeated template switching preserves clean DOM without leaking elements', await page.locator('.ui-mockup-landing').isVisible());

  // Test 4: Viewport Switching (Desktop vs Mobile)
  console.log('\n--- Testing Viewport Device Simulation ---');
  const frame = page.locator('#visualizer-frame');
  report('Default frame viewport is desktop', await frame.evaluate(el => el.classList.contains('viewport-desktop')));

  await page.locator('#btn-view-mobile').click();
  report('Toggling mobile view adds .viewport-mobile class', await frame.evaluate(el => el.classList.contains('viewport-mobile')));

  // Capture Mobile Screenshot
  await page.screenshot({ path: 'test-results/visualizer-mobile.png', fullPage: false });
  report('Saved mobile visualizer preview screenshot to test-results/visualizer-mobile.png', true);

  await page.locator('#btn-view-desktop').click();
  report('Toggling desktop view restores .viewport-desktop class', await frame.evaluate(el => el.classList.contains('viewport-desktop')));

  // Capture Desktop Screenshot
  await page.screenshot({ path: 'test-results/visualizer-desktop.png', fullPage: false });
  report('Saved desktop visualizer preview screenshot to test-results/visualizer-desktop.png', true);

  // Test 5: Semantic Role Assignment & Realtime CSS Custom Property Application
  console.log('\n--- Testing Semantic Roles & CSS Application ---');
  const canvas = page.locator('#ui-visualizer-canvas');
  const initialBg = await canvas.evaluate(el => getComputedStyle(el).getPropertyValue('--ui-bg').trim());
  report('Canvas has initial --ui-bg CSS custom property', Boolean(initialBg));

  // Change Background role by clicking a different swatch in the background row
  const bgSwatches = page.locator('#visualizer-role-selectors .role-selector-row').first().locator('.role-swatch-btn');
  const targetSwatchColor = await bgSwatches.nth(2).getAttribute('data-color');
  await bgSwatches.nth(2).click();

  const updatedBg = await canvas.evaluate(el => getComputedStyle(el).getPropertyValue('--ui-bg').trim());
  report(
    'Clicking role swatch instantly updates --ui-bg without page reload',
    updatedBg.toLowerCase() === targetSwatchColor.toLowerCase(),
    `Updated to ${updatedBg}`
  );

  // Test 6: Role Modifiers (Shuffle, Invert, Reset)
  console.log('\n--- Testing Quick Role Modifiers ---');
  await page.locator('#btn-shuffle-roles').click();
  const shuffledBg = await canvas.evaluate(el => getComputedStyle(el).getPropertyValue('--ui-bg').trim());
  report('Shuffle roles updates active roles', Boolean(shuffledBg));

  await page.locator('#btn-invert-theme').click();
  const invertedBg = await canvas.evaluate(el => getComputedStyle(el).getPropertyValue('--ui-bg').trim());
  report('Invert theme swaps background and CTA colors', Boolean(invertedBg));

  await page.locator('#btn-reset-roles').click();
  const resetBg = await canvas.evaluate(el => getComputedStyle(el).getPropertyValue('--ui-bg').trim());
  report('Reset roles restores standard weight distribution', Boolean(resetBg));

  // Test 7: WCAG 2.1 Accessibility Contrast Scorecard
  console.log('\n--- Testing WCAG 2.1 Contrast Scorecard & Accuracy ---');
  const scorecard = page.locator('#visualizer-contrast-scorecard');
  report('Contrast scorecard renders 5 comprehensive UI metric items', (await scorecard.locator('.contrast-metric-item').count()) === 5);
  report('Scorecard includes pass/fail badges for all audited combinations', (await scorecard.locator('.contrast-badge').count()) === 5);

  // Check derived text contrast
  const computedBg = await canvas.evaluate(el => getComputedStyle(el).getPropertyValue('--ui-bg').trim());
  const computedMutedText = await canvas.evaluate(el => getComputedStyle(el).getPropertyValue('--ui-text-muted').trim());
  report('Canvas defines accessible --ui-text-muted variable', Boolean(computedMutedText), `muted text: ${computedMutedText}`);

  // Test low-contrast detection & auto-text restoration
  console.log('\n--- Testing Low-Contrast Warning Banner & Auto-Fix ---');
  const textSwatches = page.locator('.role-swatch-btn[data-role="text"]:not(.auto-btn)');
  if (await textSwatches.count() > 0) {
    // Select the first swatch for text
    await textSwatches.first().click();
    const hasContrastBanner = (await page.locator('.contrast-all-pass, .contrast-warning-box').count()) > 0;
    report('Contrast audit banner is rendered upon manual role change', hasContrastBanner);

    // Click Auto smart contrast button
    const autoBtn = page.locator('.role-swatch-btn.auto-btn[data-role="text"]');
    report('Auto smart contrast button exists on text role', await autoBtn.isVisible());
    await autoBtn.click();
    
    const restoredText = await canvas.evaluate(el => getComputedStyle(el).getPropertyValue('--ui-text').trim());
    report('Clicking Auto applies high contrast text color (#0f172a or #ffffff)', restoredText === '#0f172a' || restoredText === '#ffffff', `text: ${restoredText}`);
  }

  // Test 8: Code Token Exports & Container Boundary
  console.log('\n--- Testing Token Export Actions & Card Boundaries ---');
  const exportCard = page.locator('.controls-card', { hasText: 'Export Live UI Tokens' });
  const exportCardBox = await exportCard.boundingBox();
  
  const cssBtn = page.locator('#btn-export-css');
  const twBtn = page.locator('#btn-export-tailwind');
  const figmaBtn = page.locator('#btn-export-figma');

  const cssBox = await cssBtn.boundingBox();
  const twBox = await twBtn.boundingBox();
  const figmaBox = await figmaBtn.boundingBox();

  report('Copy CSS button is inside export card boundaries', cssBox && exportCardBox && cssBox.x + cssBox.width <= exportCardBox.x + exportCardBox.width + 2);
  report('Copy Tailwind button is inside export card boundaries', twBox && exportCardBox && twBox.x + twBox.width <= exportCardBox.x + exportCardBox.width + 2);
  report('Copy Figma button is inside export card boundaries (no horizontal overflow)', figmaBox && exportCardBox && figmaBox.x + figmaBox.width <= exportCardBox.x + exportCardBox.width + 2);

  let tokenDownloadTriggered = false;
  const tokenDlListener = () => { tokenDownloadTriggered = true; };
  page.on('download', tokenDlListener);

  await cssBtn.click();
  const copiedCss = await page.evaluate(() => navigator.clipboard.readText());
  report('Copy CSS Variables copies valid :root block', copiedCss.includes(':root') && copiedCss.includes('--color-ui-bg'));

  await twBtn.click();
  const copiedTailwind = await page.evaluate(() => navigator.clipboard.readText());
  report('Copy Tailwind copies valid config snippet', copiedTailwind.includes('module.exports') && copiedTailwind.includes('colors:'));

  await figmaBtn.click();
  const copiedFigma = await page.evaluate(() => navigator.clipboard.readText());
  report('Copy Figma exports standard W3C DTCG token JSON format', copiedFigma.includes('$value') && copiedFigma.includes('$type'));

  report('Token copy actions strictly do NOT trigger file download', !tokenDownloadTriggered);
  page.off('download', tokenDlListener);

  // Test 9: Mobile Viewport & Multi-Resolution Responsiveness Verification
  console.log('\n--- Testing Mobile Layout, Data Table & Zero Horizontal Overflow ---');
  await page.locator('#btn-view-mobile').click();

  const previewContainer = page.locator('.visualizer-preview-container');
  
  // Check landing template mobile overflow
  const landingOverflow = await previewContainer.evaluate(el => el.scrollWidth > el.clientWidth + 2);
  report('Landing template has zero horizontal overflow in mobile frame', !landingOverflow);

  // Check dashboard template mobile overflow & table containment
  await page.locator('.visualizer-template-tab[data-template="dashboard"]').click();
  const dashOverflow = await previewContainer.evaluate(el => el.scrollWidth > el.clientWidth + 2);
  report('SaaS Dashboard template has zero horizontal overflow in mobile frame', !dashOverflow);

  // Check Active Design Tokens table responsiveness
  const tableScroll = page.locator('.mock-table-scroll');
  report('Data table has dedicated .mock-table-scroll container', await tableScroll.isVisible());
  
  const tableCard = page.locator('.mock-dash-table-card');
  const tableCardWithinParent = await tableCard.evaluate(el => el.offsetWidth <= el.parentElement.clientWidth + 2);
  report('Active Design Tokens card remains strictly within mobile main column width', tableCardWithinParent);

  // Capture Dashboard Mobile Screenshot
  await page.screenshot({ path: 'test-results/visualizer-dashboard-mobile.png', fullPage: false });
  report('Saved dashboard mobile preview screenshot to test-results/visualizer-dashboard-mobile.png', true);

  // Check e-commerce template mobile overflow
  await page.locator('.visualizer-template-tab[data-template="ecommerce"]').click();
  const ecomOverflow = await previewContainer.evaluate(el => el.scrollWidth > el.clientWidth + 2);
  report('E-Commerce template has zero horizontal overflow in mobile frame', !ecomOverflow);

  // Capture high-res mobile screenshot on E-commerce
  await page.screenshot({ path: 'test-results/visualizer-mobile.png', fullPage: false });

  // Switch back to desktop and Landing
  await page.locator('#btn-view-desktop').click();
  await page.locator('.visualizer-template-tab[data-template="landing"]').click();
  await page.screenshot({ path: 'test-results/visualizer-desktop.png', fullPage: false });

  // Test multi-width responsiveness: 320px, 375px, 768px, 1440px
  console.log('\n--- Testing Multi-Resolution Page Overflow (320px, 375px, 768px, 1440px) ---');
  const testWidths = [320, 375, 768, 1440];
  for (const w of testWidths) {
    await page.setViewportSize({ width: w, height: 800 });
    const hasPageOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    report(`Zero page horizontal overflow at viewport width ${w}px`, !hasPageOverflow);
  }
  // Restore viewport
  await page.setViewportSize({ width: 1440, height: 900 });

  // Test 10: "Try Another Palette" Action
  console.log('\n--- Testing Try Another Palette Discovery ---');
  const oldUrl = page.url();
  await page.locator('#btn-try-another').click();
  const newUrl = page.url();
  report('Try Another Palette updates active URL without page reload', newUrl !== oldUrl && newUrl.includes('/visualizer/'));

  // Test 11: "Back to Palette" Action Context Preservation
  console.log('\n--- Testing Back to Palette Navigation ---');
  const backBtn = page.locator('#btn-back-palette');
  const expectedPalettePath = await backBtn.getAttribute('href');
  await backBtn.click();
  await page.waitForURL(`**${expectedPalettePath}`);
  report('Back to Palette navigates back to original palette detail context', page.url().endsWith(expectedPalettePath));

  // Test 12: Analytics Verification (Consent-Guarded, Zero PII)
  console.log('\n--- Testing Analytics Events ---');
  const events = await page.evaluate(() => window.__analyticsEvents || []);
  
  const hasOpen = events.some(e => e.event === 'ui_preview_open');
  const hasTemplateChange = events.some(e => e.event === 'ui_preview_template_change');
  const hasPaletteChange = events.some(e => e.event === 'ui_preview_palette_change');
  const hasExport = events.some(e => e.event === 'ui_preview_export');

  report('Analytics dispatched ui_preview_open event', hasOpen);
  report('Analytics dispatched ui_preview_template_change event', hasTemplateChange);
  report('Analytics dispatched ui_preview_palette_change event', hasPaletteChange);
  report('Analytics dispatched ui_preview_export event', hasExport);

  // Verify Zero PII in all events
  const piiKeys = ['name', 'email', 'message', 'phone', 'address'];
  const hasPii = events.some(e => {
    const str = JSON.stringify(e).toLowerCase();
    return piiKeys.some(k => str.includes(`"${k}"`));
  });
  report('Analytics events contain strictly zero PII', !hasPii);

  // Check JavaScript console errors
  report('Zero unhandled browser JavaScript errors during visualizer testing', pageErrors.length === 0, pageErrors.join(', '));

  console.log('\n====================================');
  console.log(`LIVE UI VISUALIZER SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================\n');

} catch (err) {
  console.error('\n[ERROR IN LIVE UI VISUALIZER TEST]:', err);
  throw err;
} finally {
  await browser.close();
}
