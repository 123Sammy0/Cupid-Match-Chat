const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Setting up Admin User...");
  const email = "mdsaakib002@gmail.com";
  const password = "asdqwe123";

  // 1. Create or update user via Admin API
  let { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  let adminUser = users.find(u => u.email === email);

  if (!adminUser) {
    console.log("User not found, creating...");
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    adminUser = data.user;
  } else {
    console.log("User found, updating password and confirming...");
    const { error } = await supabase.auth.admin.updateUserById(adminUser.id, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
  }

  console.log("Admin user ready. ID:", adminUser.id);

  // 2. Ensure profile exists and role is super_admin
  console.log("Setting super_admin role in profiles...");
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: adminUser.id, email: email, role: 'super_admin' });
    
  if (profileError) throw profileError;

  console.log("Done.");
}

main().catch(console.error);
