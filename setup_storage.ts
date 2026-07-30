import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vvncawczzdokrollsghn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bmNhd2N6emRva3JvbGxzZ2huIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTE2NTY3NiwiZXhwIjoyMTAwNzQxNjc2fQ.T0LQwuF1ZHeHom6e9yQY0JEq9Z7Vki7qnIZ-ZhhNYxY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Create the chat-media bucket if it doesn't exist
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  console.log("Existing buckets:", buckets?.map(b => b.name));
  
  const exists = buckets?.some(b => b.name === 'chat-media');
  if (!exists) {
    const { data, error } = await supabase.storage.createBucket('chat-media', {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/*', 'video/*', 'audio/*']
    });
    if (error) console.error("Create bucket error:", error);
    else console.log("✅ Created bucket 'chat-media':", data);
  } else {
    console.log("✅ Bucket 'chat-media' already exists!");
  }
}
run();
