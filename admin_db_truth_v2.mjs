// Database Truth Inventory Script
// Queries real Supabase production data via service role key
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function run() {
  console.log('='.repeat(80));
  console.log('CUPID MATCH CHAT — DATABASE TRUTH INVENTORY');
  console.log('Timestamp:', new Date().toISOString());
  console.log('='.repeat(80));

  // 1. Auth Users
  const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const authUserCount = authUsers?.users?.length || 0;
  console.log(`\n[auth.users] Total auth accounts: ${authUserCount}`);
  if (authUsers?.users) {
    const banned = authUsers.users.filter(u => u.banned_until && new Date(u.banned_until) > new Date());
    console.log(`  - Banned (active ban): ${banned.length}`);
    console.log(`  - Not banned: ${authUserCount - banned.length}`);
    authUsers.users.forEach(u => {
      const isBanned = u.banned_until && new Date(u.banned_until) > new Date();
      console.log(`    * ${u.email} | ID: ${u.id.substring(0,8)}... | Created: ${u.created_at} | Banned: ${isBanned ? 'YES' : 'no'}`);
    });
  }

  // 2. Profiles
  const { count: totalProfiles } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { count: activeProfiles } = await supabase.from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_suspended', false)
    .is('deleted_at', null);
  const { count: suspendedProfiles } = await supabase.from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('is_suspended', true)
    .is('deleted_at', null);
  const { count: deletedProfiles } = await supabase.from('profiles')
    .select('*', { count: 'exact', head: true })
    .not('deleted_at', 'is', null);
  const { data: profilesList } = await supabase.from('profiles')
    .select('id, username, role, active, is_suspended, deleted_at, created_at');

  console.log(`\n[public.profiles] Total: ${totalProfiles}`);
  console.log(`  - Active (not suspended, not deleted): ${activeProfiles}`);
  console.log(`  - Suspended (not deleted): ${suspendedProfiles}`);
  console.log(`  - Deleted (deleted_at set): ${deletedProfiles}`);
  if (profilesList) {
    profilesList.forEach(p => {
      const status = p.deleted_at ? 'DELETED' : p.is_suspended ? 'SUSPENDED' : 'ACTIVE';
      console.log(`    * ${p.username} | Role: ${p.role} | Status: ${status} | ID: ${p.id.substring(0,8)}...`);
    });
  }

  // 3. Conversations
  const { count: totalConvs } = await supabase.from('conversations').select('*', { count: 'exact', head: true });
  console.log(`\n[public.conversations] Total: ${totalConvs}`);

  // 4. Conversation Participants
  const { count: totalParts } = await supabase.from('conversation_participants').select('*', { count: 'exact', head: true });
  console.log(`[public.conversation_participants] Total: ${totalParts}`);

  // 5. Messages
  const { count: totalMsgs } = await supabase.from('messages').select('*', { count: 'exact', head: true });
  const { count: imageMsgs } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('type', 'image');
  const { count: videoMsgs } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('type', 'video');
  const { count: audioMsgs } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('type', 'audio');
  const { count: docMsgs } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('type', 'file');
  const { count: voiceMsgs } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('type', 'voice');
  const { count: docMsgs2 } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('type', 'document');
  console.log(`\n[public.messages] Total: ${totalMsgs}`);
  console.log(`  - image: ${imageMsgs}`);
  console.log(`  - video: ${videoMsgs}`);
  console.log(`  - audio: ${audioMsgs}`);
  console.log(`  - voice: ${voiceMsgs}`);
  console.log(`  - file: ${docMsgs}`);
  console.log(`  - document: ${docMsgs2}`);

  // 6. Storage - via Storage API
  console.log(`\n[storage] Querying via Storage API...`);
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  if (bucketErr) {
    console.log(`  Bucket listing failed: ${bucketErr.message}`);
  } else {
    console.log(`  Buckets found: ${buckets?.length || 0}`);
    for (const bucket of (buckets || [])) {
      console.log(`  Bucket: ${bucket.name} (id: ${bucket.id}, public: ${bucket.public})`);
      let totalBytes = 0;
      let fileCount = 0;
      const typeMap = { image: 0, video: 0, audio: 0, document: 0, other: 0 };
      const typeSizeMap = { image: 0, video: 0, audio: 0, document: 0, other: 0 };

      async function listRecursive(path) {
        const { data: items, error: listErr } = await supabase.storage.from(bucket.name).list(path, { limit: 1000 });
        if (listErr) {
          console.log(`    List error at ${path}: ${listErr.message}`);
          return;
        }
        for (const item of (items || [])) {
          const fullPath = path ? `${path}/${item.name}` : item.name;
          if (item.id) {
            fileCount++;
            const size = item.metadata?.size || 0;
            totalBytes += size;
            const mime = (item.metadata?.mimetype || '').toLowerCase();
            if (mime.startsWith('image/')) { typeMap.image++; typeSizeMap.image += size; }
            else if (mime.startsWith('video/')) { typeMap.video++; typeSizeMap.video += size; }
            else if (mime.startsWith('audio/')) { typeMap.audio++; typeSizeMap.audio += size; }
            else if (mime.includes('pdf') || mime.includes('document') || mime.includes('zip') || mime.includes('text')) { typeMap.document++; typeSizeMap.document += size; }
            else { typeMap.other++; typeSizeMap.other += size; }
          } else {
            await listRecursive(fullPath);
          }
        }
      }
      await listRecursive('');
      console.log(`    Total files: ${fileCount}`);
      console.log(`    Total size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB (${totalBytes} bytes)`);
      for (const [type, count] of Object.entries(typeMap)) {
        console.log(`      ${type}: ${count} files, ${(typeSizeMap[type] / 1024 / 1024).toFixed(2)} MB`);
      }
    }
  }

  // 7. Feature Flags
  const { data: flags } = await supabase.from('feature_flags').select('*');
  console.log(`\n[public.feature_flags] Total: ${flags?.length || 0}`);
  (flags || []).forEach(f => {
    console.log(`  * ${f.key}: enabled=${f.enabled}, value=${JSON.stringify(f.value)}`);
  });

  // 8. Admin Audit Logs
  let auditCount = 0;
  const { count: al1, error: al1Err } = await supabase.from('admin_audit_logs').select('*', { count: 'exact', head: true });
  if (!al1Err) {
    auditCount = al1 || 0;
    console.log(`\n[public.admin_audit_logs] Total: ${auditCount}`);
  } else {
    const { count: al2, error: al2Err } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true });
    if (!al2Err) {
      auditCount = al2 || 0;
      console.log(`\n[public.audit_logs] Total: ${auditCount}`);
    } else {
      console.log(`\n[audit logs] Neither table accessible`);
    }
  }

  // 9. Admin Takeovers
  const { count: takeovers, error: tkErr } = await supabase.from('admin_takeovers').select('*', { count: 'exact', head: true });
  if (!tkErr) console.log(`[public.admin_takeovers] Total: ${takeovers}`);

  // 10. Couple Games
  const { count: games, error: gErr } = await supabase.from('couple_games').select('*', { count: 'exact', head: true });
  if (!gErr) console.log(`[public.couple_games] Total: ${games}`);

  console.log('\n' + '='.repeat(80));
  console.log('TRUTH INVENTORY COMPLETE');
  console.log('='.repeat(80));
}

run().catch(console.error);
