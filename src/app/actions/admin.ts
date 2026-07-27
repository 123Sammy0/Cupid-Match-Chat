"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function lockAccountAction(targetProfileId: string, setActive: boolean) {
  const supabase = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') return { success: false, message: "Unauthorized" };

  // Update profile status
  await supabase.from('profiles').update({ active: setActive }).eq('id', targetProfileId);

  // Log action
  await supabase.from('admin_audit').insert({
    actor_id: user.id,
    action: setActive ? 'UNLOCK_ACCOUNT' : 'LOCK_ACCOUNT',
    target_type: 'profile',
    target_id: targetProfileId
  });

  revalidatePath('/admin');
  return { success: true };
}
