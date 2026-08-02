-- 1. Helper function (runs with security definer to bypass RLS recursion)
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

-- 2. Update conversation_participants SELECT policy
drop policy if exists "Users can read their own participant records" on public.conversation_participants;

create policy "Users can read participants of their conversations"
  on public.conversation_participants for select
  using (
    public.is_conversation_member(conversation_id, auth.uid())
  );

-- 3. Add profiles table to the supabase_realtime publication
alter publication supabase_realtime add table public.profiles;
