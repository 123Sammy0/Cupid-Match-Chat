const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  
  // Create two isolated contexts for two users
  const contextA = await browser.newContext({ viewport: { width: 800, height: 800 } });
  const contextB = await browser.newContext({ viewport: { width: 800, height: 800 } });
  
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  
  const userAName = 'user_A_' + Date.now();
  const userBName = 'user_B_' + Date.now();

  async function loginUser(page, username) {
    await page.goto('http://localhost:2012', { waitUntil: 'networkidle' });
    
    const quietDoor = await page.$('#quietDoor');
    if (quietDoor) {
      await quietDoor.click();
      await page.waitForTimeout(1000);
    }
    
    if (page.url().includes('/gate')) {
      const inputs = await page.$$('input');
      if (inputs.length > 0) {
        for (let i = 0; i < Math.min(inputs.length, 4); i++) {
            await inputs[i].fill('1212'[i] || '');
        }
        await inputs[Math.min(inputs.length, 4) - 1].press('Enter');
        await page.waitForTimeout(2000);
      }
    }
    
    if (page.url().includes('/auth')) {
      const btns = await page.$$('button');
      for (const btn of btns) {
        const text = await btn.innerText();
        if (text.trim().toLowerCase() === 'sign up') {
          await btn.click();
          break;
        }
      }
      await page.waitForTimeout(500);
      
      const suUser = await page.$('input[type="text"]');
      const pwInputs = await page.$$('input[type="password"]');
      if (suUser && pwInputs.length >= 2) {
         await suUser.fill(username);
         await pwInputs[0].fill('pass123');
         await pwInputs[1].fill('pass123');
         
         const formBtns = await page.$$('button[type="submit"]');
         if(formBtns.length > 0) {
             await formBtns[0].click();
         } else {
             await pwInputs[1].press('Enter');
         }
         await page.waitForTimeout(3000);
      }
    }
    console.log(`${username} logged in: ${page.url()}`);
  }

  try {
    console.log('Logging in User A and User B concurrently...');
    await Promise.all([
        loginUser(pageA, userAName),
        loginUser(pageB, userBName)
    ]);
    
    // User A initiates chat with User B
    console.log('User A initiating chat with User B...');
    
    // Find new chat button
    let newChatBtn = await pageA.$('button[aria-label="New chat"]');
    if (!newChatBtn) {
        const btns = await pageA.$$('button');
        for(const b of btns) {
            const html = await b.innerHTML();
            if(html.includes('<svg') && (html.includes('plus') || html.includes('M12 5v14M5 12h14'))) {
                newChatBtn = b;
                break;
            }
        }
    }
    
    if (newChatBtn) {
        await newChatBtn.click();
        await pageA.waitForTimeout(1000);
        
        // Search for User B inside modal
        const searchInput = await pageA.waitForSelector('input[placeholder="Search by username..."]', { timeout: 5000 }).catch(() => null);
        if (searchInput) {
            await searchInput.fill(userBName);
            await pageA.waitForTimeout(2000); // wait for search api
            
            // Click User B
            const resultUser = await pageA.waitForSelector(`text=${userBName}`, { timeout: 10000 }).catch(() => null);
            if (resultUser) {
                await resultUser.click();
                await pageA.waitForSelector('input[placeholder="Message…"], textarea', { timeout: 15000 }).catch(() => console.log('Timeout waiting for chat input A'));
                await pageA.waitForTimeout(1000);
                console.log(`User A entered room: ${pageA.url()}`);
                await pageA.screenshot({ path: 'multi_01_room_A.png' });
            } else {
                console.log("Could not find User B in search results!");
            }
        } else {
            console.log("Could not find modal search input!");
        }
    }
    
    // Send message from User A
    console.log('User A sending a message...');
    const chatInputA = await pageA.$('input[placeholder="Message…"], textarea');
    if (chatInputA) {
        await chatInputA.fill('Hello User B, this is a real-time test!');
        await chatInputA.press('Enter');
        await pageA.waitForTimeout(1000);
        await pageA.screenshot({ path: 'multi_02_msg_A.png' });
    }
    
    // User B receives it
    console.log('User B checking for new chat...');
    await pageB.reload(); // Reload chat home to see new conversation
    await pageB.waitForTimeout(2000);
    
    const convoA = await pageB.$(`text=${userAName}`);
    if (convoA) {
        await convoA.click();
        await pageB.waitForSelector('input[placeholder="Message…"], textarea', { timeout: 15000 }).catch(() => console.log('Timeout waiting for chat input B'));
        await pageB.waitForTimeout(1000);
        console.log(`User B entered room: ${pageB.url()}`);
        await pageB.screenshot({ path: 'multi_03_room_B.png' });
    } else {
        console.log("User B couldn't find User A's conversation.");
    }
    
    // User B replies
    console.log('User B sending a reply...');
    const chatInputB = await pageB.$('input[placeholder="Message…"], textarea');
    if (chatInputB) {
        await chatInputB.fill('I received your message, User A!');
        await chatInputB.press('Enter');
        await pageB.waitForTimeout(2000);
        await pageB.screenshot({ path: 'multi_04_reply_B.png' });
    }
    
    // Check if User A received it
    console.log('Checking if User A received the reply in real-time...');
    await pageA.waitForTimeout(2000);
    await pageA.screenshot({ path: 'multi_05_received_A.png' });
    
    // User A uploads an image
    console.log('User A uploading a test image...');
    
    // We need to click the + button to open attachment menu, or just set input files if the input is in DOM
    const fileInputs = await pageA.$$('input[type="file"]');
    if (fileInputs.length > 0) {
        
        // Find the image upload input. It usually accepts images
        for (const input of fileInputs) {
            const accept = await input.getAttribute('accept');
            if (accept && accept.includes('image')) {
                await input.setInputFiles('test_image.png');
                break;
            }
        }
        await pageA.waitForTimeout(2000); // Wait for preview
        await pageA.screenshot({ path: 'multi_06_preview_A.png' });
        
        // Hit send (enter on chat input or send button)
        if (chatInputA) {
            await chatInputA.press('Enter');
        }
        
        await pageA.waitForTimeout(3000); // Wait for upload and render
        await pageA.screenshot({ path: 'multi_07_sent_image_A.png' });
    }
    
    // Check User B
    console.log('User B checking for image...');
    await pageB.waitForTimeout(2000);
    await pageB.screenshot({ path: 'multi_08_received_image_B.png' });
    
    console.log('Multi-user test completed.');
    
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    // Wait a bit to observe
    await new Promise(r => setTimeout(r, 3000));
    await browser.close();
  }
})();
