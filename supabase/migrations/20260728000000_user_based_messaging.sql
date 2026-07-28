-- 1. Alter profiles table
alter table public.profiles add column bio text;
alter table public.profiles add column last_seen timestamptz;
alter table public.profiles add column privacy_settings jsonb default '{"online_status": "everyone", "last_seen": "everyone", "profile_visibility": "everyone"}'::jsonb not null;

-- 2. Create conversations table
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  is_group boolean default false not null,
  metadata jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 3. Create conversation_participants table
create table public.conversation_participants (
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now() not null,
  last_read_at timestamptz default now() not null,
  is_pinned boolean default false not null,
  is_archived boolean default false not null,
  is_muted boolean default false not null,
  primary key (conversation_id, profile_id)
);

-- 4. Create chat_requests table
create table public.chat_requests (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (sender_id, receiver_id)
);

-- 5. Modify messages table
-- We have to clear existing messages if we are dropping room_code and making conversation_id non-null,
-- but since this is an ephemeral app, we can just truncate. 
truncate table public.messages cascade;

alter table public.messages drop column room_code;
alter table public.messages add column conversation_id uuid references public.conversations(id) on delete cascade not null;
alter table public.messages add column read_by jsonb default '[]'::jsonb not null;

-- 6. Modify attachments table
truncate table public.attachments cascade;
alter table public.attachments drop column room_code;
alter table public.attachments add column conversation_id uuid references public.conversations(id) on delete cascade not null;

-- 7. Enable RLS
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.chat_requests enable row level security;

-- 8. RLS Policies

-- Conversations: A user can read a conversation if they are a participant
create policy "Users can read conversations they are in"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = conversations.id
      and profile_id = auth.uid()
    )
  );

-- Conversation Participants: A user can read participants of conversations they are in
create policy "Users can read participants of their conversations"
  on public.conversation_participants for select
  using (
    exists (
      select 1 from public.conversation_participants as cp
      where cp.conversation_id = conversation_participants.conversation_id
      and cp.profile_id = auth.uid()
    )
  );

create policy "Users can update their own participant settings"
  on public.conversation_participants for update
  using ( profile_id = auth.uid() );

-- Chat Requests: A user can read requests they sent or received
create policy "Users can read their chat requests"
  on public.chat_requests for select
  using ( sender_id = auth.uid() or receiver_id = auth.uid() );

create policy "Users can insert chat requests"
  on public.chat_requests for insert
  with check ( sender_id = auth.uid() );

create policy "Receivers can update chat requests"
  on public.chat_requests for update
  using ( receiver_id = auth.uid() );

-- Drop old message/attachment policies
drop policy if exists "Authenticated users can view messages" on public.messages;
drop policy if exists "Authenticated users can insert messages" on public.messages;

drop policy if exists "Authenticated users can view attachments" on public.attachments;
drop policy if exists "Authenticated users can insert attachments" on public.attachments;

-- New Message Policies
create policy "Users can view messages in their conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id
      and profile_id = auth.uid()
    )
  );

create policy "Users can insert messages into their conversations"
  on public.messages for insert
  with check (
    sender_id = auth.uid() and 
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id
      and profile_id = auth.uid()
    )
  );

create policy "Users can update their own messages"
  on public.messages for update
  using ( sender_id = auth.uid() );

-- New Attachment Policies
create policy "Users can view attachments in their conversations"
  on public.attachments for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = attachments.conversation_id
      and profile_id = auth.uid()
    )
  );

create policy "Users can insert attachments into their conversations"
  on public.attachments for insert
  with check (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = attachments.conversation_id
      and profile_id = auth.uid()
    )
  );

-- Update Realtime publication
begin;
  -- If we need to modify publication for new tables
  alter publication supabase_realtime add table chat_requests;
  alter publication supabase_realtime add table conversation_participants;
commit;
