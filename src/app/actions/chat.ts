"use server";

import { createClient } from "@/lib/supabase/server";

export async function searchUsers(query: string) {
  if (!query || query.length < 2) return [];
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Use Admin Client to bypass RLS for searching users globally
  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  // Exact match for privacy (users must know the exact username)
  const { data, error } = await adminSupabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('username', query.toLowerCase().replace(/\s+/g, ''))
    .neq('id', user.id)
    .limit(1);

  if (error && error.code === '42703') {
    // Fallback if avatar_url doesn't exist
    const { data: fallbackData } = await adminSupabase
      .from('profiles')
      .select('id, username')
      .eq('username', query.toLowerCase().replace(/\s+/g, ''))
      .neq('id', user.id)
      .limit(1);
    return fallbackData || [];
  }

  if (error) {
    console.error("Error searching users:", error);
    return [];
  }
  return data || [];
}

// Fallback for stale clients that haven't refreshed and still call sendChatRequest
export async function sendChatRequest(receiverId: string) {
  return createDirectConversation(receiverId);
}

export async function createDirectConversation(targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  // 1. Check if a conversation between these two already exists
  // We look for any conversation where BOTH users are participants.
  const { data: existingParts, error: partsErr } = await adminSupabase
    .from('conversation_participants')
    .select('conversation_id')
    .in('profile_id', [user.id, targetUserId]);

  if (!partsErr && existingParts) {
    // We need a conversation where BOTH appear. 
    // Group by conversation_id and count occurrences.
    const counts = existingParts.reduce((acc: any, p: any) => {
      acc[p.conversation_id] = (acc[p.conversation_id] || 0) + 1;
      return acc;
    }, {});
    const existingConvId = Object.keys(counts).find(id => counts[id] === 2);
    
    if (existingConvId) {
      // Conversation already exists, just return it
      return { success: true, conversationId: existingConvId };
    }
  }

  // 2. No existing conversation, create a new one
  const { data: conversation, error: convError } = await adminSupabase
    .from('conversations')
    .insert({ is_group: false })
    .select('id')
    .single();

  if (convError || !conversation) {
    console.error("Conversation creation error:", convError);
    return { success: false, message: `Failed to create conversation: ${convError?.message || 'Unknown error'}` };
  }

  // 3. Add participants
  const { error: insertError } = await adminSupabase.from('conversation_participants').insert([
    { conversation_id: conversation.id, profile_id: user.id },
    { conversation_id: conversation.id, profile_id: targetUserId }
  ]);

  if (insertError) {
    return { success: false, message: insertError.message };
  }

  return { success: true, conversationId: conversation.id };
}

export async function acceptChatRequest(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  // Get request
  const { data: request } = await adminSupabase
    .from('chat_requests')
    .select('*')
    .eq('id', requestId)
    .eq('receiver_id', user.id)
    .eq('status', 'pending')
    .single();

  if (!request) return { success: false, message: "Request not found" };

  // Update status
  await adminSupabase.from('chat_requests').update({ status: 'accepted' }).eq('id', requestId);

  // Create conversation
  const { data: conversation, error: convError } = await adminSupabase
    .from('conversations')
    .insert({ is_group: false })
    .select('id')
    .single();

  if (convError || !conversation) return { success: false, message: "Failed to create conversation" };

  // Add participants
  await adminSupabase.from('conversation_participants').insert([
    { conversation_id: conversation.id, profile_id: request.sender_id },
    { conversation_id: conversation.id, profile_id: request.receiver_id }
  ]);

  return { success: true, conversationId: conversation.id };
}

export async function rejectChatRequest(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from('chat_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)
    .eq('receiver_id', user.id);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function getPendingRequests() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from('chat_requests')
    .select('id, sender_id, status, created_at, profiles!chat_requests_sender_id_fkey(username, avatar_url)')
    .eq('receiver_id', user.id)
    .eq('status', 'pending');

  if (error && error.code === '42703') {
    const { data: fallbackData } = await adminSupabase
      .from('chat_requests')
      .select('id, sender_id, status, created_at, profiles!chat_requests_sender_id_fkey(username)')
      .eq('receiver_id', user.id)
      .eq('status', 'pending');
    return fallbackData || [];
  }

  return data || [];
}

export async function getConversations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  // Fetch conversations where I am a participant
  const { data: myParts } = await adminSupabase
    .from('conversation_participants')
    .select('conversation_id, is_pinned, is_archived, last_read_at, conversations(id, updated_at, is_group)')
    .eq('profile_id', user.id);

  if (!myParts || myParts.length === 0) return [];

  const convIds = myParts.map((p: any) => p.conversation_id);

  // Fetch the OTHER participants to get their profiles
  let otherParts: any[] = [];
  const { data: otherData, error: otherError } = await adminSupabase
    .from('conversation_participants')
    .select('conversation_id, profile_id, profiles(username, avatar_url)')
    .in('conversation_id', convIds)
    .neq('profile_id', user.id);

  if (otherError && otherError.code === '42703') {
    const { data: fallbackOther } = await adminSupabase
      .from('conversation_participants')
      .select('conversation_id, profile_id, profiles(username)')
      .in('conversation_id', convIds)
      .neq('profile_id', user.id);
    otherParts = fallbackOther || [];
  } else {
    otherParts = otherData || [];
  }

  // Fetch latest message per conversation
  const { data: allMessages } = await adminSupabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, type, sent_at')
    .in('conversation_id', convIds)
    .order('sent_at', { ascending: false });

  // Combine data
  return myParts.map((p: any) => {
    const other = otherParts?.find((o: any) => o.conversation_id === p.conversation_id);
    
    // Get latest message for this conversation
    const convMessages = (allMessages || []).filter((m: any) => m.conversation_id === p.conversation_id);
    const lastMsg = convMessages.length > 0 ? convMessages[0] : null;
    
    // Count unread: messages from OTHER user sent AFTER my last_read_at
    let unreadCount = 0;
    if (p.last_read_at) {
      unreadCount = convMessages.filter((m: any) => 
        m.sender_id !== user.id && new Date(m.sent_at) > new Date(p.last_read_at)
      ).length;
    } else {
      // Never read = all messages from other user are unread
      unreadCount = convMessages.filter((m: any) => m.sender_id !== user.id).length;
    }

    return {
      id: p.conversation_id,
      updated_at: (p.conversations as any).updated_at,
      is_pinned: p.is_pinned,
      is_archived: p.is_archived,
      last_read_at: p.last_read_at,
      other_user: other?.profiles,
      other_user_id: other?.profile_id,
      last_message: lastMsg ? {
        content: lastMsg.content,
        type: lastMsg.type,
        sender_id: lastMsg.sender_id,
        sent_at: lastMsg.sent_at
      } : null,
      unread_count: unreadCount
    };
  }).sort((a: any, b: any) => {
    const aTime = a.last_message?.sent_at || a.updated_at;
    const bTime = b.last_message?.sent_at || b.updated_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

export async function deleteConversation(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  // Remove this user from the conversation
  const { error } = await adminSupabase
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('profile_id', user.id);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function blockUser(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  // Remove user from conversation (block = leave conversation)
  await adminSupabase
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('profile_id', user.id);

  return { success: true };
}

export async function markConversationRead(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  await adminSupabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('profile_id', user.id);
}

export async function markConversationDelivered(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  await adminSupabase
    .from('conversation_participants')
    .update({ last_delivered_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('profile_id', user.id);
}

export async function updateLastSeen() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  await adminSupabase
    .from('profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', user.id);
}
