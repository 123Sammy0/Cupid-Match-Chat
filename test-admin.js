const { chromium } = require('playwright');

(async () => {
    console.log("Starting Admin Panel E2E Gauntlet...");
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log("Navigating to /gate...");
        await page.goto('http://localhost:2012/gate');
        
        // Pass the gate
        console.log("Entering Gate Code 1212...");
        const inputs = await page.locator('input[type="password"], input[type="text"]');
        for (let i = 0; i < 4; i++) {
            const digit = "1212"[i];
            await inputs.nth(i).fill(digit);
        }
        
        await page.click('button:has-text("Unlock")');
        
        // Wait for the redirect to happen after gate
        await page.waitForURL('**/auth', { timeout: 60000 });
        console.log("Gate passed successfully.");

        console.log("Navigating to /admin-login...");
        await page.goto('http://localhost:2012/admin-login', { timeout: 60000 });
        
        await page.fill('input[type="email"]', 'mdsaakib002@gmail.com');
        await page.fill('input[type="password"]', 'asdqwe123');
        await page.click('button[type="submit"]');

        console.log("Waiting for dashboard...");
        await page.waitForURL('**/admin', { timeout: 60000 });
        await page.waitForTimeout(2000);
        console.log(`Admin entered dashboard: ${page.url()}`);
        await page.screenshot({ path: 'admin_01_dashboard.png' });

        console.log("Navigating to /admin/users...");
        await page.click('text=Users & Roles');
        await page.waitForURL('**/admin/users', { timeout: 60000 });
        await page.waitForTimeout(2000);
        console.log(`Admin entered users: ${page.url()}`);
        await page.screenshot({ path: 'admin_02_users.png' });

        console.log("Navigating to /admin/settings...");
        await page.click('text=Global Settings');
        await page.waitForURL('**/admin/settings', { timeout: 60000 });
        await page.waitForTimeout(2000);
        console.log(`Admin entered settings: ${page.url()}`);
        await page.screenshot({ path: 'admin_03_settings.png' });
        
        console.log("Navigating to /admin/logs...");
        await page.click('text=Audit Logs');
        await page.waitForURL('**/admin/logs', { timeout: 60000 });
        await page.waitForTimeout(2000);
        console.log(`Admin entered logs: ${page.url()}`);
        await page.screenshot({ path: 'admin_04_logs.png' });

        console.log("Admin test completed successfully.");

    } catch (e) {
        console.error("Test failed:", e);
        await page.screenshot({ path: 'admin_error.png' });
    } finally {
        await browser.close();
    }
})();
