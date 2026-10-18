import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

console.log('====================================');
console.log('PS COLOR ONE-CLICK DARK MODE TEST');
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
  // Clear localStorage before testing to ensure clean visitor state
  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('.palette-card').first().waitFor();

  // -------------------------------------------------------------
  // Test 1: First-Time Visitor & System Theme Baseline
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing Default Theme & Anti-FOUC ---');
  const initialPref = await page.evaluate(() => ({
    localStorageVal: localStorage.getItem('ps-color-theme'),
    htmlPrefAttr: document.documentElement.getAttribute('data-theme-preference'),
    htmlThemeAttr: document.documentElement.getAttribute('data-theme'),
    bodyBg: getComputedStyle(document.body).backgroundColor
  }));

  report('Default theme preference is system for new visitors', initialPref.htmlPrefAttr === 'system');
  report('Effective theme matches light OS scheme initially', initialPref.htmlThemeAttr === 'light');
  report('Theme toggle button is visible in header', await page.locator('#theme-toggle').isVisible());
  report('In Light Mode, theme toggle displays Moon icon', await page.locator('#theme-toggle .icon-moon').isVisible());
  report('Theme toggle aria-label indicates switch to dark', (await page.locator('#theme-toggle').getAttribute('aria-label')).includes('dark'));

  // -------------------------------------------------------------
  // Test 2: One-Click Theme Switching (Light -> Dark -> Light)
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing One-Click Theme Toggle ---');
  
  // Verify NO popover or dropdown exists
  report('No theme popover exists in DOM', (await page.locator('#theme-popover').count()) === 0);

  // One-Click 1: Click Moon icon -> switches immediately to Dark mode
  await page.locator('#theme-toggle').click();
  await page.waitForTimeout(100);

  let darkState = await page.evaluate(() => ({
    pref: document.documentElement.getAttribute('data-theme-preference'),
    theme: document.documentElement.getAttribute('data-theme'),
    storage: localStorage.getItem('ps-color-theme'),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    cardBg: getComputedStyle(document.querySelector('.palette-card')).backgroundColor,
    headerBg: getComputedStyle(document.querySelector('.site-header')).backgroundColor
  }));

  report('Clicking Moon icon switches directly to Dark mode', darkState.pref === 'dark' && darkState.theme === 'dark');
  report('Dark preference persisted in localStorage', darkState.storage === 'dark');
  report('In Dark Mode, theme toggle displays Sun icon', await page.locator('#theme-toggle .icon-sun').isVisible());
  report('Theme toggle aria-label indicates switch to light', (await page.locator('#theme-toggle').getAttribute('aria-label')).includes('light'));
  report('Dark mode page background applies dark token (#111318 rgb)', darkState.bodyBg === 'rgb(17, 19, 24)');
  report('Dark mode card background applies card token (#1B1E26 rgb)', darkState.cardBg === 'rgb(27, 30, 38)');

  // Capture Desktop Dark Mode Homepage Screenshot
  await page.screenshot({ path: 'test-results/desktop-dark.png', fullPage: false });
  report('Saved desktop dark mode homepage screenshot to test-results/desktop-dark.png', true);

  // One-Click 2: Click Sun icon -> switches immediately back to Light mode
  await page.locator('#theme-toggle').click();
  await page.waitForTimeout(100);

  let lightState = await page.evaluate(() => ({
    pref: document.documentElement.getAttribute('data-theme-preference'),
    theme: document.documentElement.getAttribute('data-theme'),
    storage: localStorage.getItem('ps-color-theme'),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    cardBg: getComputedStyle(document.querySelector('.palette-card')).backgroundColor
  }));

  report('Clicking Sun icon switches directly to Light mode', lightState.pref === 'light' && lightState.theme === 'light');
  report('Light preference persisted in localStorage', lightState.storage === 'light');
  report('In Light Mode, theme toggle displays Moon icon again', await page.locator('#theme-toggle .icon-moon').isVisible());
  report('Theme toggle aria-label indicates switch to dark', (await page.locator('#theme-toggle').getAttribute('aria-label')).includes('dark'));

  // Capture Desktop Light Mode Homepage Screenshot
  await page.screenshot({ path: 'test-results/desktop-light.png', fullPage: false });
  report('Saved desktop light mode homepage screenshot to test-results/desktop-light.png', true);

  // -------------------------------------------------------------
  // Test 3: Theme Persistence After Page Refresh
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Theme Persistence on Refresh ---');
  // Switch to Dark and reload
  await page.locator('#theme-toggle').click();
  await page.waitForTimeout(100);
  report('Switched to Dark mode before page refresh', (await page.evaluate(() => localStorage.getItem('ps-color-theme'))) === 'dark');

  await page.reload();
  await page.locator('.palette-card').first().waitFor();

  const persistedTheme = await page.evaluate(() => ({
    pref: document.documentElement.getAttribute('data-theme-preference'),
    theme: document.documentElement.getAttribute('data-theme'),
    storage: localStorage.getItem('ps-color-theme'),
    btnAria: document.querySelector('#theme-toggle').getAttribute('aria-label')
  }));
  report('Dark mode preference persists cleanly after reload', persistedTheme.pref === 'dark' && persistedTheme.theme === 'dark');
  report('localStorage contains dark preference after reload', persistedTheme.storage === 'dark');
  report('Theme toggle button shows Sun icon after reload', await page.locator('#theme-toggle .icon-sun').isVisible());

  // -------------------------------------------------------------
  // Test 4: Menu Cleanliness (No Duplicate Theme Controls)
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Menu Cleanliness ---');
  await page.locator('#menu-toggle').click();
  await page.locator('#menu').waitFor();
  const menuThemeContainerCount = await page.locator('#menu .menu-theme-container, #menu [data-theme-choice]').count();
  report('Old Appearance section is completely removed from navigation menu', menuThemeContainerCount === 0);
  await page.locator('#menu-toggle').click(); // close menu
  await page.waitForTimeout(100);

  // -------------------------------------------------------------
  // Test 5: Palette Color Preservation in Dark Mode
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing Palette Color Preservation in Dark Mode ---');
  const firstCard = page.locator('.palette-card').first();
  const paletteId = await firstCard.getAttribute('data-id');
  
  const swatchesData = await firstCard.locator('.swatch').evaluateAll(swatches => {
    return swatches.map(s => {
      const style = getComputedStyle(s);
      return {
        bg: s.style.backgroundColor || style.backgroundColor,
        filter: style.filter,
        opacity: style.opacity
      };
    });
  });

  report('Palette card contains 4 original swatches', swatchesData.length === 4);
  report('Zero CSS filter distortion applied to swatches (filter: none)', swatchesData.every(s => s.filter === 'none'));
  report('Zero opacity reduction applied to swatches (opacity: 1)', swatchesData.every(s => s.opacity === '1'));

  // Go to Palette Detail in Dark Mode
  await page.goto(`${base}/palette/${paletteId}`);
  await page.locator('.detail').waitFor();
  await page.screenshot({ path: 'test-results/detail-dark.png', fullPage: false });
  report('Saved palette detail dark mode screenshot to test-results/detail-dark.png', true);

  // Switch to light and capture detail light mode
  await page.locator('#theme-toggle').click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'test-results/detail-light.png', fullPage: false });
  report('Saved palette detail light mode screenshot to test-results/detail-light.png', true);

  // -------------------------------------------------------------
  // Test 6: Live UI Visualizer in Dark Mode
  // -------------------------------------------------------------
  console.log('\n--- 6. Testing Live UI Visualizer in Dark Mode ---');
  await page.goto(`${base}/visualizer/${paletteId}`);
  await page.locator('.visualizer-workspace').waitFor();

  // Switch to Dark mode in Visualizer
  await page.locator('#theme-toggle').click();
  await page.waitForTimeout(150);

  const visualizerDarkTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  report('Visualizer page adapts to Dark Mode', visualizerDarkTheme === 'dark');

  await page.screenshot({ path: 'test-results/visualizer-dark.png', fullPage: false });
  report('Saved visualizer dark mode screenshot to test-results/visualizer-dark.png', true);

  await page.locator('#theme-toggle').click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: 'test-results/visualizer-light.png', fullPage: false });
  report('Saved visualizer light mode screenshot to test-results/visualizer-light.png', true);

  // -------------------------------------------------------------
  // Test 7: Mobile Viewport One-Click Toggle
  // -------------------------------------------------------------
  console.log('\n--- 7. Testing Mobile Viewport One-Click Toggle ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 667 },
    colorScheme: 'light'
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(base);
  await mobilePage.locator('.palette-card').first().waitFor();

  report('Theme toggle button is visible on mobile header', await mobilePage.locator('#theme-toggle').isVisible());
  report('Mobile toggle displays Moon icon in Light Mode', await mobilePage.locator('#theme-toggle .icon-moon').isVisible());

  // One click on mobile toggle
  await mobilePage.locator('#theme-toggle').click();
  await mobilePage.waitForTimeout(150);

  const mobileDarkTheme = await mobilePage.evaluate(() => document.documentElement.getAttribute('data-theme'));
  report('Clicking mobile theme toggle switches directly to Dark Mode', mobileDarkTheme === 'dark');
  report('Mobile toggle displays Sun icon in Dark Mode', await mobilePage.locator('#theme-toggle .icon-sun').isVisible());
  report('No popover is rendered on mobile viewport', (await mobilePage.locator('#theme-popover').count()) === 0);

  await mobilePage.screenshot({ path: 'test-results/mobile-dark.png', fullPage: false });
  report('Saved mobile dark mode screenshot to test-results/mobile-dark.png', true);

  // Click back to light mode on mobile
  await mobilePage.locator('#theme-toggle').click();
  await mobilePage.waitForTimeout(150);
  const mobileLightTheme = await mobilePage.evaluate(() => document.documentElement.getAttribute('data-theme'));
  report('Clicking mobile theme toggle switches directly back to Light Mode', mobileLightTheme === 'light');

  await mobilePage.screenshot({ path: 'test-results/mobile-light.png', fullPage: false });
  report('Saved mobile light mode screenshot to test-results/mobile-light.png', true);

  // -------------------------------------------------------------
  // Test 8: Zero Errors
  // -------------------------------------------------------------
  console.log('\n--- 8. Verifying Error-Free Runtime ---');
  report('Zero unhandled browser errors during theme interactions', pageErrors.length === 0, pageErrors.join(', '));

  await mobileContext.close();
  await context.close();

} finally {
  await browser.close();
}

console.log('\n====================================');
console.log(`ALL DARK MODE TESTS PASSED (${passedTests}/${totalTests})`);
console.log('====================================\n');
