-- ============================================================
-- CUPID MATCH CHAT — File Sharing Storage Policy Migration
-- Generated: 2026-08-05
-- Run in Supabase Dashboard > SQL Editor ONLY if document
-- uploads fail with a storage permissions error.
-- ============================================================
-- The messages.type check constraint already allows 'document'
-- (defined in 20260727194527_init_schema.sql). No table changes needed.
-- ============================================================

-- Ensure the chat-media bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy: Authenticated users can upload to chat-media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Authenticated users can upload to chat-media'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Authenticated users can upload to chat-media"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'chat-media');
    $policy$;
  END IF;
END $$;

-- Policy: Authenticated users can read files in chat-media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Authenticated users can read chat-media'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Authenticated users can read chat-media"
        ON storage.objects FOR SELECT
        TO authenticated
        USING (bucket_id = 'chat-media');
    $policy$;
  END IF;
END $$;

SELECT 'Storage policies applied (or already exist).' AS result;
