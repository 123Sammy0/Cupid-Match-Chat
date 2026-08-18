"use server";

import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Foundational Security Guard: Checks if the current user is an admin
export const verifyAdmin = async () => {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin-login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return user;
};

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

  // We could use DB functions for this, but for simplicity we run basic counts.
  const [{ count: totalUsers }, { count: totalChats }, { count: totalMessages }, { count: activeRooms }] = await Promise.all([
    adminSupabase.from("profiles").select("*", { count: "exact", head: true }),
    adminSupabase.from("conversations").select("*", { count: "exact", head: true }),
    adminSupabase.from("messages").select("*", { count: "exact", head: true }),
    adminSupabase.from("rooms").select("*", { count: "exact", head: true }).eq('is_active', true),
  ]);

  // To simulate media breakdown and storage, we can query storage objects
  // or return placeholders if the storage API isn't fully queryable for size yet.
  return {
    totalUsers: totalUsers || 0,
    onlineUsers: 0, // Requires presence tracking
    totalChats: totalChats || 0,
    totalMessages: totalMessages || 0,
    images: 0,
    videos: 0,
    audio: 0,
    documents: 0,
    totalStorageMB: 0,
    todayNewUsers: 0,
    activeRooms: activeRooms || 0,
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
    sender_id: impersonatedUserId, // Sent as the user to maintain chat flow
    content,
    type: "text", // Can use regular text
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

