import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const userClient = createClient(supabaseUrl, supabaseAnonKey);

async function testRlsBypass() {
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const email = `audit_rls_${randomSuffix}@cupid.com`;
  const username = `audit_rls_${randomSuffix}`;
  const password = 'password123';
  
  // Clean up
  const { data: { users } } = await adminClient.auth.admin.listUsers();
  const existing = users.find(u => u.email === email);
  if (existing) await adminClient.auth.admin.deleteUser(existing.id);

  console.log("1. Creating user...");
  const { data: authData } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { username } });
  const userId = authData.user.id;
  const { error: profErr } = await adminClient.from('profiles').insert({ id: userId, username, role: 'partner', active: true });
  if (profErr) console.error("Profile insert err:", profErr);

  console.log("2. Logging in...");
  const { data: loginData } = await userClient.auth.signInWithPassword({ email, password });
  const token = loginData.session.access_token;
  
  console.log("3. Creating a conversation...");
  const { data: convData, error: adminErr } = await adminClient.from('conversations').insert({}).select().single();
  if (adminErr) console.error("Admin insert error:", adminErr);
  const { error: partErr } = await adminClient.from('conversation_participants').insert({ conversation_id: convData.id, profile_id: userId });
  if (partErr) console.error("Participant insert error:", partErr);

  console.log("4. Banning user...");
  await adminClient.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
  await adminClient.from("profiles").update({ is_suspended: true, active: false }).eq("id", userId);

  console.log("5. Testing direct database insert while banned...");
  // Use the same user client which has the JWT
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  const { data: msgData, error: msgErr } = await userClient.from('messages').insert({
    conversation_id: convData.id,
    sender_id: userId,
    content: 'Hello from suspended user bypassing proxy!',
    type: 'text',
    expires_at: expiresAt.toISOString()
  }).select();

  if (msgErr) {
    console.log("Insert blocked by RLS:", msgErr.message);
  } else {
    console.log("VULNERABILITY FOUND: Insert SUCCEEDED! Message ID:", msgData[0].id);
  }

  // Cleanup
  await adminClient.auth.admin.deleteUser(userId);
}

testRlsBypass().catch(console.error);
