const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    console.log('=== VISUAL AUDIT — ONE BROWSER SESSION ===');

    // 1. Home page
    await page.goto('http://localhost:2012', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('[1] HOME URL:', page.url());
    await page.screenshot({ path: 'ss_fixed_01_home.png', fullPage: true });

    // 2. Gate page
    await page.goto('http://localhost:2012/gate', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('[2] GATE URL:', page.url());
    await page.screenshot({ path: 'ss_fixed_02_gate.png', fullPage: true });

    // 3. Auth page (via gate bypass)
    // Enter gate pass 1212
    const inputs = await page.$$('input[type="text"]');
    if (inputs.length >= 4) {
      await inputs[0].fill('1');
      await inputs[1].fill('2');
      await inputs[2].fill('1');
      await inputs[3].fill('2');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/auth', { timeout: 5000 }).catch(() => {});
    }
    await page.waitForTimeout(2000);
    console.log('[3] AUTH URL:', page.url());
    await page.screenshot({ path: 'ss_fixed_03_auth.png', fullPage: true });

    // 4. Admin login
    await page.goto('http://localhost:2012/admin-login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    console.log('[4] ADMIN-LOGIN URL:', page.url());
    await page.screenshot({ path: 'ss_fixed_04_admin_login.png', fullPage: true });

    // CSS verification
    const flexWorks = await page.evaluate(() => {
      const el = document.createElement('div');
      el.className = 'flex';
      document.body.appendChild(el);
      const d = getComputedStyle(el).display;
      document.body.removeChild(el);
      return d;
    });
    console.log('[CSS] flex display:', flexWorks);

    const bgBase = await page.evaluate(() => {
      const el = document.createElement('div');
      el.className = 'bg-base';
      document.body.appendChild(el);
      const bg = getComputedStyle(el).backgroundColor;
      document.body.removeChild(el);
      return bg;
    });
    console.log('[CSS] bg-base:', bgBase);

    // Check admin-login card is centered and visible
    const cardBox = await page.locator('div.w-full.max-w-\\[400px\\]').boundingBox();
    console.log('[LAYOUT] Admin card bounds:', JSON.stringify(cardBox));

    await context.close();
    console.log('=== SCREENSHOTS COMPLETE ===');
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error('TEST FAILED:', e.message);
  process.exit(1);
});
