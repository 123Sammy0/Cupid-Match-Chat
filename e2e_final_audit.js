const AuditRunner = require('./audit_infrastructure');
const fs = require('fs');

(async () => {
  const runner = new AuditRunner();
  let stepCount = 1;
  const takeShot = async (page, name) => {
    const filename = `final_audit_${String(stepCount).padStart(2, '0')}_${name}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 Captured screenshot: ${filename}`);
    stepCount++;
  };

  try {
    await runner.init();
    const ctxA = await runner.createContext('userA');
    const ctxB = await runner.createContext('userB');
    const ctxAdmin = await runner.createContext('admin');
    
    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();
    const pageAdmin = await ctxAdmin.newPage();

    pageAdmin.on('dialog', d => d.accept());

    console.log('\n=========================================');
    console.log('🚀 BEGINNING DEEP END-TO-END PRODUCT AUDIT');
    console.log('=========================================');

    // 1. Home / Landing
    console.log('[+] 1. Testing Home/Landing...');
    await pageA.goto('http://localhost:2012/');
    await pageA.waitForLoadState('networkidle');
    await takeShot(pageA, 'home_landing');

    // 2. Gate Entry
    console.log('[+] 2. Testing Gate Entry...');
    await pageA.goto('http://localhost:2012/gate');
    await pageA.waitForLoadState('networkidle');
    await takeShot(pageA, 'gate_entry');
    
    // Fill Gate
    const inputs = await pageA.$$('input[type="text"]');
    if(inputs.length === 4) {
      await inputs[0].fill('1');
      await inputs[1].fill('2');
      await inputs[2].fill('1');
      await inputs[3].fill('2');
      await pageA.click('button[type="submit"]');
      await pageA.waitForURL('**/auth', { timeout: 5000 });
      await takeShot(pageA, 'auth_loaded');
    } else {
      console.log('    ! Gate inputs not found as expected, skipping gate fill.');
    }

    // 3. Login/Signup - User A
    console.log('[+] 3. Creating User A...');
    const timestamp = Date.now();
    const userA = `alice_${timestamp}`;
    const userB = `bob_${timestamp}`;
    const admin = `admin_${timestamp}`;
    const pass = 'Password123!';

    await pageA.click('text="Sign up"');
    await pageA.fill('input[placeholder="Enter your ID"]', userA);
    const passInputs = await pageA.$$('input[type="password"]');
    await passInputs[0].fill(pass);
    await passInputs[1].fill(pass);
    await pageA.click('button:has-text("Create Account")');
    await pageA.waitForURL('**/room', { timeout: 10000 });
    await takeShot(pageA, 'userA_room_home');

    // Do the same for User B
    console.log('[+] Creating User B...');
    await pageB.goto('http://localhost:2012/gate');
    await pageB.waitForLoadState('networkidle');
    const inputsB = await pageB.$$('input[type="text"]');
    if(inputsB.length === 4) {
      await inputsB[0].fill('1');
      await inputsB[1].fill('2');
      await inputsB[2].fill('1');
      await inputsB[3].fill('2');
      await pageB.click('button[type="submit"]');
      await pageB.waitForURL('**/auth', { timeout: 5000 });
    }
    await pageB.click('text="Sign up"');
    await pageB.fill('input[placeholder="Enter your ID"]', userB);
    const passInputsB = await pageB.$$('input[type="password"]');
    await passInputsB[0].fill(pass);
    await passInputsB[1].fill(pass);
    await pageB.click('button:has-text("Create Account")');
    await pageB.waitForURL('**/room', { timeout: 10000 });
    await takeShot(pageB, 'userB_room_home');

    // 4. Search and New Chat
    console.log('[+] 4. Testing Search & New Chat...');
    // We expect user B to be searchable by user A. Let's create a new chat.
    await pageA.click('button[aria-label="New chat"]'); 
    await pageA.waitForTimeout(1000);
    await takeShot(pageA, 'new_chat_modal');
    
    // We may need to find the specific input
    await pageA.fill('input[placeholder="Search by username..."]', userB);
    await pageA.waitForTimeout(2000);
    await takeShot(pageA, 'search_results');
    
    await pageA.click(`text="${userB}"`);
    await pageA.waitForTimeout(2000);
    await takeShot(pageA, 'conversation_opened');

    // 5. Send/Receive Messages
    console.log('[+] 5. Testing Send/Receive Messages...');
    await pageA.fill('input[placeholder*="Message"], textarea', 'Hello from Alice!');
    await pageA.keyboard.press('Enter');
    await pageA.waitForTimeout(2000);
    await takeShot(pageA, 'message_sent_alice');

    // Check User B
    console.log('[+] Verifying Message Received by B...');
    await pageB.waitForTimeout(1000);
    await takeShot(pageB, 'message_received_bob_home');
    
    // Bob opens chat
    await pageB.click(`text="${userA}"`);
    await pageB.waitForTimeout(1000);
    await takeShot(pageB, 'bob_conversation_open');
    
    // Bob replies
    await pageB.fill('input[placeholder*="Message"], textarea', 'Hi Alice, this is Bob!');
    await pageB.keyboard.press('Enter');
    await pageB.waitForTimeout(2000);
    await takeShot(pageB, 'message_sent_bob');

    // Verify Alice sees it
    await pageA.waitForTimeout(1000);
    await takeShot(pageA, 'alice_received_reply');

    // 6. Settings Flow
    console.log('[+] 6. Testing Settings Flow...');
    await pageA.goto('http://localhost:2012/settings');
    await pageA.waitForLoadState('networkidle');
    await takeShot(pageA, 'settings_page');
    
    // 7. Logout & Login again
    console.log('[+] 7. Testing Logout...');
    await pageA.evaluate(() => {
      // Clear all local storage / cache / supabase auth to force logout if UI is obscured
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await pageA.goto('http://localhost:2012/');
    await pageA.waitForLoadState('networkidle');
    await takeShot(pageA, 'logged_out_home');

    // 8. Admin Control Plane
    console.log('[+] 8. Creating & Testing Admin...');
    await pageAdmin.goto('http://localhost:2012/gate');
    const inputsAdmin = await pageAdmin.$$('input[type="text"]');
    if(inputsAdmin.length === 4) {
      await inputsAdmin[0].fill('1');
      await inputsAdmin[1].fill('2');
      await inputsAdmin[2].fill('1');
      await inputsAdmin[3].fill('2');
      await pageAdmin.click('button[type="submit"]');
      await pageAdmin.waitForURL('**/auth', { timeout: 5000 });
    }
    
    await pageAdmin.click('text="Sign up"');
    await pageAdmin.fill('input[placeholder="Enter your ID"]', admin);
    const passInputsAdmin = await pageAdmin.$$('input[type="password"]');
    await passInputsAdmin[0].fill(pass);
    await passInputsAdmin[1].fill(pass);
    await pageAdmin.click('button:has-text("Create Account")');
    await pageAdmin.waitForURL('**/room', { timeout: 10000 });
    
    // Promote Admin in DB
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const env = envFile.split('\n').reduce((acc, line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) acc[match[1]] = match[2].trim();
      return acc;
    }, {});
    const { createClient } = require('@supabase/supabase-js');
    const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: adminProfile } = await db.from('profiles').select('id').eq('username', admin.toLowerCase()).single();
    if(adminProfile) {
      await db.from('profiles').update({ role: 'admin' }).eq('id', adminProfile.id);
    }

    await pageAdmin.goto('http://localhost:2012/admin');
    await pageAdmin.waitForLoadState('networkidle');
    await takeShot(pageAdmin, 'admin_dashboard');

    console.log('[+] 9. Admin User Management (Suspend)...');
    await pageAdmin.click('text="Users & Roles"');
    await pageAdmin.waitForURL('**/admin/users', { timeout: 5000 });
    await takeShot(pageAdmin, 'admin_users_list');
    
    await pageAdmin.fill('input[placeholder*="Search"]', userB);
    await pageAdmin.waitForTimeout(2000);
    const row = pageAdmin.locator(`tr:has-text("${userB}")`);
    const selects = row.locator('select');
    if (await selects.count() >= 2) {
      await selects.nth(1).selectOption('suspended');
      await pageAdmin.waitForTimeout(2000);
    }
    await takeShot(pageAdmin, 'admin_user_suspended');

    console.log('[+] 10. Admin Chat Control & Takeover...');
    await pageAdmin.click('text="Chat Monitor"');

    await pageAdmin.waitForURL('**/admin/chats', { timeout: 5000 });
    await takeShot(pageAdmin, 'admin_chats_list');

    await pageAdmin.click(`button:has-text("${userB}")`);
    await pageAdmin.waitForTimeout(2000);
    await takeShot(pageAdmin, 'admin_chat_selected');

    // Admin Takeover Reply
    const textareas = await pageAdmin.$$('textarea');
    if(textareas.length > 0) {
      await textareas[0].fill('ADMIN WARNING: Violating TOS');
      await pageAdmin.click('button:has-text("Reply as Target")');
      await pageAdmin.waitForTimeout(2000);
      await takeShot(pageAdmin, 'admin_takeover_reply_sent');
    }

    console.log('[+] 11. Admin Settings & Logs...');
    await pageAdmin.click('text="Global Settings"');
    await pageAdmin.waitForURL('**/admin/settings', { timeout: 5000 });
    await takeShot(pageAdmin, 'admin_settings');

    await pageAdmin.click('text="Audit Logs"');
    await pageAdmin.waitForURL('**/admin/logs', { timeout: 5000 });
    await takeShot(pageAdmin, 'admin_audit_logs');

    console.log('✅ AUDIT SCRIPT COMPLETE.');

  } catch (err) {
    console.error('❌ Error during audit:', err);
  } finally {
    await runner.teardown();
  }
})();
