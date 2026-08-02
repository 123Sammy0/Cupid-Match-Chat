-- ============================================================
-- CUPID MATCH CHAT — COMPLETE LIVE DATABASE FIX
-- Run this ONCE in Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ------------------------------------------------------------
-- 1. Add missing last_seen column to profiles
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists last_seen timestamptz;

-- ------------------------------------------------------------
-- 2. Add profiles to supabase_realtime publication
-- (allows clients to listen to last_seen changes in real-time)
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
    and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

-- ------------------------------------------------------------
-- 3. Helper function (security definer bypasses RLS recursion)
-- ------------------------------------------------------------
create or replace function public.is_conversation_member(conv_id uuid, user_id uuid)
returns boolean
security definer
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

-- ------------------------------------------------------------
-- 4. Fix conversation_participants SELECT policy
-- (so users can see each other's read/delivered timestamps)
-- ------------------------------------------------------------
drop policy if exists "Users can read their own participant records" on public.conversation_participants;
drop policy if exists "Users can read participants of their conversations" on public.conversation_participants;

create policy "Users can read participants of their conversations"
  on public.conversation_participants for select
  using (
    public.is_conversation_member(conversation_id, auth.uid())
  );

-- ------------------------------------------------------------
-- DONE — all 4 fixes applied
-- ------------------------------------------------------------
select 'Fix applied successfully!' as result;
