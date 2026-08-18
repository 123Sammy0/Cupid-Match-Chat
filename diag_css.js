const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ headless: true });
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();

  await p.goto('http://localhost:2012/admin-login');
  await p.waitForTimeout(3000);

  // Fetch the actual CSS file content
  const cssUrls = await p.evaluate(() =>
    Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href)
  );
  console.log('CSS URLs:', JSON.stringify(cssUrls));

  // Check if 'flex' class generates flex display
  const flexTest = await p.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'flex';
    document.body.appendChild(el);
    const display = getComputedStyle(el).display;
    document.body.removeChild(el);
    return display;
  });
  console.log('flex class -> display:', flexTest);

  // Check if bg-base resolves
  const bgBaseTest = await p.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'bg-base';
    document.body.appendChild(el);
    const bg = getComputedStyle(el).backgroundColor;
    document.body.removeChild(el);
    return bg;
  });
  console.log('bg-base class -> bg:', bgBaseTest);

  // Check if h-screen resolves
  const hScreenTest = await p.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'h-screen';
    document.body.appendChild(el);
    const h = getComputedStyle(el).height;
    document.body.removeChild(el);
    return h;
  });
  console.log('h-screen class -> height:', hScreenTest);

  // Check the CSS for --color-base
  const colorBase = await p.evaluate(() => {
    return getComputedStyle(document.documentElement).getPropertyValue('--color-base');
  });
  console.log('--color-base CSS var:', colorBase);

  // What does @theme produce in v4?
  // In Tailwind v4, --color-base generates bg-base = background-color: var(--color-base)
  // But --color-base: var(--bg) needs --bg to be defined FIRST

  const allVars = await p.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    const vars = {};
    ['--bg', '--bg-alt', '--text', '--accent', '--color-base', '--color-surface', '--color-text-main', '--color-accent'].forEach(v => {
      vars[v] = style.getPropertyValue(v).trim();
    });
    return vars;
  });
  console.log('CSS vars:', JSON.stringify(allVars, null, 2));

  await b.close();
})().catch(e => console.error('FAIL:', e.message));
