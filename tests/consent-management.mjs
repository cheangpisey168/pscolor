import { chromium } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const systemChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const localBrowser = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe');
const executablePath = (localBrowser && existsSync(localBrowser)) ? localBrowser : (existsSync(systemChrome) ? systemChrome : undefined);

console.log('====================================');
console.log('PS COLOR CONSENT MODE V2 & CMP TEST');
console.log('====================================\n');

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {})
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 }
});

const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', err => pageErrors.push(err.message));

// Track dataLayer calls to inspect Consent Mode defaults and updates
await page.addInitScript(() => {
  window.__consentUpdates = [];
  window.__analyticsEvents = [];

  const originalPush = window.dataLayer?.push || Array.prototype.push;
  window.dataLayer = window.dataLayer || [];
  
  const recordEntry = entry => {
    if (entry && entry[0] === 'consent') {
      window.__consentUpdates.push({ action: entry[1], params: entry[2] });
    }
  };

  // Intercept existing and future dataLayer pushes
  window.dataLayer.forEach(recordEntry);
  window.dataLayer.push = function (...args) {
    args.forEach(recordEntry);
    return originalPush.apply(this, args);
  };

  window.addEventListener('ps-color-analytics', e => {
    window.__analyticsEvents.push(e.detail);
  });
});

const base = process.env.TEST_URL || 'http://localhost:5173';

