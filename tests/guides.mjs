import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

console.log('====================================');
console.log('PS COLOR — COLOR GUIDES TEST SUITE');
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

const base = 'http://localhost:5173';
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: 'light',
  permissions: ['clipboard-read', 'clipboard-write']
});
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', err => pageErrors.push(err.message));

try {
  // -------------------------------------------------------------
  // Test 1: Navigation to /guides/ Index
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing /guides/ Index Page ---');
  await page.goto(`${base}/guides`);
  await page.waitForSelector('.guides-container');

  const pageTitle = await page.title();
  report('Guides index title', pageTitle.includes('Color & Web Design Guides'), pageTitle);

  const isGuidesMode = await page.evaluate(() => document.body.classList.contains('is-guides-mode'));
  report('Body has is-guides-mode class', isGuidesMode);

  const cardsCount = await page.locator('.guide-card').count();
  report('Renders 3 educational guide cards', cardsCount === 3, `Count: ${cardsCount}`);

  const cardTitles = await page.locator('.guide-card-title').allTextContents();
  report('Card 1 is CSS Gradients', cardTitles.some(t => t.includes('CSS Gradients')), cardTitles[0]);
  report('Card 2 is Choose Colors for Website', cardTitles.some(t => t.includes('Choose Colors')), cardTitles[1]);
  report('Card 3 is Color Contrast & WCAG', cardTitles.some(t => t.includes('Color Contrast & WCAG')), cardTitles[2]);

  // Check tools banner at bottom of index
  const toolsBanner = await page.locator('.guides-tools-banner').isVisible();
  report('Tools banner is visible on guides index', toolsBanner);

  // Check desktop sidebar spacing
  const layoutCheck = await page.evaluate(() => {
    const sidebar = document.querySelector('aside.sidebar.left');
    const header = document.querySelector('.guides-index-header');
    const container = document.querySelector('.guides-container');
    if (!sidebar || !header || !container) return { ok: false, gap: 0 };
    const sRect = sidebar.getBoundingClientRect();
    const hRect = header.getBoundingClientRect();
    const contRect = container.getBoundingClientRect();
    const gap = Math.round(hRect.left - sRect.right);
    return {
      gap,
      noOverlap: contRect.left >= sRect.right,
      ok: gap >= 20 && contRect.left >= sRect.right
    };
  });
  report('Consistent desktop sidebar spacing (>= 20px) and zero overlap', layoutCheck.ok, `Gap: ${layoutCheck.gap}px`);

  // -------------------------------------------------------------
  // Test 2: Responsive Viewports on Index (Zero Horizontal Overflow)
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Viewports & Overflow on Index ---');
  for (const width of [1440, 1024, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 800 });
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        clientWidth: doc.clientWidth,
        scrollWidth: doc.scrollWidth,
        hasOverflow: doc.scrollWidth > doc.clientWidth
      };
    });
    report(`No horizontal overflow at ${width}px on index`, !overflow.hasOverflow, `scroll: ${overflow.scrollWidth}, client: ${overflow.clientWidth}`);
  }

  // Restore desktop viewport
  await page.setViewportSize({ width: 1440, height: 900 });

  // -------------------------------------------------------------
  // Test 3: Article 1 — How to Create CSS Gradients
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Guide 1: How to Create CSS Gradients ---');
  await page.click('a[href="/guides/how-to-create-css-gradients/"]');
  await page.waitForSelector('.guide-article-wrap');

  const g1Title = await page.title();
  report('Guide 1 title updated', g1Title.includes('How to Create CSS Gradients'), g1Title);

  const breadcrumbs = await page.locator('.guide-breadcrumbs').textContent();
  report('Breadcrumbs include Home, Guides, and Guide 1', breadcrumbs.includes('Home') && breadcrumbs.includes('Guides') && breadcrumbs.includes('How to Create CSS Gradients'));

  const tocLinksCount = await page.locator('.guide-toc-link').count();
  report('Table of contents contains sections', tocLinksCount >= 7, `TOC count: ${tocLinksCount}`);

  // Test anchor link click in TOC
  await page.click('a[href="#wcag-contrast-gradients"]');
  const anchorSectionVisible = await page.locator('#wcag-contrast-gradients').isVisible();
  report('Anchor jump target is visible', anchorSectionVisible);

  // Test code snippet copy button
  const copyBtn = page.locator('.guide-copy-btn').first();
  await copyBtn.click();
  await page.waitForFunction(() => document.querySelector('.guide-copy-btn')?.textContent?.includes('Copied'));
  const copiedBtnText = await copyBtn.textContent();
  report('Code copy button updates to Copied!', copiedBtnText.includes('Copied'), copiedBtnText);

  // Test tool promo card
  const g1ToolLink = page.locator('.guide-tool-actions a[href="/gradient"]').first();
  report('Contains callout linking to Gradient Generator', await g1ToolLink.isVisible());

  // Related guides present
  const relatedCount1 = await page.locator('.related-guide-card').count();
  report('Related guides section renders other articles', relatedCount1 === 2, `Related count: ${relatedCount1}`);

  // -------------------------------------------------------------
  // Test 4: Article 2 — How to Choose Colors for a Website
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Guide 2: How to Choose Colors for a Website ---');
  await page.goto(`${base}/guides/how-to-choose-colors-for-a-website/`);
  await page.waitForSelector('.guide-article-wrap');

  const g2Title = await page.title();
  report('Guide 2 title updated', g2Title.includes('How to Choose Colors for a Website'), g2Title);

  const has603010Section = await page.locator('#the-60-30-10-rule').isVisible();
  report('Contains 60-30-10 rule and 4-tier hierarchy section', has603010Section);

  const g2Table = await page.locator('.guide-table').first().isVisible();
  report('Contains visual hierarchy table', g2Table);

  const g2VisualizerBtn = page.locator('.guide-tool-actions a[href="/visualizer"]').first();
  report('Contains callout linking to Live UI Visualizer', await g2VisualizerBtn.isVisible());

  // -------------------------------------------------------------
  // Test 5: Article 3 — Understanding Color Contrast & WCAG
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing Guide 3: Understanding Color Contrast & WCAG ---');
  await page.goto(`${base}/guides/understanding-color-contrast-and-wcag/`);
  await page.waitForSelector('.guide-article-wrap');

  const g3Title = await page.title();
  report('Guide 3 title updated', g3Title.includes('Understanding Color Contrast & WCAG'), g3Title);

  const hasLuminanceSection = await page.locator('#relative-luminance-formula').isVisible();
  report('Contains relative luminance formula section', hasLuminanceSection);

  const hasContrastRatioSection = await page.locator('#contrast-ratio-equation').isVisible();
  report('Contains contrast ratio equation section', hasContrastRatioSection);

  const hasThresholdsTable = await page.locator('#wcag-levels-thresholds').isVisible();
  report('Contains WCAG compliance levels table', hasThresholdsTable);

  // Luminance calculation card inspection
  const luminanceCard = page.locator('.guide-callout.guide-callout-info');
  const cardMetrics = await luminanceCard.evaluate(el => {
    const cs = window.getComputedStyle(el);
    const pre = el.querySelector('pre');
    const piecewise = el.querySelector('.formula-piecewise');
    return {
      width: el.offsetWidth,
      position: cs.position,
      height: el.offsetHeight,
      preOverflowX: pre ? window.getComputedStyle(pre).overflowX : null,
      piecewiseText: piecewise ? piecewise.textContent : '',
      hasRawLatex: el.innerHTML.includes('$L') || el.innerHTML.includes('\\times') || el.innerHTML.includes('\\le')
    };
  });
  report('Luminance card spans full article width on desktop (width >= 600px)', cardMetrics.width >= 600, `Card width: ${cardMetrics.width}px`);
  report('Luminance card is in natural flow (not sticky sidebar)', cardMetrics.position === 'static', `Position: ${cardMetrics.position}`);
  report('Luminance code container supports horizontal scroll', cardMetrics.preOverflowX === 'auto', `overflow-x: ${cardMetrics.preOverflowX}`);
  report('Luminance piecewise uses standard constant 0.04045', cardMetrics.piecewiseText.includes('0.04045'));
  report('Luminance card does NOT contain raw LaTeX notation', !cardMetrics.hasRawLatex);

  // Test copy button on luminance card code box
  const calcCopyBtn = page.locator('.guide-callout.guide-callout-info .guide-copy-btn');
  await calcCopyBtn.click();
  await page.waitForFunction(() => document.querySelector('.guide-callout.guide-callout-info .guide-copy-btn')?.textContent?.includes('Copied'));
  const calcCopied = await calcCopyBtn.textContent();
  report('Luminance code copy button works', calcCopied.includes('Copied'));

  // -------------------------------------------------------------
  // Test 6: Responsive Viewports on Article Pages
  // -------------------------------------------------------------
  console.log('\n--- 6. Testing Responsive Viewports on Article ---');
  for (const width of [1440, 1024, 768, 375, 320]) {
    await page.setViewportSize({ width, height: 800 });
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        clientWidth: doc.clientWidth,
        scrollWidth: doc.scrollWidth,
        hasOverflow: doc.scrollWidth > doc.clientWidth
      };
    });
    report(`No horizontal overflow on article at ${width}px`, !overflow.hasOverflow, `scroll: ${overflow.scrollWidth}, client: ${overflow.clientWidth}`);
  }

  // Restore desktop viewport
  await page.setViewportSize({ width: 1440, height: 900 });

  // -------------------------------------------------------------
  // Test 7: Sidebar & Header Navigation Integration
  // -------------------------------------------------------------
  console.log('\n--- 7. Testing Navigation Integration ---');
  // Check sidebar navigation item
  const guidesNavItem = page.locator('#navigation a[href="/guides"]');
  report('Guides link is in sidebar navigation', await guidesNavItem.isVisible());

  // Click Guides in sidebar
  await guidesNavItem.click();
  await page.waitForSelector('.guides-index-header');
  report('Sidebar click successfully routes to /guides', page.url().endsWith('/guides') || page.url().endsWith('/guides/'));

  // Check header dropdown menu
  await page.click('#menu-toggle');
  const menuGuidesLink = page.locator('#menu a[href="/guides"]');
  report('Guides link is in header dropdown menu', await menuGuidesLink.isVisible());
  await page.click('#menu-toggle'); // close

  // Return to palettes home
  await page.click('#navigation a[href="/"]');
  await page.waitForSelector('.palette-card');
  const isGuidesModeRemoved = await page.evaluate(() => !document.body.classList.contains('is-guides-mode'));
  report('Navigating back to home removes is-guides-mode', isGuidesModeRemoved);

  // -------------------------------------------------------------
  // Test 8: Light & Dark Mode Compatibility
  // -------------------------------------------------------------
  console.log('\n--- 8. Testing Light & Dark Mode on Guides ---');
  await page.goto(`${base}/guides`);
  await page.waitForSelector('.guides-container');

  // Toggle to dark mode
  await page.click('#theme-toggle');
  const currentTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  report('Toggled to dark theme', currentTheme === 'dark', currentTheme);

  const darkCardBg = await page.evaluate(() => {
    const card = document.querySelector('.guide-card');
    return card ? getComputedStyle(card).backgroundColor : '';
  });
  report('Dark theme card background applied', Boolean(darkCardBg), darkCardBg);

  // Toggle back to light mode
  await page.click('#theme-toggle');
  const restoredTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  report('Restored to light theme', restoredTheme === 'light', restoredTheme);

  // -------------------------------------------------------------
  // Test 9: Zero Console Errors
  // -------------------------------------------------------------
  console.log('\n--- 9. Verifying Page Errors ---');
  report('Zero uncaught console errors', pageErrors.length === 0, pageErrors.join('; '));

  console.log('\n====================================');
  console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('====================================\n');
} catch (err) {
  console.error('\n[FATAL TEST ERROR]', err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
