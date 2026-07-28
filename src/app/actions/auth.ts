"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function loginAction(username: string, password: string) {
  try {
    const supabase = createAdminClient();
    const authClient = await createClient();
    
    // 2. Login via Supabase Auth
    const email = `${username.toLowerCase()}@cupid.com`;
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });
    
    if (error || !data.user) {
      return { success: false, message: "The login details don’t match." };
    }

    // 3. Check active state
    const { data: profile } = await supabase.from('profiles').select('active').eq('id', data.user.id).single();
    if (!profile || !profile.active) {
      await authClient.auth.signOut();
      return { success: false, message: "Account disabled." };
    }
    
    // 4. Update last_login
    await supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', data.user.id);

    return { success: true };
  } catch (err) {
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function signupAction(username: string, password: string) {
  try {
    const supabase = createAdminClient();
    const authClient = await createClient();
    const cookieStore = await cookies();

    // 0. Verify gate was passed
    if (cookieStore.get('gate_passed')?.value !== 'true') {
      return { success: false, message: "Please enter the gate access code first." };
    }

    // 1. Check max users (only 2 allowed)
    const { count } = await supabase.from('profiles').select('id', { count: 'exact' });
    if (count && count >= 2) {
      return { success: false, message: "Registration is closed." };
    }

    // 3. Create user in Supabase Auth
    const email = `${username.toLowerCase()}@cupid.com`;
    const { data, error } = await authClient.auth.signUp({
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


    return { success: true };
  } catch (err) {
    return { success: false, message: "An unexpected error occurred." };
  }
}
