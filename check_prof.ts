import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vvncawczzdokrollsghn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bmNhd2N6emRva3JvbGxzZ2huIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTE2NTY3NiwiZXhwIjoyMTAwNzQxNjc2fQ.T0LQwuF1ZHeHom6e9yQY0JEq9Z7Vki7qnIZ-ZhhNYxY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking profiles...");
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username');
  console.log("Profiles:", data);
}
run();
