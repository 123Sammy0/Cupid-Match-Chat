import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const userClient = createClient(supabaseUrl, supabaseAnonKey);

async function testDeletion() {
  const email = 'audit_deletion@cupid.com';
  const password = 'password123';
  
  console.log("1. Creating user...");
  const { data: authData, error: authErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (authErr) {
    console.error("Failed to create user:", authErr);
    return;
  }
  const userId = authData.user.id;
  console.log("User created with ID:", userId);

  console.log("2. Inserting profile...");
  await adminClient.from('profiles').insert({
    id: userId,
    username: 'audit_deletion',
    role: 'user',
    active: true
  });

  console.log("3. Logging in as user...");
  const { data: loginData, error: loginErr } = await userClient.auth.signInWithPassword({
    email,
    password
  });
  
  if (loginErr) {
    console.error("Login failed:", loginErr);
    return;
  }
  const session = loginData.session;
  console.log("Session obtained.");

  console.log("4. Simulating deleteUser server action...");
  const timestamp = Date.now();
  const randomizedEmail = `deleted_${userId.replace(/-/g, '')}_${timestamp}@cupid.com`;
  
  await adminClient.from("profiles").update({ 
    username: `audit_deletion_del_${timestamp}`,
    deleted_at: new Date().toISOString(),
    is_suspended: true,
    active: false
  }).eq("id", userId);

  await adminClient.auth.admin.updateUserById(userId, {
    email: randomizedEmail,
    ban_duration: "876000h"
  });
  console.log("User deleted/scrambled/banned.");

  console.log("5. Checking if old session is still valid...");
  const { data: userVerify, error: userVerifyErr } = await userClient.auth.getUser(session.access_token);
  if (userVerifyErr) {
    console.log("Old session validation result:", userVerifyErr.message);
  } else {
    console.log("WARNING: Old session is STILL VALID!", userVerify.user?.id);
  }

  console.log("6. Trying to login with old credentials...");
  const { data: loginData2, error: loginErr2 } = await userClient.auth.signInWithPassword({
    email,
    password
  });
  if (loginErr2) {
    console.log("Login blocked as expected:", loginErr2.message);
  } else {
    console.log("WARNING: Logged in with old credentials!");
  }

  console.log("7. Recreating user with same email...");
  const { data: authData3, error: authErr3 } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (authErr3) {
    console.error("Failed to recreate user:", authErr3.message);
  } else {
    console.log("Successfully recreated user with NEW ID:", authData3.user.id);
  }

  // Cleanup
  console.log("Cleaning up test data...");
  await adminClient.auth.admin.deleteUser(userId);
  if (authData3?.user) await adminClient.auth.admin.deleteUser(authData3.user.id);
}

testDeletion();
