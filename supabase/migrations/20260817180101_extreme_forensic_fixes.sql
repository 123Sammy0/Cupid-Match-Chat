-- 1. PROFILES: Prevent Privilege Escalation (IDOR)
-- The existing UPDATE policy allows users to update ANY column in their profile.
-- We add a BEFORE UPDATE trigger to protect sensitive columns.

CREATE OR REPLACE FUNCTION public.restrict_profile_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user modifying the profile is authenticated (a regular user bypassing UI)
  -- Note: The admin server actions use the service_role which bypasses RLS and triggers can check auth.role().
  IF auth.role() = 'authenticated' THEN
    -- Force restricted columns to remain unchanged
    NEW.role := OLD.role;
    NEW.active := OLD.active;
    NEW.is_suspended := OLD.is_suspended;
    NEW.deleted_at := OLD.deleted_at;
    -- Users shouldn't be spoofing last_login_at either
    NEW.last_login_at := OLD.last_login_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_restrict_profile_updates ON public.profiles;
CREATE TRIGGER tr_restrict_profile_updates
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_profile_updates();


-- 2. MESSAGES: Prevent Sender/Conversation Spoofing (IDOR)
-- The existing check_message_update_privileges trigger protects content from being altered by others,
-- but allows the original sender to modify ANY column, including sender_id and conversation_id.

CREATE OR REPLACE FUNCTION public.check_message_update_privileges()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.sender_id != auth.uid() THEN
    -- Other users (like readers updating read_by or reactions) cannot change core fields
    NEW.content := OLD.content;
    NEW.type := OLD.type;
    NEW.sender_id := OLD.sender_id;
    NEW.conversation_id := OLD.conversation_id;
    NEW.expires_at := OLD.expires_at;
    NEW.sent_at := OLD.sent_at;
  ELSE
    -- The original sender is updating. They STILL CANNOT change who sent it or where it belongs.
    NEW.sender_id := OLD.sender_id;
    NEW.conversation_id := OLD.conversation_id;
    NEW.sent_at := OLD.sent_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. CHAT REQUESTS: Prevent Sender Spoofing
CREATE OR REPLACE FUNCTION public.restrict_chat_request_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    -- A user cannot change the sender or receiver of a request, only the status
    NEW.sender_id := OLD.sender_id;
    NEW.receiver_id := OLD.receiver_id;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_requests') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS tr_restrict_chat_request_updates ON public.chat_requests;';
    EXECUTE 'CREATE TRIGGER tr_restrict_chat_request_updates BEFORE UPDATE ON public.chat_requests FOR EACH ROW EXECUTE FUNCTION public.restrict_chat_request_updates();';
  END IF;
END $$;

-- 4. STORAGE: Enforce path constraints for chat-media
-- Prevents users from overwriting other users' avatars or media
DROP POLICY IF EXISTS "Authenticated users can upload to chat-media" ON storage.objects;
CREATE POLICY "Authenticated users can upload to chat-media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-media' AND
    (
      -- Option A: Avatars folder (avatars/<user_id>/...)
      ( (storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text )
      OR
      -- Option B: Conversations folder (<conversation_id>/...)
      ( 
        public.is_conversation_member((storage.foldername(name))[1]::uuid, auth.uid())
      )
    )
  );

-- Also fix UPDATE policy just in case (though we use upsert: false, someone could bypass)
DROP POLICY IF EXISTS "Authenticated users can update chat-media" ON storage.objects;
CREATE POLICY "Authenticated users can update chat-media"
  ON storage.objects FOR UPDATE TO authenticated
  WITH CHECK (
    bucket_id = 'chat-media' AND
    (
      ( (storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text )
      OR
      ( public.is_conversation_member((storage.foldername(name))[1]::uuid, auth.uid()) )
    )
  );


-- 5. PERFORMANCE: getConversations O(N) fix
-- Create a secure DB function to fetch conversations, latest message, and unread count without pulling all messages to Node
CREATE OR REPLACE FUNCTION public.get_user_conversations_with_stats(p_user_id uuid)
RETURNS TABLE (
  conversation_id uuid,
  updated_at timestamptz,
  is_group boolean,
  is_pinned boolean,
  is_archived boolean,
  last_read_at timestamptz,
  other_user_id uuid,
  other_username text,
  other_avatar_url text,
  other_bio text,
  last_message_content text,
  last_message_type text,
  last_message_sender_id uuid,
  last_message_sent_at timestamptz,
  unread_count bigint
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.conversation_id,
    c.updated_at,
    c.is_group,
    cp.is_pinned,
    cp.is_archived,
    cp.last_read_at,
    p.id as other_user_id,
    p.username as other_username,
    p.avatar_url as other_avatar_url,
    p.bio as other_bio,
    lm.content as last_message_content,
    lm.type as last_message_type,
    lm.sender_id as last_message_sender_id,
    lm.sent_at as last_message_sent_at,
    COALESCE(uc.count, 0) as unread_count
  FROM public.conversation_participants cp
  JOIN public.conversations c ON c.id = cp.conversation_id
  -- Join the OTHER participant
  LEFT JOIN public.conversation_participants cp2 ON cp2.conversation_id = cp.conversation_id AND cp2.profile_id != p_user_id
  LEFT JOIN public.profiles p ON p.id = cp2.profile_id
  -- Lateral join to get the latest message extremely fast (using the idx_messages_conversation_sent_at index)
  LEFT JOIN LATERAL (
    SELECT m.content, m.type, m.sender_id, m.sent_at 
    FROM public.messages m 
    WHERE m.conversation_id = cp.conversation_id 
    ORDER BY m.sent_at DESC 
    LIMIT 1
  ) lm ON true
  -- Lateral join to get unread count
  LEFT JOIN LATERAL (
    SELECT count(*) 
    FROM public.messages m 
    WHERE m.conversation_id = cp.conversation_id 
      AND m.sender_id != p_user_id 
      AND m.sent_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamptz)
  ) uc ON true
  WHERE cp.profile_id = p_user_id
  ORDER BY COALESCE(lm.sent_at, c.updated_at) DESC;
END;
$$ LANGUAGE plpgsql;


-- FIX REGRESSION: Avatar uploads were blocked by the previous storage RLS patch.
DROP POLICY IF EXISTS "Users can upload media" ON storage.objects;
CREATE POLICY "Users can upload media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-media' AND (
    (storage.foldername(name))[1] = 'avatars' AND (storage.foldername(name))[2] = auth.uid()::text
    OR
    (storage.foldername(name))[1] IN (
      SELECT conversation_id::text
      FROM public.conversation_participants
      WHERE profile_id = auth.uid()
    )
  )
);
