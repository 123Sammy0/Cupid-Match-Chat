import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function testSuspension() {
  const email = 'audit_suspension@cupid.com';
  const password = 'password123';
  
  // Clean up if it exists
  const { data: { users } } = await adminClient.auth.admin.listUsers();
  const existing = users.find(u => u.email === email);
  if (existing) await adminClient.auth.admin.deleteUser(existing.id);

  console.log("1. Creating test user...");
  const { data: authData } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  const userId = authData.user.id;
  await adminClient.from('profiles').insert({
    id: userId,
    username: 'audit_suspension',
    role: 'user',
    active: true
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("2. Bypassing gate...");
  await page.goto('http://localhost:2012/gate');
  await page.fill('input[type="text"]', '1212'); // Or try fetching gate_password
  await page.click('button:has-text("Enter")');
  await page.waitForTimeout(1000);

  console.log("3. Logging in as user...");
  await page.goto('http://localhost:2012/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  
  const urlAfterLogin = page.url();
  console.log("Logged in? URL:", urlAfterLogin);

  console.log("4. Suspending user...");
  await adminClient.from("profiles").update({ 
    is_suspended: true,
    active: false
  }).eq("id", userId);

  console.log("5. Testing navigation while suspended...");
  await page.goto('http://localhost:2012/settings');
  await page.waitForTimeout(2000);
  console.log("Navigated to settings. Current URL:", page.url());

  // Wait, let's see if we can do an API call
  console.log("Cleaning up...");
  await browser.close();
  await adminClient.auth.admin.deleteUser(userId);
}

testSuspension().catch(console.error);