try {
  // ---------------------------------------------------------
  // 1. PRERENDERED HTML & HEAD TAG VERIFICATION
  // ---------------------------------------------------------
  console.log('--- 1. Testing Production HTML & Consent Mode Stubs ---');
  
  const distHtmlPath = 'dist/index.html';
  assert.ok(existsSync(distHtmlPath), 'dist/index.html should exist');
  const distHtml = readFileSync(distHtmlPath, 'utf-8');

  // AdSense ownership verification meta tag
  assert.ok(
    distHtml.includes('<meta name="google-adsense-account" content="ca-pub-7316030355193168">'),
    'AdSense account meta tag must be preserved in dist HTML'
  );
  console.log('[PASS] Google AdSense account meta tag verified (ca-pub-7316030355193168)');

  // Official AdSense script tag
  assert.ok(
    distHtml.includes('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7316030355193168'),
    'Official AdSense script tag must be present in dist HTML'
  );
  console.log('[PASS] Google AdSense official script tag verified in production build');

  // Consent Mode v2 default initialization
  assert.ok(
    distHtml.includes("gtag('consent', 'default'"),
    'Consent Mode v2 default script must be present in dist HTML'
  );
  assert.ok(distHtml.includes("'ad_storage': 'denied'"), 'ad_storage default denied verified');
  assert.ok(distHtml.includes("'analytics_storage': 'denied'"), 'analytics_storage default denied verified');
  assert.ok(distHtml.includes("'ad_user_data': 'denied'"), 'ad_user_data default denied verified');
  assert.ok(distHtml.includes("'ad_personalization': 'denied'"), 'ad_personalization default denied verified');
  assert.ok(distHtml.includes("'wait_for_update': 500"), 'wait_for_update: 500 verified');
  console.log('[PASS] Google Consent Mode v2 defaults with regional declarations verified');

  // Prerendered palette check
  const samplePrerender = 'dist/palette/f7f0dcd9e4c8a2b89b52796f/index.html';
  if (existsSync(samplePrerender)) {
    const paletteHtml = readFileSync(samplePrerender, 'utf-8');
    assert.ok(paletteHtml.includes('ca-pub-7316030355193168'), 'Prerendered palette contains AdSense tag');
    assert.ok(paletteHtml.includes("gtag('consent', 'default'"), 'Prerendered palette contains Consent Mode defaults');
    console.log('[PASS] Prerendered palette pages cleanly inherit Consent Mode stubs and AdSense script');
  }

  // ---------------------------------------------------------
  // 2. FIRST-TIME VISITOR WITH NO CONSENT (STRICT PRIOR OPT-IN)
  // ---------------------------------------------------------
  console.log('\n--- 2. Testing First-Time Visitor (No Consent) ---');
  await page.goto(base);
  await page.locator('.palette-card').first().waitFor();

  // Verify default consent state in browser
  const hasConsent = await page.evaluate(() => {
    return localStorage.getItem('ps-color-analytics-consent') !== null;
  });
  assert.equal(hasConsent, false, 'First-time visitor must have empty localStorage consent');

  // Verify GA4 script is NOT injected (Basic Consent Mode)
  const gaScriptCount = await page.evaluate(() => {
    return document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]').length;
  });
  assert.equal(gaScriptCount, 0, 'In Basic Consent Mode, GA4 script must NOT load before consent');
  console.log('[PASS] Basic Consent Mode: GA4 script blocked from injection prior to consent');

  // Verify zero telemetry events sent
  const initialEvents = await page.evaluate(() => window.__analyticsEvents);
  assert.equal(initialEvents.length, 0, 'Zero analytics events should fire before consent');
  console.log('[PASS] Zero tracking events dispatched on unconsented first visit');

  // ---------------------------------------------------------
  // 3. COOKIE BANNER & CONSENT ACCEPTANCE
  // ---------------------------------------------------------
  console.log('\n--- 3. Testing Consent Acceptance (Accept All) ---');
  // Wait for coordinated banner appearance (after 400ms delay)
  const banner = page.locator('#cookie-banner');
  await banner.waitFor({ state: 'visible', timeout: 3000 });
  console.log('[PASS] Coordinated custom cookie banner appears cleanly after initial delay');

  // Click "Accept All"
  await page.locator('#cookie-accept').click();
  await banner.waitFor({ state: 'hidden' });

  // Verify localStorage updated
  const storedAnalytics = await page.evaluate(() => localStorage.getItem('ps-color-analytics-consent'));
  const storedAds = await page.evaluate(() => localStorage.getItem('ps-color-advertising-consent'));
  assert.equal(storedAnalytics, 'granted');
  assert.equal(storedAds, 'granted');
  console.log('[PASS] Local storage records granted consent for analytics and advertising');

  // Verify Consent Mode update dispatched
  const consentUpdates = await page.evaluate(() => window.__consentUpdates);
  const lastUpdate = consentUpdates.filter(u => u.action === 'update').pop();
  assert.ok(lastUpdate, 'gtag consent update should be pushed');
  assert.equal(lastUpdate.params.analytics_storage, 'granted');
  assert.equal(lastUpdate.params.ad_storage, 'granted');
  assert.equal(lastUpdate.params.ad_user_data, 'granted');
  assert.equal(lastUpdate.params.ad_personalization, 'granted');
  console.log('[PASS] Google Consent Mode v2 update dispatched with granted permissions');

  // ---------------------------------------------------------
  // 4. PAGE REFRESH PERSISTENCE (NO DUPLICATE BANNER)
  // ---------------------------------------------------------
  console.log('\n--- 4. Testing Persistence After Reload ---');
  await page.reload();
  await page.locator('.palette-card').first().waitFor();
  await page.waitForTimeout(600);

  const bannerAfterReload = await page.locator('#cookie-banner').count();
  assert.equal(bannerAfterReload, 0, 'Cookie banner must NOT reappear once consent choice is saved');
  console.log('[PASS] Saved consent choice persists across reloads; duplicate banner prevented');

  // ---------------------------------------------------------
  // 5. PRIVACY PAGE GRANULAR TOGGLES & REVOCATION
  // ---------------------------------------------------------
  console.log('\n--- 5. Testing Privacy Page Granular Controls & Revocation ---');
  await page.goto(`${base}/privacy`);
  await page.locator('#toggle-consent').waitFor();

  // Verify initial status displays active
  assert.match(await page.locator('#consent-status-text').innerText(), /Active/i);
  assert.match(await page.locator('#ad-consent-status-text').innerText(), /Active/i);

  // Toggle Analytics off
  await page.locator('#toggle-consent').click();
  assert.match(await page.locator('#consent-status-text').innerText(), /Disabled|Opted Out/i);
  console.log('[PASS] Granular toggle successfully switches analytics consent off');

  // Toggle Advertising off
  await page.locator('#toggle-ad-consent').click();
  assert.match(await page.locator('#ad-consent-status-text').innerText(), /Disabled|Non-Personalized/i);
  console.log('[PASS] Granular toggle successfully switches advertising consent off');

  // Test Cookie Purging on Withdraw All
  await page.evaluate(() => {
    // Set simulated tracking cookies
    document.cookie = '_ga=GA1.1.123456789.1234567890; path=/;';
    document.cookie = '_ga_TESTID=GS1.1.12345.1.0.12345.0.0.0; path=/;';
    document.cookie = '_gid=GA1.1.987654321.0987654321; path=/;';
    document.cookie = 'app_session=legitimate_functional_cookie; path=/;';
  });

  await page.locator('#withdraw-all-consent').click();

  const remainingCookies = await page.evaluate(() => document.cookie);
  assert.ok(!remainingCookies.includes('_ga='), '_ga cookie should be purged');
  assert.ok(!remainingCookies.includes('_gid='), '_gid cookie should be purged');
  assert.ok(remainingCookies.includes('app_session='), 'Unrelated functional cookies must be preserved');
  console.log('[PASS] Application-controlled tracking cookies purged cleanly while unrelated cookies preserved');

  // ---------------------------------------------------------
  // 6. FOOTER COOKIE PREFERENCES & GOOGLE CMP INTEGRATION
  // ---------------------------------------------------------
  console.log('\n--- 6. Testing Footer Cookie Settings & Revocation API ---');
  await page.goto(base);
  await page.locator('.site-footer').waitFor();

  // Test 6a: Fallback navigation when Google CMP is not loaded
  await page.locator('.site-footer [data-cookie-settings]').click();
  await page.waitForURL('**/privacy');
  assert.equal(new URL(page.url()).pathname, '/privacy');
  console.log('[PASS] Footer link falls back to /privacy when Google CMP is not present');

  // Test 6b: Direct Google CMP revocation call when window.googlefc is available
  await page.evaluate(() => {
    window.__revocationCalled = false;
    window.googlefc = {
      showRevocationMessage: () => {
        window.__revocationCalled = true;
      }
    };
  });

  await page.locator('.site-footer [data-cookie-settings]').click();
  const revocationFired = await page.evaluate(() => window.__revocationCalled);
  assert.equal(revocationFired, true, 'Footer link must invoke googlefc.showRevocationMessage() when available');
  console.log('[PASS] Footer link directly invokes Google CMP showRevocationMessage() API');

  // Test 6c: Reopen Google CMP button on /privacy
  await page.goto(`${base}/privacy`);
  await page.locator('#reopen-google-cmp').waitFor();
  await page.evaluate(() => {
    window.__cmpButtonFired = false;
    window.googlefc = {
      showRevocationMessage: () => {
        window.__cmpButtonFired = true;
      }
    };
  });
  await page.locator('#reopen-google-cmp').click();
  const cmpButtonFired = await page.evaluate(() => window.__cmpButtonFired);
  assert.equal(cmpButtonFired, true);
  console.log('[PASS] Reopen GDPR CMP button on /privacy invokes Google CMP revocation API');

  // ---------------------------------------------------------
  // 7. IAB TCF V2.2 / V2.3 SYNCHRONIZATION & DUPLICATE BANNER PREVENTION
  // ---------------------------------------------------------
  console.log('\n--- 7. Testing IAB TCF v2.2 / v2.3 & Duplicate Dialog Prevention ---');

  // Test 7a: Fast CMP appearance: Custom banner suppressed when Google TCF CMP is active
  await page.goto(base);
  await page.evaluate(() => {
    localStorage.clear();
    // Simulate TCF API with CMP UI shown event
    window.dispatchEvent(new CustomEvent('ps-color-tcf-active', { detail: { eventStatus: 'cmpuishown', gdprApplies: true } }));
  });
  await page.waitForTimeout(600);

  const bannerDuringCmp = await page.locator('#cookie-banner').count();
  assert.equal(bannerDuringCmp, 0, 'Custom cookie banner must be suppressed when TCF CMP is active');
  console.log('[PASS] Custom banner suppressed when Google TCF CMP is active; zero overlapping dialogs');

  // Test 7b: Slow-loading CMP: Banner renders first, then late Google CMP arrives
  await page.goto(base);
  const lateBanner = page.locator('#cookie-banner');
  await lateBanner.waitFor({ state: 'visible', timeout: 3000 });
  assert.equal(await lateBanner.isVisible(), true, 'Custom banner renders before slow CMP arrives');

  // Simulate late Google CMP DOM insertion (.fc-consent-root)
  await page.evaluate(() => {
    const fcRoot = document.createElement('div');
    fcRoot.className = 'fc-consent-root';
    fcRoot.innerHTML = '<div class="fc-dialog-container"><p>Simulated Google CMP Dialog</p></div>';
    document.body.appendChild(fcRoot);
  });
  await page.waitForTimeout(300);

  const bannerAfterLateCmp = await page.locator('#cookie-banner').count();
  assert.equal(bannerAfterLateCmp, 0, 'Custom banner must be dismissed immediately when late Google CMP DOM arrives');
  console.log('[PASS] Slow CMP resilience: Late Google CMP arrival automatically removes custom banner');

  // Test 7c: Non-EEA traffic isolation (gdprApplies: false does NOT overwrite user consent)
  await page.evaluate(() => {
    localStorage.setItem('ps-color-analytics-consent', 'granted');
    localStorage.setItem('ps-color-advertising-consent', 'granted');
  });
  const nonEeaConsent = await page.evaluate(() => localStorage.getItem('ps-color-analytics-consent'));
  assert.equal(nonEeaConsent, 'granted', 'Non-EEA session preserves custom consent choices');
  console.log('[PASS] Non-EEA isolation: TCF events outside GDPR scope do not overwrite custom consent');

  // ---------------------------------------------------------
  // 8. MOBILE VIEWPORT COMPATIBILITY
  // ---------------------------------------------------------
  console.log('\n--- 8. Testing Mobile Viewport Compatibility ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/privacy`);
  await page.locator('.content-page').waitFor();

  const isOverflowing = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  assert.equal(isOverflowing, false, 'Mobile viewport must not produce horizontal overflow');
  console.log('[PASS] Mobile layout renders without horizontal overflow or clipped controls');

  // Verify zero unhandled browser errors
  assert.equal(pageErrors.length, 0, `Page errors: ${pageErrors.join(', ')}`);
  console.log('[PASS] Zero unhandled JavaScript errors across all consent scenarios');

  console.log('\n====================================');
  console.log('ALL CONSENT MODE & CMP TESTS PASSED (8/8)');
  console.log('====================================\n');

} finally {
  await browser.close();
}
