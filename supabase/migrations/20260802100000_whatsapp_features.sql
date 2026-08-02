alter table public.messages add column is_edited boolean default false not null;
alter table public.messages add column edited_at timestamptz;
alter table public.messages add column is_deleted boolean default false not null;
alter table public.messages add column deleted_at timestamptz;
alter table public.messages add column deleted_by jsonb default '[]'::jsonb not null;
