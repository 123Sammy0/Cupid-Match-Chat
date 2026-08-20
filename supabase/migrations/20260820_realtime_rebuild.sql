-- ============================================================================
-- CUPID MATCH CHAT — REALTIME SYSTEM REBUILD
-- Run in Supabase Dashboard > SQL Editor > New Query
--
-- This migration:
--   1. Adds message status tracking (pending/sent/delivered/read/failed)
--   2. Adds message version for event ordering
--   3. Adds proper presence status to profiles
--   4. Ensures admin_takeovers is in realtime publication
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Message status enum + column
-- Default 'sent' for backward compatibility with existing messages
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_status') THEN
    CREATE TYPE message_status AS ENUM ('pending', 'processing', 'sent', 'delivered', 'read', 'failed');
  END IF;
END $$;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS status message_status DEFAULT 'sent' NOT NULL;

-- ----------------------------------------------------------------------------
-- STEP 2: Message version for event ordering
-- Auto-incremented on every UPDATE via trigger
-- ----------------------------------------------------------------------------
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 1 NOT NULL;

CREATE OR REPLACE FUNCTION public.increment_message_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_message_version ON public.messages;
CREATE TRIGGER trg_increment_message_version
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_message_version();

-- ----------------------------------------------------------------------------
-- STEP 3: Presence status on profiles
-- Replaces the unreliable last_seen-based "Online" detection
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'presence_status') THEN
    CREATE TYPE presence_status AS ENUM ('online', 'away', 'offline', 'reconnecting', 'unknown');
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS presence_status presence_status DEFAULT 'offline' NOT NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS connection_id uuid;

-- Index for efficient presence queries
CREATE INDEX IF NOT EXISTS idx_profiles_presence_status
  ON public.profiles (presence_status)
  WHERE presence_status = 'online';

-- ----------------------------------------------------------------------------
-- STEP 4: Ensure admin_takeovers is in realtime publication
-- Required for cross-device Human Mode synchronization
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'admin_takeovers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_takeovers;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 5: Verify all required tables are in realtime publication
-- Safety net — idempotent
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- DONE
-- ----------------------------------------------------------------------------
SELECT
  'REALTIME REBUILD MIGRATION APPLIED!' AS status,
  (SELECT count(*) FROM pg_publication_tables WHERE pubname = 'supabase_realtime') AS realtime_tables_count;
