const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ headless: true });
  const c = await b.newContext();
  const p = await c.newPage();
  await p.goto('http://localhost:2012/admin-login');
  await p.waitForTimeout(3000);
  const cssUrl = await p.evaluate(() => {
    const link = document.querySelector('link[rel="stylesheet"]');
    return link ? link.href : null;
  });
  console.log('CSS URL:', cssUrl);
  if (cssUrl) {
    const content = await p.evaluate(async (url) => {
      const r = await fetch(url);
      return (await r.text()).substring(0, 5000);
    }, cssUrl);
    console.log('CSS CONTENT:', content);
  }
  await b.close();
})().catch(e => console.error('FAIL:', e.message));
