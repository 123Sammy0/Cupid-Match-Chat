-- Replace the brittle exception-raising trigger with a secure silent reassignment trigger.
-- This completely eliminates the HTTP 400 Bad Request caused by strict PostgREST equality checks.

CREATE OR REPLACE FUNCTION public.check_message_update_privileges()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user modifying the message is NOT the original sender...
  IF OLD.sender_id != auth.uid() THEN
    
    -- Force all protected columns to remain exactly as they were in the database.
    -- This silently discards any malicious attempts to modify the message content,
    -- while allowing the 'reactions' JSONB update to pass through perfectly without throwing 400 errors.
    NEW.content := OLD.content;
    NEW.type := OLD.type;
    NEW.sender_id := OLD.sender_id;
    NEW.conversation_id := OLD.conversation_id;
    NEW.expires_at := OLD.expires_at;
    NEW.sent_at := OLD.sent_at;
    
    -- We specifically allow 'reactions' and 'read_by' to be modified.
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
