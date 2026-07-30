"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateProfile(bio: string, privacySettings: any, avatarUrl?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const updateData: any = {};
  if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;
  if (bio !== undefined) updateData.bio = bio;
  if (privacySettings !== undefined) updateData.privacy_settings = privacySettings;

  if (Object.keys(updateData).length === 0) {
    return { success: true };
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id);

  if (error) {
    if (error.code === '42703') {
      return { success: false, message: "Please run the SQL command in the Supabase Dashboard to enable saving." };
    }
    return { success: false, message: error.message };
  }
  return { success: true };
}

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Try to fetch with all new columns
  const { data, error } = await supabase
    .from('profiles')
    .select('username, avatar_url, bio, privacy_settings')
    .eq('id', user.id)
    .single();

  if (error && error.code === '42703') { // undefined_column
    // Fallback to just username if the user hasn't run the SQL migration
    const { data: fallbackData } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();
    return fallbackData;
  }

  return data;
}
