"use server";

import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyAdmin } from "@/lib/admin-auth";

// verifyAdmin has been moved to src/lib/admin-auth.ts to fix Next.js 15 Server Component rendering bugs.

// Admin Protection Guard: Prevent Super Admin from modifying their own critical state
export const guardAgainstSelfHarm = async (adminId: string, targetId: string, actionName: string) => {
  if (adminId === targetId) {
    throw new Error(`Self-protection triggered: Super Admin cannot perform ${actionName} on their own account.`);
  }
};

// --------------------------------------------------------------------------------
// ADMIN METRICS
// --------------------------------------------------------------------------------
export const getDashboardMetrics = async () => {
  await verifyAdmin();
  const adminSupabase = createAdminClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    { count: totalUsers },
    { count: totalChats },
    { count: totalMessages },
    { count: images },
    { count: videos },
    { count: audio },
    { count: documents },
    { count: todayNewUsers },
    { count: deletedUsers },
    { count: suspendedUsers }
  ] = await Promise.all([
    adminSupabase.from("profiles").select("*", { count: "exact", head: true }).is('deleted_at', null),
    adminSupabase.from("conversations").select("*", { count: "exact", head: true }),
    adminSupabase.from("messages").select("*", { count: "exact", head: true }),
    adminSupabase.from("messages").select("*", { count: "exact", head: true }).eq('type', 'image'),
    adminSupabase.from("messages").select("*", { count: "exact", head: true }).eq('type', 'video'),
    adminSupabase.from("messages").select("*", { count: "exact", head: true }).eq('type', 'audio'),
    adminSupabase.from("messages").select("*", { count: "exact", head: true }).eq('type', 'file'),
    adminSupabase.from("profiles").select("*", { count: "exact", head: true }).gte('created_at', today.toISOString()).is('deleted_at', null),
    adminSupabase.from("profiles").select("*", { count: "exact", head: true }).not('deleted_at', 'is', null),
    adminSupabase.from("profiles").select("*", { count: "exact", head: true }).eq('is_suspended', true).is('deleted_at', null)
  ]);

  // Online users: last_seen within 5 minutes, not deleted
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { count: onlineUsers } = await adminSupabase.from("profiles")
    .select("*", { count: "exact", head: true })
    .gte('last_seen', fiveMinsAgo)
    .is('deleted_at', null);

  const { count: activeUsers } = await adminSupabase.from("profiles")
    .select("*", { count: "exact", head: true })
    .eq('is_suspended', false)
    .is('deleted_at', null);

  return {
    totalUsers: totalUsers || 0,
    onlineUsers: onlineUsers || 0,
    activeUsers: activeUsers || 0,
    totalChats: totalChats || 0,
    totalMessages: totalMessages || 0,
    images: images || 0,
    videos: videos || 0,
    audio: audio || 0,
    documents: documents || 0,
    todayNewUsers: todayNewUsers || 0,
    deletedUsers: deletedUsers || 0,
    suspendedUsers: suspendedUsers || 0,
  };
};

// --------------------------------------------------------------------------------
// ADMIN USERS
// --------------------------------------------------------------------------------
export const getAdminUsers = async () => {
  await verifyAdmin();
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from("profiles")
    .select(`
      id, username, avatar_url, role, is_suspended, deleted_at, created_at,
      messages (count)
    `)
    .is('deleted_at', null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  
  return data.map((user: any) => ({
    ...user,
    messagesCount: user.messages?.[0]?.count || 0
  }));
};

export const updateUserRole = async (userId: string, newRole: string) => {
  const adminUser = await verifyAdmin();
  await guardAgainstSelfHarm(adminUser.id, userId, "role modification");
  
  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) throw error;

  await logAdminAction(adminUser.id, "UPDATE_USER_ROLE", userId, null, { newRole });
  revalidatePath("/admin/users");
  return { success: true };
};

