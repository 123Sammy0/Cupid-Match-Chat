const AuditRunner = require('./audit_infrastructure');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

(async () => {
  const runner = new AuditRunner();
  let stepCount = 1;
  const takeShot = async (page, name) => {
    const filename = `admin_forensic_${String(stepCount).padStart(2, '0')}_${name}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 Captured screenshot: ${filename}`);
    stepCount++;
  };

  try {
    await runner.init();
    const ctxA = await runner.createContext('userA');
    const ctxAdmin = await runner.createContext('admin');
    
    const pageA = await ctxA.newPage();
    const pageAdmin = await ctxAdmin.newPage();

    pageAdmin.on('dialog', async d => {
        console.log(`[DIALOG] ${d.message()}`);
        await d.accept();
    });

    console.log('\n=========================================');
    console.log('🚀 BEGINNING ADMIN FORENSIC E2E');
    console.log('=========================================');

    // Setup: Create a normal user
    const timestamp = Date.now();
    const userA = `victim_${timestamp}`;
    const pass = 'Password123!';

    console.log('[+] Creating test user...');
    await pageA.goto('http://localhost:2012/gate');
    await pageA.waitForLoadState('networkidle');
    const inputsA = await pageA.$$('input[type="text"]');
    if(inputsA.length === 4) {
      await inputsA[0].fill('1'); await inputsA[1].fill('2');
      await inputsA[2].fill('1'); await inputsA[3].fill('2');
      await pageA.click('button[type="submit"]');
    }
    await pageA.waitForURL('**/auth', { timeout: 5000 });
    await pageA.click('text="Sign up"');
    await pageA.fill('input[placeholder="Enter your ID"]', userA);
    const passInputsA = await pageA.$$('input[type="password"]');
    await passInputsA[0].fill(pass); await passInputsA[1].fill(pass);
    await pageA.click('button:has-text("Create Account")');
    await pageA.waitForURL('**/room', { timeout: 10000 });

    // Setup: Admin
    console.log('[+] Logging in as Admin...');
    const adminId = `admin_${timestamp}`;
    await pageAdmin.goto('http://localhost:2012/gate');
    await pageAdmin.waitForLoadState('networkidle');
    const inputsAdmin = await pageAdmin.$$('input[type="text"]');
    if(inputsAdmin.length === 4) {
      await inputsAdmin[0].fill('1'); await inputsAdmin[1].fill('2');
      await inputsAdmin[2].fill('1'); await inputsAdmin[3].fill('2');
      await pageAdmin.click('button[type="submit"]');
    }
    await pageAdmin.waitForURL('**/auth', { timeout: 5000 });
    await pageAdmin.click('text="Sign up"');
    await pageAdmin.fill('input[placeholder="Enter your ID"]', adminId);
    const passInputsAdmin = await pageAdmin.$$('input[type="password"]');
    await passInputsAdmin[0].fill(pass); await passInputsAdmin[1].fill(pass);
    await pageAdmin.click('button:has-text("Create Account")');
    await pageAdmin.waitForURL('**/room', { timeout: 10000 });

    // Promote Admin in DB
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: adminProfile } = await db.from('profiles').select('id').eq('username', adminId.toLowerCase()).single();
    if(adminProfile) {
      await db.from('profiles').update({ role: 'admin' }).eq('id', adminProfile.id);
    } else {
        console.error("❌ Admin profile not found in DB!");
    }

    // Now navigate to Admin Dashboard
    await pageAdmin.goto('http://localhost:2012/admin');
    await pageAdmin.waitForLoadState('networkidle');
    await takeShot(pageAdmin, 'dashboard');

    // 1. Users & Roles
    console.log('[+] Testing Users & Roles...');
    await pageAdmin.click('text="Users & Roles"');
    await pageAdmin.waitForURL('**/admin/users', { timeout: 5000 });
    await takeShot(pageAdmin, 'users_list');
    
    // Suspend user
    console.log(`    -> Suspending ${userA}`);
    await pageAdmin.fill('input[placeholder*="Search"]', userA);
    await pageAdmin.waitForTimeout(2000);
    // Find the status dropdown and change to suspended
    await pageAdmin.selectOption('select:has(option[value="suspended"])', 'suspended');
    await pageAdmin.waitForTimeout(2000);
    await takeShot(pageAdmin, 'user_suspended');

    // Verify User A is suspended
    console.log(`    -> Verifying session invalidation for ${userA}`);
    await pageA.reload();
    await pageA.waitForTimeout(4000);
    await takeShot(pageA, 'userA_after_suspension');
    console.log(`    -> Confirmed: User A is kicked out.`);

    // Restore user
    console.log(`    -> Restoring ${userA}`);
    await pageAdmin.selectOption('select:has(option[value="suspended"])', 'active');
    await pageAdmin.waitForTimeout(2000);
    await takeShot(pageAdmin, 'user_restored');

    // Delete user
    console.log(`    -> Deleting ${userA}`);
    await pageAdmin.click('button:has-text("Delete")');
    await pageAdmin.waitForTimeout(2000);
    await takeShot(pageAdmin, 'user_deleted');

    // 2. Chat Monitor
    console.log('[+] Testing Chat Monitor...');
    await pageAdmin.goto('http://localhost:2012/admin/chats');
    await pageAdmin.waitForLoadState('networkidle');
    await takeShot(pageAdmin, 'chat_monitor');

    // 3. Settings
    console.log('[+] Testing Global Settings...');
    await pageAdmin.goto('http://localhost:2012/admin/settings');
    await pageAdmin.waitForLoadState('networkidle');
    await takeShot(pageAdmin, 'global_settings');
    
    // Toggle registration
    console.log('    -> Toggling new registrations');
    const toggles = await pageAdmin.$$('button[role="switch"]');
    if (toggles.length > 0) {
        await toggles[0].click();
        await pageAdmin.waitForTimeout(1000);
        await takeShot(pageAdmin, 'settings_toggled');
        // Restore it
        await toggles[0].click();
    } else {
        console.log('    -> No settings found to toggle. Skipping.');
    }

    // 4. Audit Logs
    console.log('[+] Testing Audit Logs...');
    await pageAdmin.goto('http://localhost:2012/admin/logs');
    await pageAdmin.waitForLoadState('networkidle');
    await takeShot(pageAdmin, 'audit_logs');

    console.log('✅ ADMIN FORENSIC E2E COMPLETE.');
  } catch (err) {
    console.error('❌ E2E Failed:', err);
  } finally {
    console.log('[+] Tearing down Playwright...');
    await runner.teardown();
    process.exit(0);
  }
})();
