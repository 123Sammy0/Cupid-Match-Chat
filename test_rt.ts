import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vvncawczzdokrollsghn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bmNhd2N6emRva3JvbGxzZ2huIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTE2NTY3NiwiZXhwIjoyMTAwNzQxNjc2fQ.T0LQwuF1ZHeHom6e9yQY0JEq9Z7Vki7qnIZ-ZhhNYxY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Testing realtime subscription...");
  
  const channel = supabase.channel('test-rt-2')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public', 
      table: 'messages'
    }, (payload) => {
      console.log("✅ REALTIME WORKING! Got message:", payload.new);
    })
    .subscribe((status) => {
      console.log("Subscription status:", status);
      if (status === 'SUBSCRIBED') {
        console.log("✅ Successfully subscribed! Inserting test message...");
        supabase.from('messages').insert({
          sender_id: 'adcf5443-1737-4ada-8350-8af763a9dfea',
          conversation_id: '05fd8e56-3629-4991-8d8d-7b55e450704b',
          content: 'REALTIME_TEST_' + Date.now(),
          type: 'text',
          expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
        }).then(({ error }) => {
          if (error) console.error("Insert error:", error.message, error.code);
          else console.log("✅ Test message inserted! Waiting for realtime event...");
        });
      } else if (status === 'CHANNEL_ERROR') {
        console.error("❌ CHANNEL ERROR!");
      } else if (status === 'TIMED_OUT') {
        console.error("❌ TIMED OUT!");
      }
    });
  
  await new Promise(r => setTimeout(r, 8000));
  await supabase.removeChannel(channel);
  console.log("Done - if no ✅ REALTIME WORKING above, realtime is NOT configured on Supabase.");
  process.exit(0);
}

run();
