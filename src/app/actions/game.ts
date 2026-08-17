"use server";

import { createClient } from "@/lib/supabase/server";

export async function createGame(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  // Verify participant
  const { data: participant } = await adminSupabase
    .from('conversation_participants')
    .select('profile_id')
    .eq('conversation_id', conversationId)
    .eq('profile_id', user.id)
    .single();

  if (!participant) return { success: false, error: "Not a participant" };

  // Cancel any existing waiting games in this conversation
  await adminSupabase
    .from('couple_games')
    .update({ status: 'finished' })
    .eq('conversation_id', conversationId)
    .in('status', ['waiting', 'ready']);

  const { data, error } = await adminSupabase
    .from('couple_games')
    .insert({
      conversation_id: conversationId,
      player_1: user.id,
      game_type: 'sticky_rush',
      status: 'waiting',
      state: {}
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, gameId: data.id };
}

export async function joinGame(gameId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  // Get the game
  const { data: game } = await adminSupabase
    .from('couple_games')
    .select('*')
    .eq('id', gameId)
    .eq('status', 'waiting')
    .single();

  if (!game) return { success: false, error: "Game not found or already started" };
  if (game.player_1 === user.id) return { success: false, error: "Cannot join your own game" };

  // Verify participant in same conversation
  const { data: participant } = await adminSupabase
    .from('conversation_participants')
    .select('profile_id')
    .eq('conversation_id', game.conversation_id)
    .eq('profile_id', user.id)
    .single();

  if (!participant) return { success: false, error: "Not a participant" };

  const { error } = await adminSupabase
    .from('couple_games')
    .update({ player_2: user.id, status: 'ready' })
    .eq('id', gameId)
    .eq('status', 'waiting');

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function startGame(gameId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  // Verify the caller is in the game
  const { data: game } = await adminSupabase
    .from('couple_games')
    .select('player_1, player_2')
    .eq('id', gameId)
    .single();
    
  if (!game || (game.player_1 !== user.id && game.player_2 !== user.id)) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await adminSupabase
    .from('couple_games')
    .update({ status: 'playing' })
    .eq('id', gameId)
    .eq('status', 'ready');

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function finishGame(gameId: string, winnerId: string, winnerTime: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  // Only set winner if game is still playing and no winner set
  const { data: game } = await adminSupabase
    .from('couple_games')
    .select('*')
    .eq('id', gameId)
    .eq('status', 'playing')
    .is('winner', null)
    .single();

  if (!game) return { success: false, error: "Game already finished or winner already set" };

  // Validate the caller is actually in the game!
  if (user.id !== game.player_1 && user.id !== game.player_2) {
    return { success: false, error: "Unauthorized" };
  }

  // Validate winner is a participant
  if (winnerId !== game.player_1 && winnerId !== game.player_2) {
    return { success: false, error: "Invalid winner" };
  }

  const updateData: any = {
    status: 'finished',
    winner: winnerId,
    finished_at: new Date().toISOString()
  };

  if (winnerId === game.player_1) {
    updateData.player_1_time = winnerTime;
  } else {
    updateData.player_2_time = winnerTime;
  }

  const { error } = await adminSupabase
    .from('couple_games')
    .update(updateData)
    .eq('id', gameId)
    .eq('status', 'playing')
    .is('winner', null);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getActiveGame(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();

  const { data } = await adminSupabase
    .from('couple_games')
    .select('*')
    .eq('conversation_id', conversationId)
    .in('status', ['waiting', 'ready', 'playing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data || null;
}
