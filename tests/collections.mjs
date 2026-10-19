import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

console.log('====================================');
console.log('PS COLOR PHASE 3: MY COLOR COLLECTIONS TEST');
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

const base = process.env.TEST_URL || 'http://localhost:5173';
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  permissions: ['clipboard-read', 'clipboard-write']
});
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', err => pageErrors.push(err.message));

try {
  // -------------------------------------------------------------
  // Test 1: Legacy Data Migration
  // -------------------------------------------------------------
  console.log('\n--- 1. Testing Legacy Data Migration ---');
  await page.goto(base);
  await page.evaluate(() => {
    localStorage.clear();
    // Simulate legacy saved palettes
    localStorage.setItem('ps-color-saved', JSON.stringify(['f7f0dcd9e4c8a2b89b52796f']));
    localStorage.setItem('myCollection', 'f7f0dcd9e4c8a2b89b52796f');
  });
  await page.reload();
  await page.locator('.palette-card').first().waitFor();

  // Navigate to /collection
  await page.locator('#navigation [data-route="/collection"]').click();
  await page.locator('#collection-manager').waitFor();

  const migratedData = await page.evaluate(() => {
    const raw = localStorage.getItem('ps-color-collections');
    return raw ? JSON.parse(raw) : null;
  });

  report('Legacy data migrated into ps-color-collections', Array.isArray(migratedData) && migratedData.length > 0);
  report('Default collection is named "Favorites"', migratedData[0]?.name === 'Favorites');
  report('Migrated palette ID exists in Favorites', migratedData[0]?.paletteIds?.includes('f7f0dcd9e4c8a2b89b52796f'));
  report('Palette card is rendered in collection view', (await page.locator('.palette-card').count()) === 1);

  // -------------------------------------------------------------
  // Test 2: Create Multiple Named Collections
  // -------------------------------------------------------------
  console.log('\n--- 2. Testing Multiple Named Collections Creation ---');
  await page.locator('#btn-create-collection').click();
  await page.locator('#dialog[open]').waitFor();
  report('Create collection modal dialog opened', await page.locator('#dialog').isVisible());

  // Test empty name validation
  await page.locator('#btn-submit-create-col').click();
  const errorVisible = await page.locator('#collection-modal-error').isVisible();
  report('Empty collection name shows error validation', errorVisible);

  // Fill valid collection name
  await page.locator('#new-collection-name').fill('Brand Identity 2026');
  await page.locator('#new-collection-desc').fill('Design tokens for brand redesign');
  await page.locator('#btn-submit-create-col').click();
  await page.locator('#dialog[open]').waitFor({ state: 'detached' });

  // Verify new collection tab is created and active
  const activeTabName = await page.locator('.collection-tab.active .tab-name').innerText();
  report('New collection created and set as active tab', activeTabName === 'Brand Identity 2026');
  report('Empty state shown for newly created collection', (await page.locator('.empty').count()) === 1);
  report('Empty state text invites saving palettes', /Your collection starts here/.test(await page.locator('.empty').innerText()));

  // Create a second collection
  await page.locator('#btn-tab-new-collection').click();
  await page.locator('#dialog[open]').waitFor();
  await page.locator('#new-collection-name').fill('Dark Mode UI');
  await page.locator('#btn-submit-create-col').click();
  await page.locator('#dialog[open]').waitFor({ state: 'detached' });

  const tabCount = await page.locator('.collection-tab').count();
  report('Multiple collection tabs exist', tabCount >= 3);

  // -------------------------------------------------------------
  // Test 3: Detail Page Collection Picker (Add & Remove)
  // -------------------------------------------------------------
  console.log('\n--- 3. Testing Palette Detail Collection Picker ---');
  await page.goto(`${base}/palette/f7f0dcd9e4c8a2b89b52796f`);
  await page.locator('#detail-collections-btn').waitFor();
  report('Palette detail page displays Collections button', (await page.locator('#detail-collections-btn').count()) === 1);

  await page.locator('#detail-collections-btn').click();
  await page.locator('#dialog[open]').waitFor();
  report('Save to Collection picker modal is open', await page.locator('#dialog').isVisible());

  // Check that Brand Identity 2026 checkbox exists and toggle it
  const brandCheck = page.locator('[data-col-item] input[type="checkbox"]').nth(1);
  await brandCheck.click();
  report('Toggled Brand Identity 2026 checkbox to active', await brandCheck.isChecked());

  // Test inline collection creation in modal
  await page.locator('#inline-collection-name').fill('Pastel Gems');
  await page.locator('#btn-inline-create-col').click();
  await page.waitForTimeout(100);

  const pastelCheck = page.locator('[data-col-item]').filter({ hasText: 'Pastel Gems' });
  report('Inline created collection appears in checklist and is saved', (await pastelCheck.count()) === 1);

  // Close modal with Done
  await page.locator('#dialog [data-close]').first().click();
  await page.locator('#dialog[open]').waitFor({ state: 'detached' });

  // Navigate back to /collection to verify palette presence
  await page.locator('#navigation [data-route="/collection"]').click();
  await page.locator('.collection-tab').filter({ hasText: 'Brand Identity 2026' }).click();
  await page.waitForTimeout(100);
  report('Palette appears in Brand Identity 2026 collection', (await page.locator('.palette-card').count()) === 1);

  // Test duplicate prevention
  const duplicatesPrevented = await page.evaluate(() => {
    const collections = JSON.parse(localStorage.getItem('ps-color-collections'));
    const brand = collections.find(c => c.name === 'Brand Identity 2026');
    return new Set(brand.paletteIds).size === brand.paletteIds.length;
  });
  report('Duplicate palettes strictly prevented within collection', duplicatesPrevented);

  // -------------------------------------------------------------
  // Test 4: Rename Collection
  // -------------------------------------------------------------
  console.log('\n--- 4. Testing Collection Renaming ---');
  await page.locator('#collection-menu-trigger').click();
  await page.locator('[data-rename-collection]').click();
  await page.locator('#dialog[open]').waitFor();
  report('Rename collection modal dialog opened', await page.locator('#dialog').isVisible());

  await page.locator('#rename-collection-input').fill('Acme Guidelines 2026');
  await page.locator('#btn-submit-rename-col').click();
  await page.locator('#dialog[open]').waitFor({ state: 'detached' });

  const renamedTitle = await page.locator('.collection-page-title').innerText();
  report('Collection title updated to renamed value', renamedTitle === 'Acme Guidelines 2026');

  // -------------------------------------------------------------
  // Test 5: Delete Collection with Confirmation
  // -------------------------------------------------------------
  console.log('\n--- 5. Testing Collection Deletion ---');
  // Switch to Pastel Gems
  await page.locator('.collection-tab').filter({ hasText: 'Pastel Gems' }).click();
  await page.waitForTimeout(100);

  await page.locator('#collection-menu-trigger').click();
  await page.locator('[data-delete-collection]').click();
  await page.locator('#dialog[open]').waitFor();
  report('Delete collection confirmation modal opened', await page.locator('#dialog').isVisible());

  await page.locator('#btn-confirm-delete-col').click();
  await page.locator('#dialog[open]').waitFor({ state: 'detached' });

  const remainingTabs = await page.locator('.collection-tab').evaluateAll(els => els.map(e => e.innerText));
  report('Deleted collection removed from tabs', !remainingTabs.some(t => t.includes('Pastel Gems')));
  report('Active collection resets to Favorites', (await page.locator('.collection-tab.active').innerText()).includes('Favorites'));

  // Verify Favorites has no delete button in its options menu
  await page.locator('#collection-menu-trigger').click();
  report('Favorites default collection has no delete button', (await page.locator('[data-delete-collection]').count()) === 0);
  await page.keyboard.press('Escape');

  // -------------------------------------------------------------
  // Test 6: Collection JSON Export & Import
  // -------------------------------------------------------------
  console.log('\n--- 6. Testing JSON Export & Import ---');
  // Export active collection via options menu
  await page.locator('#collection-menu-trigger').click();
  const exportPromise = page.waitForEvent('download');
  await page.locator('[data-export-collection]').click();
  const download = await exportPromise;
  report('Collection JSON export triggered with valid filename', /^ps-color-.*\.json$/.test(download.suggestedFilename()));

  // Test Import Modal
  await page.locator('#btn-import-collections').click();
  await page.locator('#dialog[open]').waitFor();
  report('Import modal opened', await page.locator('#dialog').isVisible());

  // Test corrupt JSON input rejection
  await page.locator('#dialog details summary').click();
  await page.locator('#import-textarea-input').fill('this is invalid corrupted { JSON ');
  await page.locator('#import-textarea-input').dispatchEvent('input');
  await page.waitForTimeout(50);
  report('Corrupt JSON input rejected with error', await page.locator('#import-status-box.status-error').isVisible());
  report('Import submit button is disabled on invalid JSON', await page.locator('#btn-execute-import').isDisabled());

  // Test valid JSON input
  const validJson = JSON.stringify({
    app: 'PS Color',
    version: '2.0',
    collections: [
      {
        name: 'Autumn Warmth',
        description: 'Rich fall hues',
        palettes: [
          { id: '2b2d428d99aeedf2f4ef233c', colors: ['#2B2D42', '#8D99AE', '#EDF2F4', '#EF233C'] }
        ]
      }
    ]
  });

  await page.locator('#import-textarea-input').fill(validJson);
  await page.locator('#import-textarea-input').dispatchEvent('input');
  await page.waitForTimeout(50);
  report('Valid JSON accepted and import status indicates ready', await page.locator('#import-status-box.status-success').isVisible());

  await page.locator('#btn-execute-import').click();
  await page.locator('#dialog[open]').waitFor({ state: 'detached' });

  const importedTabExists = await page.locator('.collection-tab').filter({ hasText: 'Autumn Warmth' }).count();
  report('Imported collection added to tabs', importedTabExists === 1);
  report('Imported palette rendered in feed', (await page.locator('.palette-card').count()) === 1);

  // -------------------------------------------------------------
  // Test 7: Keyboard Accessibility
  // -------------------------------------------------------------
  console.log('\n--- 7. Testing Keyboard Accessibility ---');
  await page.locator('#btn-create-collection').click();
  await page.locator('#dialog[open]').waitFor();

  // Test Escape key closes modal
  await page.keyboard.press('Escape');
  await page.locator('#dialog[open]').waitFor({ state: 'detached' });
  report('Escape key closes modal dialog', !(await page.locator('#dialog').isVisible()));

  // -------------------------------------------------------------
  // Test 8: Dark Mode Compatibility
  // -------------------------------------------------------------
  console.log('\n--- 8. Testing Dark Mode Rendering ---');
  await page.locator('#theme-toggle').click();
  const isDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark');
  report('Switched to Dark Mode', isDark);

  const managerDarkBg = await page.locator('#collection-manager').evaluate(el => getComputedStyle(el).backgroundColor);
  report('Collection manager adapts to Dark Mode surface token', managerDarkBg === 'rgb(27, 30, 38)');

  await page.locator('#theme-toggle').click(); // Restore light mode

  // -------------------------------------------------------------
  // Test 9: Zero Browser Errors
  // -------------------------------------------------------------
  console.log('\n--- 9. Checking Zero Runtime Errors ---');
  report('Zero unhandled browser JavaScript errors throughout test session', pageErrors.length === 0, pageErrors.join(', '));

  console.log(`\n====================================`);
  console.log(`COLLECTIONS TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log(`====================================\n`);

} finally {
  await browser.close();
}
