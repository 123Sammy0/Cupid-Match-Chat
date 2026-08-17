const { chromium } = require('playwright');

(async () => {
    console.log("Starting Admin Chat Control E2E Gauntlet...");
    const browser = await chromium.launch({ headless: false, slowMo: 50 });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    try {
        console.log("Navigating to /gate...");
        await page.goto('http://localhost:2012/gate', { timeout: 60000 });
        
        console.log("Entering Gate Code 1212...");
        for (let i = 0; i < 4; i++) {
            await page.fill(`input[aria-label="Digit ${i + 1}"]`, "1212"[i]);
        }
        await page.click('button:has-text("Unlock")');
        
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

        console.log("Navigating to /admin/chats...");
        await page.goto('http://localhost:2012/admin/chats', { timeout: 60000 });
        await page.waitForTimeout(3000);
        console.log(`Admin entered chats: ${page.url()}`);
        await page.screenshot({ path: 'admin_chat_01_list.png' });

        console.log("Selecting first conversation...");
        // Click the first button in the sidebar
        const convButton = page.locator('button.w-full.text-left').first();
        if (await convButton.count() > 0) {
            await convButton.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'admin_chat_02_selected.png' });

            console.log("Starting Takeover...");
            await page.click('button:has-text("Start Takeover")');
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'admin_chat_03_takeover.png' });

            console.log("Sending Admin Reply...");
            await page.fill('input[placeholder="Type as Admin..."]', 'This is an official Admin Warning.');
            await page.click('button:has-text("Send")');
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'admin_chat_04_replied.png' });

            console.log("Ending Takeover...");
            await page.click('button:has-text("End Takeover")');
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'admin_chat_05_ended.png' });
        } else {
            console.log("No conversations found to test.");
        }

        console.log("Admin chat control test completed successfully.");

    } catch (e) {
        console.error("Test failed:", e);
        await page.screenshot({ path: 'admin_chat_error.png' });
    } finally {
        await browser.close();
    }
})();
