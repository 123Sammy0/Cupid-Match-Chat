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
  // Exclude deleted and suspended users from search results
  const { data, error } = await adminSupabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('username', query.toLowerCase().replace(/\s+/g, ''))
    .neq('id', user.id)
    .is('deleted_at', null)
    .eq('is_suspended', false)
    .limit(1);

  if (error && error.code === '42703') {
    // Fallback if avatar_url doesn't exist
    const { data: fallbackData } = await adminSupabase
      .from('profiles')
      .select('id, username')
      .eq('username', query.toLowerCase().replace(/\s+/g, ''))
      .neq('id', user.id)
      .is('deleted_at', null)
      .eq('is_suspended', false)
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

export async function getConversationDetails(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  const { data: participants, error } = await adminSupabase
    .from('conversation_participants')
    .select('profile_id, profiles(*)')
    .eq('conversation_id', conversationId);

  if (error) return { success: false, message: error.message };

  if (!participants || !participants.some((p: any) => p.profile_id === user.id)) {
    return { success: false, message: "Not a participant" };
  }

  const otherParticipant = participants.find((p: any) => p.profile_id !== user.id);
  const otherUser = otherParticipant ? { id: otherParticipant.profile_id, ...(otherParticipant.profiles as any) } : null;

  return { success: true, otherUser };
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
    .eq('profile_id', user.id)
    .limit(50);

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

  // Fetch latest message and unread count efficiently per conversation
  const convStats = await Promise.all(convIds.map(async (convId: any) => {
    // 1. Get last message
    const { data: lastMsgData } = await adminSupabase
      .from('messages')
      .select('id, conversation_id, sender_id, content, type, sent_at')
      .eq('conversation_id', convId)
      .order('sent_at', { ascending: false })
      .limit(1);
    
    // 2. Get unread count
    const p = myParts.find((part: any) => part.conversation_id === convId);
    let unreadCount = 0;
    
    let unreadQuery = adminSupabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', convId)
      .neq('sender_id', user.id);
      
    if (p && p.last_read_at) {
      unreadQuery = unreadQuery.gt('sent_at', p.last_read_at);
    }
    
    const { count } = await unreadQuery;
    unreadCount = count || 0;

    return {
      conversation_id: convId,
      lastMsg: lastMsgData && lastMsgData.length > 0 ? lastMsgData[0] : null,
      unreadCount
    };
  }));

  // Combine data
  return myParts.map((p: any) => {
    const other = otherParts?.find((o: any) => o.conversation_id === p.conversation_id);
    const stats = convStats.find((s: any) => s.conversation_id === p.conversation_id);
    
    return {
      id: p.conversation_id,
      updated_at: (p.conversations as any).updated_at,
      is_pinned: p.is_pinned,
      is_archived: p.is_archived,
      last_read_at: p.last_read_at,
      other_user: other?.profiles,
      other_user_id: other?.profile_id,
      last_message: stats?.lastMsg ? {
        content: stats.lastMsg.content,
        type: stats.lastMsg.type,
        sender_id: stats.lastMsg.sender_id,
        sent_at: stats.lastMsg.sent_at
      } : null,
      unread_count: stats?.unreadCount || 0
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

export async function markAllConversationsDelivered() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  await adminSupabase
    .from('conversation_participants')
    .update({ last_delivered_at: new Date().toISOString() })
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

export async function editMessage(messageId: string, newContent: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase
    .from('messages')
    .update({ 
      content: newContent, 
      is_edited: true, 
      edited_at: new Date().toISOString() 
    })
    .eq('id', messageId)
    .eq('sender_id', user.id); // Only the sender can edit

  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function deleteMessage(messageId: string, forEveryone: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  if (forEveryone) {
    const { error } = await adminSupabase
      .from('messages')
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString() 
      })
      .eq('id', messageId)
      .eq('sender_id', user.id); // Only sender can delete for everyone
    if (error) return { success: false, message: error.message };
  } else {
    // Delete for me
    // We fetch the current deleted_by array and append user.id
    const { data: msg } = await adminSupabase
      .from('messages')
      .select('conversation_id, deleted_by')
      .eq('id', messageId)
      .single();
      
    if (msg) {
      // Verify user is a participant in this conversation
      const { data: participant } = await adminSupabase
        .from('conversation_participants')
        .select('profile_id')
        .eq('conversation_id', msg.conversation_id)
        .eq('profile_id', user.id)
        .single();
        
      if (!participant) return { success: false, message: "Unauthorized" };

      const current = Array.isArray(msg.deleted_by) ? msg.deleted_by : [];
      if (!current.includes(user.id)) {
        await adminSupabase
          .from('messages')
          .update({ deleted_by: [...current, user.id] })
          .eq('id', messageId);
      }
    }
  }

  return { success: true };
}

export async function getMessages(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, messages: [], error: "Unauthorized" };

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  // Security: verify the caller is a participant (using admin to avoid RLS cookie issues on mobile)
  const { data: participant } = await adminSupabase
    .from('conversation_participants')
    .select('profile_id')
    .eq('conversation_id', conversationId)
    .eq('profile_id', user.id)
    .single();

  if (!participant) {
    console.error('[getMessages] participant check failed for user', user.id, 'in conv', conversationId);
    return { success: false, messages: [], error: "Not a participant" };
  }

  // Always use admin client to bypass RLS — same approach as getConversations
  const { data, error } = await adminSupabase
    .from('messages')
    .select('*, profiles(username, avatar_url)')
    .eq('conversation_id', conversationId)
    .order('sent_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[getMessages] DB error:', error);
    return { success: false, messages: [], error: error.message };
  }

  return { success: true, messages: data ? data.reverse() : [] };
}

export async function sendMessageServer(
  conversationId: string,
  content: string,
  type: string = 'text',
  messageId?: string,
  expiresAt?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // Use admin client to bypass RLS for insert — same pattern as getConversations.
  // This ensures mobile browsers (where cookie auth may be unreliable) can always send.
  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  // Security: verify the caller is actually a participant before inserting
  const { data: participant } = await adminSupabase
    .from('conversation_participants')
    .select('profile_id')
    .eq('conversation_id', conversationId)
    .eq('profile_id', user.id)
    .single();

  if (!participant) {
    return { success: false, error: "Not a participant" };
  }

  const msgId = messageId || crypto.randomUUID();
  const expiry = expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { error } = await adminSupabase.from('messages').insert({
    id: msgId,
    sender_id: user.id,
    conversation_id: conversationId,
    content,
    type,
    expires_at: expiry
  });

  if (error) {
    console.error('[sendMessageServer] insert error:', error);
    return { success: false, error: error.message };
  }

  return { success: true, messageId: msgId };
}
