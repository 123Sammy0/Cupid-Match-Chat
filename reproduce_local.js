const { chromium } = require('playwright');

(async () => {
  console.log('Starting Playwright reproduction script...');
  const browser = await chromium.launch({ headless: true });
  
  // Context 1: Sammy
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  
  // Context 2: Sam2
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();

  async function login(page, username, password) {
    await page.goto('http://localhost:3000/auth');
    await page.waitForSelector('input[placeholder="Enter your user ID"]', { timeout: 15000 }).catch(() => console.log('Already logged in or different view'));
    
    // Check if we need to login
    if (await page.isVisible('input[placeholder="Enter your user ID"]')) {
      await page.fill('input[placeholder="Enter your user ID"]', username);
      await page.fill('input[placeholder="Enter your password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/room', { timeout: 20000 });
    }
  }

  // 1. Login both users
  console.log('Logging in Sammy...');
  await login(page1, 'sammy', '1212');
  console.log('Logging in Sam2...');
  await login(page2, 'sam2', '1212');

  // 2. Both users go to the same chat room
  console.log('Sammy opening chat...');
  await page1.waitForSelector('text=sam2', { timeout: 10000 });
  await page1.click('text=sam2');
  await page1.waitForSelector('text=Message', { timeout: 10000 });

  console.log('Sam2 opening chat...');
  await page2.waitForSelector('text=sammy', { timeout: 10000 });
  await page2.click('text=sammy');
  await page2.waitForSelector('text=Message', { timeout: 10000 });

  // 3. Observe the header for Sammy (looking at Sam2's status)
  console.log('Observing status on Sammy screen (looking at Sam2)...');
  await page1.waitForTimeout(5000); // wait for presence to sync
  
  const getHeader = async (page) => {
    return await page.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) return 'No header';
      const textNodes = Array.from(header.querySelectorAll('span'));
      return textNodes.map(n => n.innerText).join(' | ');
    });
  };

  const status1 = await getHeader(page1);
  console.log('Sammy sees:', status1);

  // 4. Observe the header for Sam2 (looking at Sammy's status)
  console.log('Observing status on Sam2 screen (looking at Sammy)...');
  const status2 = await getHeader(page2);
  console.log('Sam2 sees:', status2);

  // 5. Test typing indicator
  console.log('Sammy typing...');
  await page1.fill('textarea', 'Hello from playwright!');
  await page2.waitForTimeout(1000);
  const status2Typing = await getHeader(page2);
  console.log('Sam2 sees while Sammy types:', status2Typing);

  // 6. Test message send latency
  console.log('Sammy sending message...');
  const start = Date.now();
  await page1.click('button:has(svg)'); // send button
  // Wait for message to appear on Sam2 screen
  await page2.waitForSelector('text=Hello from playwright!', { timeout: 15000 });
  const latency = Date.now() - start;
  console.log(`Message arrived at Sam2 in ${latency}ms`);

  // 7. Test leaving
  console.log('Sam2 closing tab...');
  await page2.close();
  
  await page1.waitForTimeout(5000); // wait for leave event
  const status1After = await getHeader(page1);
  console.log('Sammy sees after Sam2 leaves:', status1After);

  await browser.close();
})();
