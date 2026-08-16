-- Sticky Rush: Multiplayer couple game table
CREATE TABLE IF NOT EXISTS public.couple_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  game_type TEXT NOT NULL DEFAULT 'sticky_rush',
  player_1 UUID NOT NULL,
  player_2 UUID,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'ready', 'playing', 'finished')),
  state JSONB DEFAULT '{}'::jsonb,
  winner UUID,
  player_1_time REAL,
  player_2_time REAL,
  created_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ
);

-- Index for quick lookup by conversation
CREATE INDEX IF NOT EXISTS idx_couple_games_conversation ON public.couple_games (conversation_id, status);

-- RLS policies
ALTER TABLE public.couple_games ENABLE ROW LEVEL SECURITY;

-- Allow participants to read games in their conversations
CREATE POLICY "Participants can read games"
  ON public.couple_games FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = couple_games.conversation_id
        AND profile_id = auth.uid()
    )
  );

-- Allow participants to insert games
CREATE POLICY "Participants can create games"
  ON public.couple_games FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = couple_games.conversation_id
        AND profile_id = auth.uid()
    )
  );

-- Allow participants to update games
CREATE POLICY "Participants can update games"
  ON public.couple_games FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = couple_games.conversation_id
        AND profile_id = auth.uid()
    )
  );
