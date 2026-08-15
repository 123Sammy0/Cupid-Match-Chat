-- ============================================================================
-- CUPID MATCH CHAT — MASTER REALTIME + MESSAGING FIX
-- Run this ONCE in Supabase Dashboard > SQL Editor > New Query
-- This fixes:
--   1. Mobile messages not sending (INSERT RLS policy)
--   2. Messages not appearing in real-time (postgres_changes RLS bug)
--   3. Online status not showing on laptop (profiles realtime)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Ensure the fast helper function exists
-- (security definer = bypasses RLS recursion, evaluated as DB owner)
-- ----------------------------------------------------------------------------
create or replace function public.is_conversation_member(conv_id uuid, user_id uuid)
returns boolean
security definer
set search_path = public
language plpgsql
as $$
begin
  return exists (
    select 1 from public.conversation_participants
    where conversation_id = conv_id
    and profile_id = user_id
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- STEP 2: Fix MESSAGES policies
-- The old "exists (select 1 from conversation_participants...)" subquery
-- causes Supabase Realtime to silently drop postgres_changes events.
-- Replacing with is_conversation_member() fixes real-time delivery.
-- ----------------------------------------------------------------------------
drop policy if exists "Users can view messages in their conversations" on public.messages;
drop policy if exists "Users can insert messages into their conversations" on public.messages;
drop policy if exists "Users can update their own messages" on public.messages;
drop policy if exists "Users can delete their own messages" on public.messages;

-- SELECT: uses fast function — Realtime can now deliver events
create policy "Users can view messages in their conversations"
  on public.messages for select
  using (
    public.is_conversation_member(conversation_id, auth.uid())
  );

-- INSERT: allows mobile/browser clients to send messages directly
create policy "Users can insert messages into their conversations"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and public.is_conversation_member(conversation_id, auth.uid())
  );

-- UPDATE: only sender can edit their own message
create policy "Users can update their own messages"
  on public.messages for update
  using ( sender_id = auth.uid() )
  with check (
    sender_id = auth.uid()
    and public.is_conversation_member(conversation_id, auth.uid())
  );

-- DELETE: only sender can delete their own message
create policy "Users can delete their own messages"
  on public.messages for delete
  using ( sender_id = auth.uid() );

-- ----------------------------------------------------------------------------
-- STEP 3: Fix CONVERSATION_PARTICIPANTS policies
-- The old policy "Users can read their own participant records" (profile_id = auth.uid())
-- blocks the other user's read/delivered/typing updates from being readable.
-- We need both users to see each other's participant rows for read receipts.
-- ----------------------------------------------------------------------------
drop policy if exists "Users can read their own participant records" on public.conversation_participants;
drop policy if exists "Users can read participants of their conversations" on public.conversation_participants;

-- Allow both participants to see each other's rows (needed for read receipts + typing)
create policy "Users can read participants of their conversations"
  on public.conversation_participants for select
  using (
    public.is_conversation_member(conversation_id, auth.uid())
  );

-- ----------------------------------------------------------------------------
-- STEP 4: Ensure profiles AND messages are in Supabase Realtime publication
-- (Required for postgres_changes to deliver events to clients)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'conversation_participants'
  ) then
    alter publication supabase_realtime add table public.conversation_participants;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- DONE
-- ----------------------------------------------------------------------------
select 
  'ALL FIXES APPLIED!' as status,
  (select count(*) from pg_publication_tables where pubname = 'supabase_realtime') as realtime_tables_count;
