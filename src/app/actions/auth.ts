"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

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

    // 1. Check if first user to assign admin role
    const { count } = await supabase.from('profiles').select('id', { count: 'exact' });
    const role = (count === 0) ? 'admin' : 'partner';

    // 2. Format and validate username
    const cleanUsername = username.toLowerCase().replace(/\s+/g, '');
    const email = `${cleanUsername}@cupid.com`;

    // 3. Create user in Supabase Auth using Admin API (bypasses rate limits and auto-confirms)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      return { success: false, message: error?.message || "Signup failed." };
    }

    // 4. Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username: cleanUsername,
      role,
      active: true,
      last_login_at: new Date().toISOString()
    });

    if (profileError) {
      // rollback auth user creation if profile creation fails
      await supabase.auth.admin.deleteUser(data.user.id);
      return { success: false, message: "Failed to create profile." };
    }

    // 5. Sign the user in to establish the session
    const { error: signInError } = await authClient.auth.signInWithPassword({ email, password });
    if (signInError) {
      return { success: false, message: "Account created, but failed to log in automatically." };
    }

    return { success: true };
  } catch (err) {
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function checkUsernameAvailability(username: string) {
  try {
    const supabase = createAdminClient();
    const cleanUsername = username.toLowerCase().replace(/\s+/g, '');
    
    // Reserved usernames
    const reserved = ['admin', 'system', 'support', 'root', 'cupid'];
    if (reserved.includes(cleanUsername)) {
      return { available: false, message: "This username is reserved." };
    }

    if (cleanUsername.length < 3) {
      return { available: false, message: "Username must be at least 3 characters." };
    }

    const { data } = await supabase.from('profiles').select('id').eq('username', cleanUsername).single();
    if (data) {
      return { available: false, message: "Username is already taken." };
    }

    return { available: true };
  } catch (err) {
    // If no row is found, .single() throws an error (PGRST116), which means it's available!
    return { available: true };
  }
}
