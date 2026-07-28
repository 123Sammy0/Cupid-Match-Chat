"use server";

import { createClient } from "@/lib/supabase/server";

export async function searchUsers(query: string) {
  if (!query || query.length < 2) return [];
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Case insensitive partial match
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, bio, last_seen, privacy_settings')
    .ilike('username', `%${query}%`)
    .neq('id', user.id)
    .limit(10);

  if (error) {
    console.error("Error searching users:", error);
    return [];
  }
  return data || [];
}

export async function sendChatRequest(receiverId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  // Check if request already exists
  const { data: existing } = await supabase
    .from('chat_requests')
    .select('id, status')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
    .single();

  if (existing) {
    return { success: false, message: "Request already exists." };
  }

  const { error } = await supabase
    .from('chat_requests')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      status: 'pending'
    });

  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function acceptChatRequest(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  // Get request
  const { data: request } = await supabase
    .from('chat_requests')
    .select('*')
    .eq('id', requestId)
    .eq('receiver_id', user.id)
    .eq('status', 'pending')
    .single();

  if (!request) return { success: false, message: "Request not found" };

  // Update status
  await supabase.from('chat_requests').update({ status: 'accepted' }).eq('id', requestId);

  // Create conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({ is_group: false })
    .select('id')
    .single();

  if (convError || !conversation) return { success: false, message: "Failed to create conversation" };

  // Add participants
  await supabase.from('conversation_participants').insert([
    { conversation_id: conversation.id, profile_id: request.sender_id },
    { conversation_id: conversation.id, profile_id: request.receiver_id }
  ]);

  return { success: true, conversationId: conversation.id };
}

export async function rejectChatRequest(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const { error } = await supabase
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

  const { data } = await supabase
    .from('chat_requests')
    .select('id, sender_id, status, created_at, profiles!chat_requests_sender_id_fkey(username)')
    .eq('receiver_id', user.id)
    .eq('status', 'pending');

  return data || [];
}

export async function getConversations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Fetch conversations where I am a participant
  const { data: myParts } = await supabase
    .from('conversation_participants')
    .select('conversation_id, is_pinned, is_archived, last_read_at, conversations(id, updated_at, is_group)')
    .eq('profile_id', user.id);

  if (!myParts || myParts.length === 0) return [];

  const convIds = myParts.map(p => p.conversation_id);

  // Fetch the OTHER participants to get their profiles
  const { data: otherParts } = await supabase
    .from('conversation_participants')
    .select('conversation_id, profile_id, profiles(username)')
    .in('conversation_id', convIds)
    .neq('profile_id', user.id);

  // Combine data
  return myParts.map(p => {
    const other = otherParts?.find(o => o.conversation_id === p.conversation_id);
    return {
      id: p.conversation_id,
      updated_at: (p.conversations as any).updated_at,
      is_pinned: p.is_pinned,
      is_archived: p.is_archived,
      last_read_at: p.last_read_at,
      other_user: other?.profiles,
      other_user_id: other?.profile_id
    };
  }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}
