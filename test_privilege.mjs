import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runTest() {
  // 1. Sign in as standard user
  console.log('Signing in as a standard user...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'hacker@cupid.com',
    password: 'password123'
  });

  if (authErr) {
    console.error('Login failed. Registering first...');
    const { data: regData, error: regErr } = await supabase.auth.signUp({
      email: 'hacker@cupid.com',
      password: 'password123',
    });
    
    if (regErr) {
      console.error('Registration failed:', regErr.message);
      return;
    }
    console.log('Registered successfully! Setting username...');
    // We can't update username via auth, need to use backend action, but wait, 
    // the system creates the profile on register via trigger or action? Let's check how registration works.
  }

  // 2. Try to update role
  console.log('Attempting to elevate privileges to super_admin...');
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'super_admin' })
    .eq('id', (await supabase.auth.getUser()).data.user.id)
    .select();

  if (error) {
    console.error('Exploit failed:', error.message);
  } else {
    console.log('Exploit succeeded! Profile data:', data);
  }
}

runTest();
