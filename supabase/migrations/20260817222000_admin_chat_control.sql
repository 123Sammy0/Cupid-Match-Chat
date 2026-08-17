-- Admin Chat Control Migration

-- 1. Add metadata to messages (for identifying admin replies)
ALTER TABLE public.messages
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Create admin_takeovers table
CREATE TABLE public.admin_takeovers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('active', 'ended')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX admin_takeovers_single_active ON public.admin_takeovers (conversation_id) WHERE status = 'active';

-- Index for quick lookups
CREATE INDEX idx_admin_takeovers_conversation_id ON public.admin_takeovers(conversation_id);
CREATE INDEX idx_admin_takeovers_admin_id ON public.admin_takeovers(admin_id);

-- Enable RLS
ALTER TABLE public.admin_takeovers ENABLE ROW LEVEL SECURITY;

-- Deny all client-side access. Only Service Role can access this table.
CREATE POLICY "Deny all client-side access to admin_takeovers" 
ON public.admin_takeovers 
FOR ALL 
TO authenticated, anon
USING (false);

-- Note: The service role (used by Server Actions) inherently bypasses RLS,
-- so no explicit policies are needed for it.
