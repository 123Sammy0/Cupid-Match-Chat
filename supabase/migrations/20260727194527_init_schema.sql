-- 1. Create tables

-- profiles
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique not null,
  role text check (role in ('admin', 'partner')) not null,
  active boolean default true not null,
  created_at timestamptz default now() not null,
  last_login_at timestamptz
);

-- app_settings
create table public.app_settings (
  key text primary key,
  value_encrypted text not null,
  updated_at timestamptz default now() not null,
  updated_by uuid references public.profiles(id)
);

-- messages
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) not null,
  content text not null, -- this will be encrypted client-side or handled as per PRD
  type text default 'text' check (type in ('text', 'image', 'video', 'audio', 'document', 'voice')),
  sent_at timestamptz default now() not null,
  expires_at timestamptz not null
);

-- attachments
create table public.attachments (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  content_type text not null,
  size bigint not null,
  expires_at timestamptz not null
);

-- admin_audit
create table public.admin_audit (
  id uuid default gen_random_uuid() primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  target_type text,
  target_id text,
  created_at timestamptz default now() not null,
  metadata jsonb
);

-- cleanup_runs
create table public.cleanup_runs (
  id uuid default gen_random_uuid() primary key,
  started_at timestamptz default now() not null,
  finished_at timestamptz,
  status text not null,
  deleted_messages integer default 0,
  deleted_attachments integer default 0,
  error_summary text
);

-- emergency_actions
create table public.emergency_actions (
  id uuid default gen_random_uuid() primary key,
  actor_id uuid references public.profiles(id) not null,
  target_profile_id uuid references public.profiles(id) not null,
  action text not null check (action in ('lock', 'unlock', 'delete_room_data')),
  created_at timestamptz default now() not null,
  completed_at timestamptz
);

-- 2. Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;
alter table public.admin_audit enable row level security;
alter table public.cleanup_runs enable row level security;
alter table public.emergency_actions enable row level security;

-- 3. RLS Policies

-- profiles: Users can read their own profile. Admin reads handled via service role on backend.
create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

-- app_settings: Only accessible via server-side admin routes (service role). No browser access.
create policy "No direct browser access to app_settings"
  on public.app_settings for all
  using ( false );

-- messages: Authenticated users can view currently retained messages.
create policy "Authenticated users can view messages"
  on public.messages for select
  using ( auth.role() = 'authenticated' );

create policy "Authenticated users can insert messages"
  on public.messages for insert
  with check ( auth.role() = 'authenticated' and sender_id = auth.uid() );

-- attachments: Authenticated users can view currently retained attachments.
create policy "Authenticated users can view attachments"
  on public.attachments for select
  using ( auth.role() = 'authenticated' );

create policy "Authenticated users can insert attachments"
  on public.attachments for insert
  with check ( auth.role() = 'authenticated' );

-- admin_audit, cleanup_runs, emergency_actions: No direct browser access, handled via service role on server
create policy "No direct browser access to admin tables"
  on public.admin_audit for all using (false);

create policy "No direct browser access to cleanup_runs"
  on public.cleanup_runs for all using (false);

create policy "No direct browser access to emergency_actions"
  on public.emergency_actions for all using (false);

-- 4. Enable Realtime for messages and emergency actions
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table emergency_actions;
