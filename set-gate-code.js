const { createClient } = require('@supabase/supabase-js');
const url = 'https://vvncawczzdokrollsghn.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bmNhd2N6emRva3JvbGxzZ2huIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTE2NTY3NiwiZXhwIjoyMTAwNzQxNjc2fQ.T0LQwuF1ZHeHom6e9yQY0JEq9Z7Vki7qnIZ-ZhhNYxY';
const supabase = createClient(url, key);

const crypto = require('crypto');
const hashedPin = crypto.createHash('sha256').update('1212').digest('hex');

supabase.from('app_settings').upsert({ key: 'access_code_verifier', value_encrypted: hashedPin })
  .then(res => console.log('Updated Gate Code to 1212!'));
