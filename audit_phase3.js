const AuditRunner = require('./audit_infrastructure');

(async () => {
  const runner = new AuditRunner();
  
  try {
    await runner.init();
    const ctx = await runner.createContext('public');
    const page = await ctx.newPage();

    console.log('=== PHASE 3: PUBLIC & AUTH ===');

    // 1. Landing Page
    console.log('[+] Testing Landing Page...');
    await page.goto('http://localhost:2012');
    await page.waitForLoadState('networkidle');
    
    // Verify hero text
    const hasHero = await page.locator('text="Pages to keep,"').isVisible();
    if (!hasHero) throw new Error('Landing page hero text missing');
    
    // Test responsive
    console.log('[+] Testing Mobile Layout...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await page.setViewportSize({ width: 1440, height: 900 });

    // 2. Gate Entry
    console.log('[+] Testing Gate Entry...');
    await page.goto('http://localhost:2012/gate');
    await page.waitForLoadState('networkidle');

    // Test Incorrect Pass
    const inputs = await page.$$('input[type="text"]');
    if (inputs.length !== 4) throw new Error('Gate does not have 4 inputs');
    
    await inputs[0].fill('0');
    await inputs[1].fill('0');
    await inputs[2].fill('0');
    await inputs[3].fill('0');
    await page.click('button[type="submit"]');
    
    // Wait for error state
    await page.waitForSelector('.text-rose-600', { timeout: 5000 });
    console.log('    ✓ Incorrect pass rejected');

    // Test Correct Pass (default is 1212 for testing if not overridden)
    await inputs[0].fill('1');
    await inputs[1].fill('2');
    await inputs[2].fill('1');
    await inputs[3].fill('2');
    await page.click('button[type="submit"]');
    
    // Should navigate to /auth
    await page.waitForURL('**/auth', { timeout: 5000 });
    console.log('    ✓ Gate passed successfully');

    // 3. Auth Flow
    console.log('[+] Testing Auth Flow...');
    
    // Switch to Sign Up
    await page.click('text="Sign up"');
    await page.waitForTimeout(500);
    
    const timestamp = Date.now();
    const testUsername = `audittester_${timestamp}`;
    const testPass = 'Password123!';

    // Fill signup
    await page.fill('input[placeholder="Enter your ID"]', testUsername);
    const passInputs = await page.$$('input[type="password"]');
    await passInputs[0].fill(testPass); // Password
    await passInputs[1].fill(testPass); // Confirm Password
    
    await page.click('button:has-text("Create Account")');
    
    // Wait for successful redirect to room
    await page.waitForURL('**/room', { timeout: 10000 });
    console.log('    ✓ Signup successful');

    // Test Logout
    console.log('[+] Testing Logout...');
    await page.goto('http://localhost:2012/settings');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Log out")');
    
    // Should redirect to auth
    await page.waitForURL('**/auth', { timeout: 5000 });
    console.log('    ✓ Logout successful');

    // Test Login
    console.log('[+] Testing Login...');
    await page.fill('input[placeholder="Enter your ID"]', testUsername);
    await page.fill('input[placeholder="••••••••"]', testPass);
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('**/room', { timeout: 10000 });
    console.log('    ✓ Login successful');

    console.log('=== PHASE 3 COMPLETE ===');

  } catch (e) {
    console.error('TEST FAILED:', e);
    process.exit(1);
  } finally {
    await runner.teardown();
  }
})();
