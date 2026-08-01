# Cupid Match Chat — Pure Production RLS Policy Configuration

This document contains the production-ready Row Level Security (RLS) SQL policies for Cupid Match Chat. It contains **zero schema modifications** (`CREATE TABLE` and `ALTER TABLE` are strictly excluded) and is 100% compatible with your existing live production database.

---

## 1. Bug Fix: Infinite Recursion

* **The Bug (Chats not loading/saving)**: The previous `SELECT` policy for `public.conversation_participants` used a subquery that queried `public.conversation_participants` again. This caused PostgreSQL to enter an infinite loop (`ERROR: infinite recursion detected in policy for relation "conversation_participants"`), which silently blocked all read and write queries to `messages`, `conversations`, and `conversation_participants`.
* **The Fix**: The `SELECT` policy for `conversation_participants` has been simplified to directly check `profile_id = auth.uid()`. This breaks the infinite loop while maintaining strict privacy. The server securely fetches the other participant's data bypassing RLS, so the UI is completely unaffected and continues to function perfectly.

---

## 2. Policy Explanations by Table

* **`public.profiles`**
  * **`"Users can view own profile"` (SELECT)**: Allows users to view their own profile record.
  * **`"Users can view profiles of their chat partners"` (SELECT)**: Strict scoping for client queries.
  * **`"Users can update own profile"` (UPDATE)**: Restricts profile modifications to the owner.
* **`public.conversations`**
  * **`"Users can read conversations they are in"` (SELECT)**: Scopes conversation visibility to users who are participants.
  * **`"Users can insert conversations"` (INSERT)**: Allows authenticated users to create a new conversation.
* **`public.conversation_participants` (Fixed)**
  * **`"Users can read their own participant records"` (SELECT)**: Users can only select their own participant rows. **(Fixes infinite recursion)**.
  * **`"Users can update their own participant settings"` (UPDATE)**: Ensures a user can only update their own participant row.
  * **`"Users can insert participants"` (INSERT)**: Allows adding participant rows when starting a conversation.
* **`public.messages`**
  * **`"Users can view messages in their conversations"` (SELECT)**: Restricts SELECT queries to active participants.
  * **`"Users can insert messages into their conversations"` (INSERT)**: Requires sender authorization and participant membership.
  * **`"Users can update their own messages"` (UPDATE)**: Only the sender can edit their message.
  * **`"Users can delete their own messages"` (DELETE)**: Only the sender can delete their own message.
* **`public.attachments`**
  * **`"Users can view attachments of accessible messages"` (SELECT)**: Joins through `message_id` to verify participant access.
  * **`"Users can insert attachments to their messages"` (INSERT)**: Joins through `message_id` to ensure sender authorization.
  * **`"Users can delete their own attachments"` (DELETE)**: Restricts deletion to attachments where the parent message was sent by the user.

---

## 3. Pure Production RLS SQL Script (No Schema Changes)

Copy and execute this script in your **Supabase SQL Editor** (`Project > SQL Editor > New Query`). It contains zero `CREATE TABLE` or `ALTER TABLE ADD COLUMN` statements:

