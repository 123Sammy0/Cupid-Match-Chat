-- 1. Index for conversation_participants lookup in RLS policies
create index if not exists idx_conversation_participants_lookup
  on public.conversation_participants (conversation_id, profile_id);

-- 2. Composite index for messages filtering by conversation_id AND sorting by sent_at 
-- (used heavily in Realtime, history fetches, and UI message ordering)
create index if not exists idx_messages_conversation_sent_at
  on public.messages (conversation_id, sent_at);
