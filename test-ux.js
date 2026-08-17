const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  // Launch in HEADED mode as requested
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  console.log('Navigating to localhost:2012...');
  try {
    await page.goto('http://localhost:2012', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'ux_01_root.png', fullPage: true });
    
    const quietDoor = await page.$('#quietDoor');
    if (quietDoor) {
      await quietDoor.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'ux_02_gate.png', fullPage: true });
    }
    
    if (page.url().includes('/gate')) {
      const inputs = await page.$$('input');
      if (inputs.length > 0) {
        for (let i = 0; i < Math.min(inputs.length, 4); i++) {
            await inputs[i].fill('1212'[i] || '');
        }
        await page.screenshot({ path: 'ux_03_gate_filled.png' });
        await inputs[Math.min(inputs.length, 4) - 1].press('Enter');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'ux_04_auth.png', fullPage: true });
      }
    }
    
    if (page.url().includes('/auth')) {
      const usernameInput = await page.$('input[type="text"]');
      const passwordInput = await page.$('input[type="password"]');
      
      if (usernameInput && passwordInput) {
        // Switch to signup immediately to avoid failing login
        const btns = await page.$$('button');
        for (const btn of btns) {
          const text = await btn.innerText();
          if (text.trim().toLowerCase() === 'sign up') {
            await btn.click();
            break;
          }
        }
        await page.waitForTimeout(1000);
        
        const suUser = await page.$('input[type="text"]');
        const pwInputs = await page.$$('input[type="password"]');
        if (suUser && pwInputs.length >= 2) {
           await suUser.fill('ux_user_' + Date.now());
           await pwInputs[0].fill('pass123');
           await pwInputs[1].fill('pass123');
           await page.screenshot({ path: 'ux_05_auth_signup.png' });
           
           const formBtns = await page.$$('button[type="submit"]');
           if(formBtns.length > 0) {
               await formBtns[0].click();
           } else {
               await pwInputs[1].press('Enter');
           }
           await page.waitForTimeout(4000);
           await page.screenshot({ path: 'ux_06_room.png', fullPage: true });
        }
      }
    }
    
    if (page.url().includes('/room')) {
      // Test New Chat / Add Member modal
      const newChatBtn = await page.$('button[title="New Chat"], button[aria-label="New Chat"]');
      if (!newChatBtn) {
          // Look for any button with a plus icon
          const btns = await page.$$('button');
          for(const b of btns) {
              const html = await b.innerHTML();
              if(html.includes('<svg') && (html.includes('plus') || html.includes('M12 5v14M5 12h14'))) {
                  await b.click();
                  await page.waitForTimeout(2000);
                  await page.screenshot({ path: 'ux_07_new_chat.png' });
                  await page.reload();
                  await page.waitForTimeout(2000);
                  break;
              }
          }
      }
      
      // Navigate to Settings
      const settingsBtn = await page.$('button[aria-label="Settings"]');
      if (settingsBtn) {
        await settingsBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'ux_08_settings.png', fullPage: true });
      }
    }
    
    console.log('Final URL:', page.url());
    
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
  }
})();
