"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateProfile(bio: string, privacySettings: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const { error } = await supabase
    .from('profiles')
    .update({ 
      bio, 
      privacy_settings: privacySettings 
    })
    .eq('id', user.id);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('username, bio, privacy_settings')
    .eq('id', user.id)
    .single();

  return data;
}
