import { createClient } from '@supabase/supabase-js';

// Load env vars manually
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vvncawczzdokrollsghn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bmNhd2N6emRva3JvbGxzZ2huIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTE2NTY3NiwiZXhwIjoyMTAwNzQxNjc2fQ.T0LQwuF1ZHeHom6e9yQY0JEq9Z7Vki7qnIZ-ZhhNYxY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking messages in DB...");
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Latest messages:", data);
  }
}
run();
