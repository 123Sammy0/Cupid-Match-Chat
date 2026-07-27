"use server";

import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function loginAction(username: string, password: string) {
  try {
    const supabase = createAdminClient();
    
    // 2. Login via Supabase Auth
    const email = `${username.toLowerCase()}@cupid.local`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error || !data.user) {
      return { success: false, message: "The login details don’t match." };
    }

    // 3. Check active state
    const { data: profile } = await supabase.from('profiles').select('active').eq('id', data.user.id).single();
    if (!profile || !profile.active) {
      await supabase.auth.signOut();
      return { success: false, message: "Account disabled." };
    }
    
    // 4. Update last_login
    await supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', data.user.id);

    return { success: true };
  } catch (err) {
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function signupAction(username: string, password: string, roomCode: string) {
  try {
    const supabase = createAdminClient();

    // 1. Check max users (only 2 allowed)
    const { count } = await supabase.from('profiles').select('id', { count: 'exact' });
    if (count && count >= 2) {
      return { success: false, message: "Registration is closed." };
    }

    // 3. Create user in Supabase Auth
    const email = `${username.toLowerCase()}@cupid.local`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data.user) {
      return { success: false, message: error?.message || "Signup failed." };
    }

    // 4. Create profile
    const role = (count === 0) ? 'admin' : 'partner';
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username,
      role,
      active: true,
      last_login_at: new Date().toISOString()
    });

    if (profileError) {
      // rollback auth user creation if profile creation fails
      await supabase.auth.admin.deleteUser(data.user.id);
      return { success: false, message: "Failed to create profile." };
    }
    
    // 5. Set initial room code if first user
    if (role === 'admin' && roomCode) {
       const hashedRoom = crypto.createHash('sha256').update(roomCode).digest('hex');
       await supabase.from('app_settings').upsert({
         key: 'room_secret_verifier',
         value_encrypted: hashedRoom
       });
    }

    return { success: true };
  } catch (err) {
    return { success: false, message: "An unexpected error occurred." };
  }
}
