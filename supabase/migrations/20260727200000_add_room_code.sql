-- Add room_code to messages and attachments

alter table public.messages add column room_code text not null default 'default-room';
alter table public.attachments add column room_code text not null default 'default-room';

-- Drop old policies to recreate with room_code if necessary, though RLS doesn't strictly need it right now unless we want to restrict by room.
-- But since it's a 2-person app, any authenticated user can view messages. 
-- Wait, the prompt says "Each code opens its own separate private conversation."
