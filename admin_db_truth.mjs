import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log("=========================================");
  console.log("🔍 PHASE 1: DATABASE TRUTH RECONCILIATION");
  console.log("=========================================\n");

  // Helper to safely count
  async function safeCount(table, queryBuilder) {
    let q = supabase.from(table).select('*', { count: 'exact', head: false }).limit(1);
    if (queryBuilder) q = queryBuilder(q);
    
    const { data, count, error } = await q;
    if (error) {
       console.error(`[X] Error on ${table}:`, error.message, error.details, error.hint);
       return 'ERROR';
    }
    return count;
  }

  try {
    const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
    if (authErr) throw authErr;
    console.log(`[+] Total Auth Identities (auth.users): ${authUsers.users.length}`);

    console.log(`[+] Total Profiles (public.profiles):`, await safeCount('profiles'));
    
    console.log(`[+] Active Profiles:`, await safeCount('profiles', q => q.eq('is_suspended', false).is('deleted_at', null)));
    console.log(`[+] Suspended Profiles:`, await safeCount('profiles', q => q.eq('is_suspended', true).is('deleted_at', null)));
    console.log(`[+] Soft-Deleted Profiles:`, await safeCount('profiles', q => q.not('deleted_at', 'is', null)));
    
    console.log(`[+] Total Conversations:`, await safeCount('conversations'));
    console.log(`[+] Total Messages:`, await safeCount('messages'));
    
    console.log(`[+] Total Active Rooms:`, await safeCount('rooms', q => q.eq('is_active', true)));
    
    console.log(`[+] Messages containing Media:`, await safeCount('messages', q => q.not('file_url', 'is', null)));
    
    console.log(`[+] Total Audit Logs:`, await safeCount('audit_logs'));

    // Additional storage objects check if possible
    const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
    if (bErr) {
       console.error("[X] Storage error:", bErr.message);
    } else {
       console.log(`[+] Storage buckets found:`, buckets.map(b => b.name).join(", "));
       for (const b of buckets) {
          const { data: files } = await supabase.storage.from(b.name).list();
          console.log(`    - Bucket ${b.name}: ${files ? files.length : 'ERROR'} files`);
       }
    }

  } catch (err) {
    console.error("Database Truth Check Failed:", err.message);
  }
}

run();