export const updateUserStatus = async (userId: string, status: 'active' | 'suspended' | 'banned') => {
  const adminUser = await verifyAdmin();
  await guardAgainstSelfHarm(adminUser.id, userId, "status modification");
  
  const adminSupabase = createAdminClient();
  
  let updateData: any = { is_suspended: false, deleted_at: null };
  if (status === 'suspended') {
    updateData = { is_suspended: true, deleted_at: null };
  } else if (status === 'banned') {
    updateData = { is_suspended: true, deleted_at: new Date().toISOString() };
  }

  const { error } = await adminSupabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId);

  if (error) throw error;

  await logAdminAction(adminUser.id, "UPDATE_USER_STATUS", userId, null, { status });
  revalidatePath("/admin/users");
  return { success: true };
};

export const deleteUser = async (userId: string) => {
  const adminUser = await verifyAdmin();
  await guardAgainstSelfHarm(adminUser.id, userId, "hard deletion");
  
  const adminSupabase = createAdminClient();
  
  // To preserve messages (FK constraints) while completely invalidating the identity
  // and allowing the original email/username to be re-registered:
  const timestamp = Date.now();
  const randomizedSuffix = `_deleted_${timestamp}`;
  
  // 1. Fetch current profile to get username
  const { data: profile } = await adminSupabase.from('profiles').select('username').eq('id', userId).single();
  const randomizedUsername = profile?.username ? `${profile.username}${randomizedSuffix}`.substring(0, 50) : `del${randomizedSuffix}`;

  // 2. Randomize username and soft-delete in public.profiles
  const { error: profileError } = await adminSupabase
    .from("profiles")
    .update({ 
      username: randomizedUsername,
      deleted_at: new Date().toISOString(),
      is_suspended: true,
      active: false
    })
    .eq("id", userId);

  if (profileError) throw profileError;

  // 3. Randomize email and ban identity in Supabase Auth
  // Banning forcefully invalidates all active sessions immediately
  const randomizedEmail = `deleted_${userId.replace(/-/g, '')}_${timestamp}@cupid.com`;
  const { error: authError } = await adminSupabase.auth.admin.updateUserById(userId, {
    email: randomizedEmail,
    ban_duration: "876000h" // 100 years
  });

  if (authError) throw authError;

  await logAdminAction(adminUser.id, "DELETE_USER", userId, null, { action: "scrambled_and_banned" });
  revalidatePath("/admin/users");
  return { success: true };
};

// --------------------------------------------------------------------------------
// GLOBAL SETTINGS
// --------------------------------------------------------------------------------
export const getGlobalSettings = async () => {
  await verifyAdmin();
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from("feature_flags")
    .select("*");

  if (error) {
    // feature_flags table may not exist yet — return empty gracefully
    if (error.code === 'PGRST205' || error.code === '42P01') {
      return [];
    }
    throw error;
  }
  return data || [];
};

export const updateGlobalSetting = async (key: string, enabled: boolean, value: any = {}) => {
  const adminUser = await verifyAdmin();
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from("feature_flags")
    .update({ enabled, value })
    .eq("key", key);

  if (error) throw error;

  await logAdminAction(adminUser.id, "UPDATE_SETTING", null, null, { key, enabled, value });
  revalidatePath("/admin/settings");
  return { success: true };
};

// --------------------------------------------------------------------------------
// AUDIT LOGGING
// --------------------------------------------------------------------------------
export const getAuditLogs = async () => {
  await verifyAdmin();
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from("admin_audit_logs")
    .select("*, profiles!admin_audit_logs_admin_id_fkey(username)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    // Table may not exist yet — return empty gracefully
    if (error.code === 'PGRST205' || error.code === '42P01') {
      return [];
    }
    throw error;
  }
  return data || [];
};

