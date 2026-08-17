const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to localhost:2012...');
  try {
    await page.goto('http://localhost:2012', { waitUntil: 'networkidle' });
    
    const quietDoor = await page.$('#quietDoor');
    if (quietDoor) {
      await quietDoor.click();
      await page.waitForTimeout(2000);
    }
    
    if (page.url().includes('/gate')) {
      const inputs = await page.$$('input');
      if (inputs.length > 0) {
        for (let i = 0; i < Math.min(inputs.length, 4); i++) {
            await inputs[i].fill('1212'[i] || '');
        }
        await inputs[Math.min(inputs.length, 4) - 1].press('Enter');
        await page.waitForTimeout(3000);
      }
    }
    
    if (page.url().includes('/auth')) {
      const usernameInput = await page.$('input[type="text"]');
      const passwordInput = await page.$('input[type="password"]');
      
      if (usernameInput && passwordInput) {
        await usernameInput.fill('test');
        await passwordInput.fill('test');
        await passwordInput.press('Enter');
        await page.waitForTimeout(3000);
        
        if (page.url().includes('/auth')) {
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
             await suUser.fill('playwright_user_' + Date.now());
             await pwInputs[0].fill('pass123');
             await pwInputs[1].fill('pass123');
             
             const formBtns = await page.$$('button[type="submit"]');
             if(formBtns.length > 0) {
                 await formBtns[0].click();
             } else {
                 await pwInputs[1].press('Enter');
             }
             
             await page.waitForTimeout(4000);
          }
        }
      }
    }
    
    if (page.url().includes('/room')) {
      console.log('At Chat Home page. Success!');
      
      const html = await page.content();
      fs.writeFileSync('page_dump_room.html', html);
      console.log('Saved page_dump_room.html');
      
      // Let's also check for any button that looks like settings or profile
      const allLinks = await page.$$('a');
      for (const link of allLinks) {
          const href = await link.getAttribute('href');
          console.log('Found link:', href);
      }
    }
    
    console.log('Final URL:', page.url());
    
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
  }
})();
