-- ============================================================================
-- FINAL RLS HARDENING - FIXING ZERO-DAY VULNERABILITIES
-- ============================================================================

-- 1. Create a SECURITY DEFINER function to securely check user status without infinite recursion
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN AS $$
DECLARE
  v_active BOOLEAN;
  v_is_suspended BOOLEAN;
  v_deleted_at TIMESTAMPTZ;
BEGIN
  -- Always return false if not authenticated
  IF auth.role() != 'authenticated' THEN
    RETURN FALSE;
  END IF;

  SELECT active, is_suspended, deleted_at 
  INTO v_active, v_is_suspended, v_deleted_at
  FROM public.profiles 
  WHERE id = auth.uid();

  -- User must be active, not suspended, and not deleted
  IF v_active = true AND (v_is_suspended IS NULL OR v_is_suspended = false) AND v_deleted_at IS NULL THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing vulnerable policies
DROP POLICY IF EXISTS "Users can read conversations they are in" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;

DROP POLICY IF EXISTS "Users can read their own participant records" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participant settings" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can insert participants" ON public.conversation_participants;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages into their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;


-- 3. Create hardened policies with is_active_user() AND metadata anti-spoofing checks

-- ============================================================================
-- PROFILES
-- ============================================================================

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING ( public.is_active_user() AND id = auth.uid() )
    WITH CHECK ( public.is_active_user() AND id = auth.uid() );

-- ============================================================================
-- CONVERSATIONS
-- ============================================================================

CREATE POLICY "Users can read conversations they are in"
    ON public.conversations FOR SELECT
    USING (
      public.is_active_user() AND
      EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = conversations.id
        AND profile_id = auth.uid()
      )
    );

CREATE POLICY "Users can insert conversations"
    ON public.conversations FOR INSERT
    WITH CHECK ( public.is_active_user() );

-- ============================================================================
-- CONVERSATION PARTICIPANTS
-- ============================================================================

CREATE POLICY "Users can read their own participant records"
    ON public.conversation_participants FOR SELECT
    USING ( public.is_active_user() AND profile_id = auth.uid() );

CREATE POLICY "Users can update their own participant settings"
    ON public.conversation_participants FOR UPDATE
    USING ( public.is_active_user() AND profile_id = auth.uid() )
    WITH CHECK ( public.is_active_user() AND profile_id = auth.uid() );

CREATE POLICY "Users can insert participants"
    ON public.conversation_participants FOR INSERT
    WITH CHECK (
      public.is_active_user() AND (
        profile_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles p WHERE p.id = conversation_participants.profile_id AND p.role = 'admin'
        )
      )
    );

-- ============================================================================
-- MESSAGES
-- ============================================================================

CREATE POLICY "Users can view messages in their conversations"
    ON public.messages FOR SELECT
    USING (
      public.is_active_user() AND
      EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND profile_id = auth.uid()
      )
    );

CREATE POLICY "Users can insert messages into their conversations"
    ON public.messages FOR INSERT
    WITH CHECK (
      public.is_active_user() AND
      sender_id = auth.uid() AND
      EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND profile_id = auth.uid()
      ) AND
      -- ANTI-SPOOFING: Normal users cannot inject admin metadata
      (metadata IS NULL OR metadata = '{}'::jsonb OR (NOT (metadata ? 'is_admin_reply') AND NOT (metadata ? 'redacted_by')))
    );

CREATE POLICY "Users can update their own messages"
    ON public.messages FOR UPDATE
    USING ( public.is_active_user() AND sender_id = auth.uid() )
    WITH CHECK (
      public.is_active_user() AND
      sender_id = auth.uid() AND
      EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = messages.conversation_id
        AND profile_id = auth.uid()
      ) AND
      -- ANTI-SPOOFING
      (metadata IS NULL OR metadata = '{}'::jsonb OR (NOT (metadata ? 'is_admin_reply') AND NOT (metadata ? 'redacted_by')))
    );

CREATE POLICY "Users can delete their own messages"
    ON public.messages FOR DELETE
    USING ( public.is_active_user() AND sender_id = auth.uid() );
