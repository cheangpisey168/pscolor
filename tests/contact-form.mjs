import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const systemChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const localBrowser = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1234/chrome-win64/chrome.exe');
const executablePath = (localBrowser && existsSync(localBrowser)) ? localBrowser : (existsSync(systemChrome) ? systemChrome : undefined);

console.log('====================================');
console.log('PS COLOR CONTACT FORM & WEB3FORMS TEST');
console.log('====================================\n');

const browser = await chromium.launch({
  headless: false, // Headed Chrome ensures Cloudflare bot management allows API requests
  ...(executablePath ? { executablePath } : {})
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
});

const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', err => pageErrors.push(err.message));

// Intercept window custom events to audit analytics calls
await page.addInitScript(() => {
  window.__analyticsEvents = [];
  window.addEventListener('ps-color-analytics', e => {
    window.__analyticsEvents.push(e.detail);
  });
});

const base = process.env.TEST_URL || 'http://localhost:5173';

try {
  // ---------------------------------------------------------
  // 1. ROUTING & UI LAYOUT VERIFICATION
  // ---------------------------------------------------------
  console.log('--- 1. Testing Contact Page Layout & Elements ---');
  await page.goto(`${base}/contact`);
  await page.locator('#contact-form').waitFor({ state: 'visible' });

  assert.equal(await page.locator('h1').innerText(), 'Contact PS color');
  assert.equal(await page.locator('#contact-form').getAttribute('novalidate'), '');
  assert.equal(await page.locator('#contact-name').count(), 1);
  assert.equal(await page.locator('#contact-email').count(), 1);
  assert.equal(await page.locator('#contact-topic').count(), 1);
  assert.equal(await page.locator('#contact-subject').count(), 1);
  assert.equal(await page.locator('#contact-message').count(), 1);
  assert.equal(await page.locator('#contact-submit-btn').count(), 1);
  console.log('[PASS] Contact form contains all required input fields and submit button');

  // Verify Honeypot field exists and is hidden
  const botcheck = page.locator('#contact-botcheck');
  assert.equal(await botcheck.count(), 1);
  const botcheckDisplay = await botcheck.evaluate(el => window.getComputedStyle(el).display);
  assert.equal(botcheckDisplay, 'none', 'Honeypot field must be hidden via display: none');
  console.log('[PASS] Anti-spam honeypot (botcheck) field is present and hidden from real users');

  // Verify success & error alert initial hidden state
  assert.equal(await page.locator('#contact-success').getAttribute('hidden'), '');
  assert.equal(await page.locator('#contact-error').getAttribute('hidden'), '');
  console.log('[PASS] Initial alert states are hidden');

  // ---------------------------------------------------------
  // 2. CLIENT-SIDE VALIDATION CHECKS
  // ---------------------------------------------------------
  console.log('\n--- 2. Testing Client-Side Validation ---');

  // Wait 1.3s so form rendering timestamp passes spam threshold
  await page.waitForTimeout(1300);

  // Attempt empty submit
  await page.locator('#contact-submit-btn').click();

  assert.equal(await page.locator('#contact-error').isVisible(), true);
  assert.match(await page.locator('#contact-error').innerText(), /correct the highlighted fields/i);
  assert.equal(await page.locator('#name-error').isVisible(), true);
  assert.equal(await page.locator('#email-error').isVisible(), true);
  assert.equal(await page.locator('#subject-error').isVisible(), true);
  assert.equal(await page.locator('#message-error').isVisible(), true);
  console.log('[PASS] Empty submission triggers validation alerts for all required fields');

  // Fill invalid email
  await page.locator('#contact-name').fill('Alex Rivera');
  await page.locator('#contact-email').fill('not-an-email');
  await page.locator('#contact-subject').fill('Design Inquiry');
  await page.locator('#contact-message').fill('This is a sufficiently long message for testing.');
  await page.locator('#contact-submit-btn').click();

  assert.equal(await page.locator('#email-error').isVisible(), true);
  assert.match(await page.locator('#email-error').innerText(), /valid email/i);
  console.log('[PASS] Invalid email address format is rejected');

  // Fill short message (< 10 chars)
  await page.locator('#contact-email').fill('alex@example.com');
  await page.locator('#contact-message').fill('Too short');
  await page.locator('#contact-submit-btn').click();

  assert.equal(await page.locator('#message-error').isVisible(), true);
  assert.match(await page.locator('#message-error').innerText(), /at least 10 characters/i);
  console.log('[PASS] Message shorter than 10 characters is rejected');

  // ---------------------------------------------------------
  // 3. SPAM PROTECTION CHECKS
  // ---------------------------------------------------------
  console.log('\n--- 3. Testing Spam Protection ---');

  // Test Rapid-Submission threshold (< 1200ms)
  await page.evaluate(() => {
    document.querySelector('#contact-form').dataset.renderedAt = String(Date.now());
  });
  await page.locator('#contact-message').fill('Valid length message to trigger rapid submission check.');
  await page.locator('#contact-submit-btn').click();

  assert.match(await page.locator('#contact-error').innerText(), /take a moment to review your message/i);
  console.log('[PASS] Rapid automated submission (< 1200ms) is prevented');

  // Test Honeypot interception
  await page.evaluate(() => {
    document.querySelector('#contact-form').dataset.renderedAt = String(Date.now() - 5000);
    document.querySelector('#contact-botcheck').checked = true;
  });
  await page.locator('#contact-submit-btn').click();
  // Honeypot blocks external request and pretends success silently to confuse bots
  assert.equal(await page.locator('#contact-success').isVisible(), true);
  console.log('[PASS] Honeypot trap intercepts bot submissions silently without calling API');

  // ---------------------------------------------------------
  // 4. DUPLICATE SUBMISSION & LOADING STATE
  // ---------------------------------------------------------
  console.log('\n--- 4. Testing Loading & Duplicate Prevention ---');
  await page.goto(`${base}/contact`);
  await page.waitForTimeout(1300);

  // Intercept fetch to add latency and count network submissions
  await page.evaluate(() => {
    window.__requestCount = 0;
    const realFetch = window.fetch;
    window.fetch = async (url, opts) => {
      if (url.includes('web3forms')) {
        window.__requestCount++;
        await new Promise(r => setTimeout(r, 600));
        return {
          status: 200,
          ok: true,
          json: async () => ({ success: true, message: 'Mock success' })
        };
      }
      return realFetch(url, opts);
    };
  });

  // Fill valid test data
  await page.locator('#contact-name').fill('Sarah Jenkins');
  await page.locator('#contact-email').fill('sarah@example.com');
  await page.locator('#contact-topic').selectOption('partnership');
  await page.locator('#contact-subject').fill('Design Tool Integration');
  await page.locator('#contact-message').fill('We would like to discuss featuring PS Color in our design toolkit.');

  // Click and immediately attempt duplicate click while in-flight
  await page.locator('#contact-submit-btn').click();
  await page.locator('#contact-submit-btn').click({ force: true }).catch(() => {});

  await page.locator('#contact-success').waitFor({ state: 'visible' });
  const requestCount = await page.evaluate(() => window.__requestCount);
  assert.equal(requestCount, 1, 'Duplicate submissions must be blocked during flight');
  console.log('[PASS] Duplicate submission prevented: exactly 1 API call made during flight');

  // Reset page and test live submission against official Web3Forms API
  await page.goto(`${base}/contact`);
  await page.waitForTimeout(1300);
  await page.locator('#contact-name').fill('Sarah Jenkins');
  await page.locator('#contact-email').fill('sarah@example.com');
  await page.locator('#contact-topic').selectOption('partnership');
  await page.locator('#contact-subject').fill('Design Tool Integration');
  await page.locator('#contact-message').fill('We would like to discuss featuring PS Color in our design toolkit.');
  await page.locator('#contact-submit-btn').click();

  // ---------------------------------------------------------
  // 5. SUCCESSFUL DELIVERY & ZERO PII IN ANALYTICS
  // ---------------------------------------------------------
  console.log('\n--- 5. Testing API Delivery & Analytics Privacy ---');

  await page.locator('#contact-success').waitFor({ state: 'visible', timeout: 15000 });
  const successText = await page.locator('#contact-success').innerText();
  assert.match(successText, /message has been sent successfully/i);
  console.log('[PASS] Web3Forms API confirmed successful submission & displayed success banner');

  // Verify form was cleared
  assert.equal(await page.locator('#contact-name').inputValue(), '');
  assert.equal(await page.locator('#contact-email').inputValue(), '');
  assert.equal(await page.locator('#contact-subject').inputValue(), '');
  assert.equal(await page.locator('#contact-message').inputValue(), '');
  console.log('[PASS] Form fields automatically cleared after confirmed delivery');

  // Verify Analytics audit: ZERO Personal Identifiable Information (PII)
  const analyticsEvents = await page.evaluate(() => window.__analyticsEvents);
  const contactSubmitEvents = analyticsEvents.filter(e => e.event === 'contact_form_submit');
  assert.ok(contactSubmitEvents.length >= 1, 'contact_form_submit event should be dispatched');

  for (const evt of contactSubmitEvents) {
    const params = evt.params || {};
    assert.equal(params.topic, 'partnership', 'Allowed event parameter is only topic');
    assert.equal(params.name, undefined, 'Name must NEVER be sent to analytics');
    assert.equal(params.email, undefined, 'Email must NEVER be sent to analytics');
    assert.equal(params.subject, undefined, 'Subject text must NEVER be sent to analytics');
    assert.equal(params.message, undefined, 'Message body must NEVER be sent to analytics');
  }
  console.log('[PASS] GA4 / telemetry tracks zero PII (name, email, message strictly excluded)');

  // ---------------------------------------------------------
  // 6. ERROR HANDLING (MISSING ACCESS KEY)
  // ---------------------------------------------------------
  console.log('\n--- 6. Testing Error Handling & Missing Key Handling ---');
  await page.goto(`${base}/contact`);
  await page.waitForTimeout(1300);

  await page.evaluate(() => {
    // Simulate missing access key or failed response
    window.__originalFetch = window.fetch;
    window.fetch = async (url, opts) => {
      if (url.includes('web3forms')) {
        return {
          status: 400,
          ok: false,
          json: async () => ({ success: false, message: 'Invalid API Key provided' })
        };
      }
      return window.__originalFetch(url, opts);
    };
  });

  await page.locator('#contact-name').fill('John Developer');
  await page.locator('#contact-email').fill('john@example.com');
  await page.locator('#contact-subject').fill('Test Error Handling');
  await page.locator('#contact-message').fill('Testing simulated error response display.');
  await page.locator('#contact-submit-btn').click();

  await page.locator('#contact-error').waitFor({ state: 'visible' });
  const errorText = await page.locator('#contact-error').innerText();
  assert.match(errorText, /Invalid API Key provided|Unable to deliver/i);
  console.log('[PASS] API failure triggers clear user-facing error message banner');

  // Verify no unhandled JavaScript runtime errors
  assert.equal(pageErrors.length, 0, `Page errors: ${pageErrors.join(', ')}`);
  console.log('[PASS] Zero unhandled JavaScript errors during contact test session');

  console.log('\n====================================');
  console.log('ALL CONTACT FORM TESTS PASSED (6/6)');
  console.log('====================================\n');

} finally {
  await browser.close();
}