export const logAdminAction = async (adminId: string, action: string, targetUserId: string | null = null, targetChatId: string | null = null, details: any = {}) => {
  const adminSupabase = createAdminClient();
  await adminSupabase.from("admin_audit_logs").insert({
    admin_id: adminId,
    action,
    target_user_id: targetUserId,
    target_chat_id: targetChatId,
    details
  });
};

// --------------------------------------------------------------------------------
// ADMIN CHAT CONTROL & MODERATION
// --------------------------------------------------------------------------------
export const getConversationsForModeration = async () => {
  await verifyAdmin();
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from("conversations")
    .select(`
      id, created_at, is_group,
      conversation_participants (
        profiles (id, username, avatar_url)
      )
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  return data;
};

export const getConversationMessages = async (conversationId: string) => {
  await verifyAdmin();
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from("messages")
    .select("*, profiles!messages_sender_id_fkey(username, avatar_url)")
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: false })
    .limit(1000);

  if (error) throw error;
  // Reverse the messages in JS so they render in correct chronological order (oldest first)
  return data.reverse();
};

export const getActiveTakeover = async (conversationId: string) => {
  await verifyAdmin();
  const adminSupabase = createAdminClient();
  const { data, error } = await adminSupabase
    .from("admin_takeovers")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const startTakeover = async (conversationId: string) => {
  const adminUser = await verifyAdmin();
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase.from("admin_takeovers").insert({
    conversation_id: conversationId,
    admin_id: adminUser.id,
    status: "active"
  });

  if (error) throw error;
  await logAdminAction(adminUser.id, "TAKEOVER_START", null, conversationId);
  revalidatePath("/admin/chats");
  return { success: true };
};

export const endTakeover = async (conversationId: string) => {
  const adminUser = await verifyAdmin();
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from("admin_takeovers")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("status", "active");

  if (error) throw error;
  await logAdminAction(adminUser.id, "TAKEOVER_END", null, conversationId);
  revalidatePath("/admin/chats");
  return { success: true };
};

export const adminReply = async (conversationId: string, content: string, impersonatedUserId: string) => {
  const adminUser = await verifyAdmin();
  const adminSupabase = createAdminClient();

  // Verify takeover is active
  const { data: takeover } = await adminSupabase
    .from("admin_takeovers")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("status", "active")
    .maybeSingle();

  if (!takeover || takeover.admin_id !== adminUser.id) {
    throw new Error("Cannot reply: No active takeover for this conversation by you.");
  }

  const { error } = await adminSupabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: impersonatedUserId,
    content: content,
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Added default expiration to prevent FK null constraints
    metadata: {
      is_admin_reply: true,
      real_admin_id: adminUser.id
    }
  });

  if (error) throw error;
  await logAdminAction(adminUser.id, "ADMIN_REPLY", impersonatedUserId, conversationId, { content });
  return { success: true };
};

export const moderateMessage = async (messageId: string, action: 'delete' | 'redact') => {
  const adminUser = await verifyAdmin();
  const adminSupabase = createAdminClient();

  let updatePayload: any = {};
  if (action === 'delete') {
    updatePayload = { is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: adminUser.id };
  } else if (action === 'redact') {
    updatePayload = { content: "[REDACTED BY ADMIN]", metadata: { redacted_by: adminUser.id } };
  }

  const { data: msg, error: fetchErr } = await adminSupabase.from("messages").select("conversation_id, sender_id").eq("id", messageId).single();
  if (fetchErr) throw fetchErr;

  const { error } = await adminSupabase
    .from("messages")
    .update(updatePayload)
    .eq("id", messageId);

  if (error) throw error;
  await logAdminAction(adminUser.id, `MODERATE_MSG_${action.toUpperCase()}`, msg.sender_id, msg.conversation_id, { messageId });
  return { success: true };
};

// --------------------------------------------------------------------------------
// DELETED USERS / TRASH & RECOVERY
// --------------------------------------------------------------------------------
export const getDeletedUsers = async () => {
  await verifyAdmin();
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from("profiles")
    .select(`id, username, avatar_url, role, is_suspended, deleted_at, created_at`)
    .not('deleted_at', 'is', null)
    .order("deleted_at", { ascending: false })
    .limit(200);

  if (error) throw error;
  return data || [];
};

export const restoreUser = async (userId: string) => {
  const adminUser = await verifyAdmin();
  const adminSupabase = createAdminClient();

  // 1. Restore profile state
  const { error: profileError } = await adminSupabase
    .from("profiles")
    .update({
      deleted_at: null,
      is_suspended: false,
      active: true
    })
    .eq("id", userId);

  if (profileError) throw profileError;

  // 2. Unban in Supabase Auth (remove the 100-year ban)
  const { error: authError } = await adminSupabase.auth.admin.updateUserById(userId, {
    ban_duration: 'none'
  });

  if (authError) throw authError;

  await logAdminAction(adminUser.id, "RESTORE_USER", userId, null, { action: "restored_from_trash" });
  revalidatePath("/admin/users");
  revalidatePath("/admin/trash");
  return { success: true };
};

export const permanentlyDeleteUser = async (userId: string) => {
  const adminUser = await verifyAdmin();
  await guardAgainstSelfHarm(adminUser.id, userId, "permanent deletion");
  const adminSupabase = createAdminClient();

  // 1. Delete profile (this cascades due to FK)
  const { error: profileError } = await adminSupabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileError) throw profileError;

  // 2. Delete auth user permanently
  const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId);
  if (authError) {
    console.error("Auth deletion error (profile already removed):", authError.message);
  }

  await logAdminAction(adminUser.id, "PERMANENT_DELETE_USER", userId, null, { action: "hard_deleted" });
  revalidatePath("/admin/trash");
  return { success: true };
};

// --------------------------------------------------------------------------------
// STORAGE MANAGEMENT
// --------------------------------------------------------------------------------
export const getStorageStats = async () => {
  await verifyAdmin();
  const adminSupabase = createAdminClient();

  const stats = {
    image: { count: 0, bytes: 0 },
    video: { count: 0, bytes: 0 },
    audio: { count: 0, bytes: 0 },
    document: { count: 0, bytes: 0 },
    other: { count: 0, bytes: 0 },
    total: { count: 0, bytes: 0 }
  };

  const { data: buckets } = await adminSupabase.storage.listBuckets();
  if (!buckets) return stats;

  for (const bucket of buckets) {
    await listStorageRecursive(adminSupabase, bucket.name, '', stats);
  }

  return stats;
};

async function listStorageRecursive(supabase: any, bucket: string, path: string, stats: any) {
  const { data: items } = await supabase.storage.from(bucket).list(path, { limit: 1000 });
  if (!items) return;

  for (const item of items) {
    const fullPath = path ? `${path}/${item.name}` : item.name;
    if (item.id) {
      const size = item.metadata?.size || 0;
      const mime = (item.metadata?.mimetype || '').toLowerCase();
      stats.total.count++;
      stats.total.bytes += size;

      if (mime.startsWith('image/')) { stats.image.count++; stats.image.bytes += size; }
      else if (mime.startsWith('video/')) { stats.video.count++; stats.video.bytes += size; }
      else if (mime.startsWith('audio/')) { stats.audio.count++; stats.audio.bytes += size; }
      else if (mime.includes('pdf') || mime.includes('document') || mime.includes('zip') || mime.includes('text/')) {
        stats.document.count++; stats.document.bytes += size;
      } else {
        stats.other.count++; stats.other.bytes += size;
      }
    } else {
      await listStorageRecursive(supabase, bucket, fullPath, stats);
    }
  }
}

export const getStorageFiles = async (search?: string, typeFilter?: string) => {
  await verifyAdmin();
  const adminSupabase = createAdminClient();

  const files: any[] = [];
  const { data: buckets } = await adminSupabase.storage.listBuckets();
  if (!buckets) return files;

  for (const bucket of buckets) {
    await collectStorageFiles(adminSupabase, bucket.name, '', files, search, typeFilter);
  }

  files.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return files.slice(0, 100);
};

async function collectStorageFiles(supabase: any, bucket: string, path: string, files: any[], search?: string, typeFilter?: string) {
  const { data: items } = await supabase.storage.from(bucket).list(path, { limit: 1000 });
  if (!items) return;

  for (const item of items) {
    const fullPath = path ? `${path}/${item.name}` : item.name;
    if (item.id) {
      const mime = (item.metadata?.mimetype || '').toLowerCase();
      let category = 'other';
      if (mime.startsWith('image/')) category = 'image';
      else if (mime.startsWith('video/')) category = 'video';
      else if (mime.startsWith('audio/')) category = 'audio';
      else if (mime.includes('pdf') || mime.includes('document') || mime.includes('zip')) category = 'document';

      if (typeFilter && typeFilter !== 'all' && category !== typeFilter) continue;
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) continue;

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fullPath);
      files.push({
        id: item.id,
        name: item.name,
        path: fullPath,
        bucket,
        size: item.metadata?.size || 0,
        mimetype: item.metadata?.mimetype || 'unknown',
        category,
        created_at: item.created_at || '',
        url: urlData?.publicUrl || ''
      });
    } else {
      await collectStorageFiles(supabase, bucket, fullPath, files, search, typeFilter);
    }
  }
}

export const deleteStorageFile = async (bucket: string, filePath: string) => {
  const adminUser = await verifyAdmin();
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase.storage.from(bucket).remove([filePath]);
  if (error) throw error;

  await logAdminAction(adminUser.id, "DELETE_STORAGE_FILE", null, null, { bucket, filePath });
  return { success: true };
};

// --------------------------------------------------------------------------------
// SYSTEM HEALTH CHECKS
// --------------------------------------------------------------------------------
export const getSystemHealth = async () => {
  await verifyAdmin();
  const adminSupabase = createAdminClient();
  const results: Record<string, { status: string; latencyMs: number; detail?: string }> = {};

  // 1. Database check
  const dbStart = Date.now();
  try {
    const { error } = await adminSupabase.from('profiles').select('id', { count: 'exact', head: true });
    results.database = { status: error ? 'error' : 'operational', latencyMs: Date.now() - dbStart, detail: error?.message };
  } catch (e: any) {
    results.database = { status: 'error', latencyMs: Date.now() - dbStart, detail: e.message };
  }

  // 2. Auth check
  const authStart = Date.now();
  try {
    const { error } = await adminSupabase.auth.admin.listUsers({ perPage: 1 });
    results.auth = { status: error ? 'error' : 'operational', latencyMs: Date.now() - authStart, detail: error?.message };
  } catch (e: any) {
    results.auth = { status: 'error', latencyMs: Date.now() - authStart, detail: e.message };
  }

  // 3. Storage check
  const storageStart = Date.now();
  try {
    const { error } = await adminSupabase.storage.listBuckets();
    results.storage = { status: error ? 'degraded' : 'operational', latencyMs: Date.now() - storageStart, detail: error?.message };
  } catch (e: any) {
    results.storage = { status: 'error', latencyMs: Date.now() - storageStart, detail: e.message };
  }

  // 4. Realtime (basic connectivity test via DB query timing)
  const rtStart = Date.now();
  try {
    const { error } = await adminSupabase.from('messages').select('id', { head: true });
    results.realtime = { status: error ? 'degraded' : 'operational', latencyMs: Date.now() - rtStart, detail: error?.message || 'Based on DB connectivity' };
  } catch (e: any) {
    results.realtime = { status: 'error', latencyMs: Date.now() - rtStart, detail: e.message };
  }

  // 5. API (we're running this action, so API is operational)
  results.api = { status: 'operational', latencyMs: 0, detail: 'Server action executed successfully' };

  return results;
};
