-- 1. Drop the overly restrictive policy that prevents reacting to other people's messages
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- 2. Create the new participant-based UPDATE policy
-- This allows any participant of a conversation to attempt an UPDATE on any message in that conversation.
CREATE POLICY "Users can update messages in their conversations"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND profile_id = auth.uid()
    )
  );

-- 3. Create the security function to prevent content tampering
-- Even though users can now UPDATE other people's messages, this trigger strictly enforces
-- that they can ONLY modify the 'reactions' column.
CREATE OR REPLACE FUNCTION public.check_message_update_privileges()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user modifying the message is NOT the original sender...
  IF OLD.sender_id != auth.uid() THEN
    
    -- ...strictly verify that all protected fields remain identical.
    -- If they try to change the message content, type, or timestamps, we block it.
    IF NEW.content != OLD.content 
       OR NEW.type != OLD.type 
       OR NEW.sender_id != OLD.sender_id 
       OR NEW.conversation_id != OLD.conversation_id
       OR NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
      
      RAISE EXCEPTION 'Access Denied: You cannot modify the content of a message you did not send.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach the trigger to the messages table
DROP TRIGGER IF EXISTS tr_check_message_update ON public.messages;
CREATE TRIGGER tr_check_message_update
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.check_message_update_privileges();
