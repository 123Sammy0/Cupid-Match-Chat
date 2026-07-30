import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vvncawczzdokrollsghn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bmNhd2N6emRva3JvbGxzZ2huIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTE2NTY3NiwiZXhwIjoyMTAwNzQxNjc2fQ.T0LQwuF1ZHeHom6e9yQY0JEq9Z7Vki7qnIZ-ZhhNYxY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Update bucket to public
  const { error: updateErr } = await supabase.storage.updateBucket('chat-media', {
    public: true,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg']
  });
  if (updateErr) console.error('Update bucket error:', updateErr);
  else console.log('✅ Bucket updated to public');

  // Create storage policies using raw SQL via rpc
  // We need to allow authenticated users to upload and read
  const policies = [
    `CREATE POLICY IF NOT EXISTS "Authenticated users can upload media"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'chat-media');`,
    `CREATE POLICY IF NOT EXISTS "Anyone can view chat media"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'chat-media');`,
    `CREATE POLICY IF NOT EXISTS "Users can delete own media"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'chat-media' AND auth.uid()::text = owner);`
  ];

  for (const sql of policies) {
    // Can't run raw SQL via REST, we'll use the service role to directly manage storage
    console.log('Policy SQL (run in Supabase SQL editor):', sql);
  }

  console.log('\n✅ Done! Please run the above SQL in your Supabase SQL Editor under Database > SQL Editor');
}
run();
