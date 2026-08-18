-- Create feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
    key TEXT PRIMARY KEY,
    enabled BOOLEAN DEFAULT true,
    description TEXT,
    value JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Insert default feature flags
INSERT INTO public.feature_flags (key, enabled, description, value) VALUES
('gate_password', true, 'Global Gate Entry Password', '{"password": "1212"}'::jsonb),
('maintenance_mode', false, 'If true, blocks regular users from logging in.', '{}'),
('registration_enabled', true, 'If true, allows new users to register.', '{}')
ON CONFLICT (key) DO NOTHING;
