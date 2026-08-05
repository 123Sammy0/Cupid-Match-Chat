const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/gate');
  
  // Login to gate
  await page.fill('input[type="password"]', '1212');
  await page.click('button');
  await page.waitForTimeout(1000);
  
  await page.goto('http://localhost:3000/room/0f9b5588-d435-487d-9734-bb35c8cdf0ce');
  await page.waitForTimeout(2000);
  
  // Send a text message to compare
  await page.fill('textarea', 'Hello this is a text message');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);

  const rects = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('.group.bg-black'));
    const docBubble = bubbles[0];
    const textBubble = bubbles[1];
    
    return {
      docBubble: docBubble ? docBubble.getBoundingClientRect() : null,
      docTail: docBubble ? docBubble.querySelector('svg').getBoundingClientRect() : null,
      textBubble: textBubble ? textBubble.getBoundingClientRect() : null,
      textTail: textBubble ? textBubble.querySelector('svg').getBoundingClientRect() : null,
      container: document.querySelector('.overflow-y-auto').getBoundingClientRect(),
      docClasses: docBubble ? docBubble.className : null,
      textClasses: textBubble ? textBubble.className : null
    };
  });
  
  console.log(JSON.stringify(rects, null, 2));
  
  await browser.close();
})();