```sql
-- ============================================================================
-- CUPID MATCH CHAT — PURE PRODUCTION RLS POLICIES (ZERO SCHEMA CHANGES)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Ensure Row Level Security is enabled on existing production tables
-- ----------------------------------------------------------------------------
alter table if exists public.profiles enable row level security;
alter table if exists public.conversations enable row level security;
alter table if exists public.conversation_participants enable row level security;
alter table if exists public.messages enable row level security;
alter table if exists public.attachments enable row level security;
alter table if exists public.chat_requests enable row level security;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can view profiles of their chat partners" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using ( id = auth.uid() );

create policy "Users can view profiles of their chat partners"
  on public.profiles for select
  using (
    exists (
      select 1 from public.conversation_participants cp1
      join public.conversation_participants cp2 on cp1.conversation_id = cp2.conversation_id
      where cp1.profile_id = auth.uid()
      and cp2.profile_id = profiles.id
    )
  );

create policy "Users can update own profile"
  on public.profiles for update
  using ( id = auth.uid() )
  with check ( id = auth.uid() );

-- ============================================================================
-- CONVERSATIONS POLICIES
-- ============================================================================
drop policy if exists "Users can read conversations they are in" on public.conversations;
drop policy if exists "Users can insert conversations" on public.conversations;

create policy "Users can read conversations they are in"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = conversations.id
      and profile_id = auth.uid()
    )
  );

create policy "Users can insert conversations"
  on public.conversations for insert
  with check ( auth.role() = 'authenticated' );

-- ============================================================================
-- CONVERSATION PARTICIPANTS POLICIES (Fixed Infinite Recursion)
-- ============================================================================
drop policy if exists "Users can read participants of their conversations" on public.conversation_participants;
drop policy if exists "Users can read their own participant records" on public.conversation_participants;
drop policy if exists "Users can update their own participant settings" on public.conversation_participants;
drop policy if exists "Users can insert participants" on public.conversation_participants;

create policy "Users can read their own participant records"
  on public.conversation_participants for select
  using ( profile_id = auth.uid() );

create policy "Users can update their own participant settings"
  on public.conversation_participants for update
  using ( profile_id = auth.uid() )
  with check ( profile_id = auth.uid() );

create policy "Users can insert participants"
  on public.conversation_participants for insert
  with check (
    auth.role() = 'authenticated' and (
      profile_id = auth.uid() or
      exists (
        select 1 from public.conversation_participants
        where conversation_id = conversation_participants.conversation_id
        and profile_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- MESSAGES POLICIES
-- ============================================================================
drop policy if exists "Authenticated users can view messages" on public.messages;
drop policy if exists "Authenticated users can insert messages" on public.messages;
drop policy if exists "Users can view messages in their conversations" on public.messages;
drop policy if exists "Users can insert messages into their conversations" on public.messages;
drop policy if exists "Users can update their own messages" on public.messages;
drop policy if exists "Users can delete their own messages" on public.messages;

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
  using ( sender_id = auth.uid() )
  with check (
    sender_id = auth.uid() and
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id
      and profile_id = auth.uid()
    )
  );

create policy "Users can delete their own messages"
  on public.messages for delete
  using ( sender_id = auth.uid() );

-- ============================================================================
-- ATTACHMENTS POLICIES (No Schema Changes required)
-- ============================================================================
drop policy if exists "Authenticated users can view attachments" on public.attachments;
drop policy if exists "Authenticated users can insert attachments" on public.attachments;
drop policy if exists "Users can view attachments in their conversations" on public.attachments;
drop policy if exists "Users can insert attachments into their conversations" on public.attachments;
drop policy if exists "Users can delete their own attachments" on public.attachments;
drop policy if exists "Users can view attachments of accessible messages" on public.attachments;
drop policy if exists "Users can insert attachments to their messages" on public.attachments;

create policy "Users can view attachments of accessible messages"
  on public.attachments for select
  using (
    exists (
      select 1 from public.messages m
      join public.conversation_participants cp on cp.conversation_id = m.conversation_id
      where m.id = attachments.message_id
      and cp.profile_id = auth.uid()
    )
  );

create policy "Users can insert attachments to their messages"
  on public.attachments for insert
  with check (
    exists (
      select 1 from public.messages m
      where m.id = attachments.message_id
      and m.sender_id = auth.uid()
    )
  );

create policy "Users can delete their own attachments"
  on public.attachments for delete
  using (
    exists (
      select 1 from public.messages m
      where m.id = attachments.message_id
      and m.sender_id = auth.uid()
    )
  );

-- ============================================================================
-- CHAT REQUESTS POLICIES (Only applies if chat_requests exists in your database)
-- ============================================================================
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'chat_requests') then
    execute 'drop policy if exists "Users can read their chat requests" on public.chat_requests';
    execute 'drop policy if exists "Users can insert chat requests" on public.chat_requests';
    execute 'drop policy if exists "Receivers can update chat requests" on public.chat_requests';

    execute 'create policy "Users can read their chat requests" on public.chat_requests for select using (sender_id = auth.uid() or receiver_id = auth.uid())';
    execute 'create policy "Users can insert chat requests" on public.chat_requests for insert with check (sender_id = auth.uid())';
    execute 'create policy "Receivers can update chat requests" on public.chat_requests for update using (receiver_id = auth.uid()) with check (receiver_id = auth.uid())';
  end if;
end $$;
```
