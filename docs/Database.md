# Database Schema Documentation

The database is built on PostgreSQL via Supabase, utilizing strict Row Level Security (RLS) to enforce privacy across the multi-user architecture.

## Tables

### `profiles`
Stores user identity and global settings.
- `id` (uuid, PK, references auth.users)
- `username` (text, unique)
- `role` (text: 'admin', 'partner')
- `active` (boolean)
- `privacy_settings` (jsonb)

### `conversations`
Represents a private chat room between users.
- `id` (uuid, PK)
- `is_group` (boolean)
- `created_at`, `updated_at`

### `conversation_participants`
Mapping table linking users to their conversations.
- `conversation_id` (uuid, FK)
- `profile_id` (uuid, FK)
- `joined_at`, `last_read_at`
- `is_pinned`, `is_muted`

### `chat_requests`
Manages the connection flow between users.
- `id` (uuid, PK)
- `sender_id` (uuid, FK)
- `receiver_id` (uuid, FK)
- `status` ('pending', 'accepted', 'rejected')

### `messages`
Stores the actual chat payloads.
- `id` (uuid, PK)
- `conversation_id` (uuid, FK)
- `sender_id` (uuid, FK)
- `content` (text)
- `type` ('text', 'image', 'video', 'audio', etc.)
- `read_by` (jsonb array of user IDs)

### `attachments`
Manages file metadata linked to messages.
- `id` (uuid, PK)
- `message_id` (uuid, FK)
- `storage_path` (text)

## Row Level Security (RLS) Philosophy
- Users can **only** read `conversations` and `messages` if they have a matching record in `conversation_participants`.
- Users can **only** insert messages into conversations they belong to.
- Users can **only** read `chat_requests` where they are either the sender or receiver.
- Direct table access is blocked for administrative tables (`admin_audit`), relying on Server Actions using the Service Role key to bypass RLS securely.
