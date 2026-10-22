-- Lab characters for ThievnsDen (Supabase project yifocyooygtxwvqfwghv).
-- Owner-only. Run once in that project's SQL editor. The app does not run this file.
-- Gallery pictures stay in public.attic_images from supabase/attic.sql.
-- The app uses the service role. RLS is forced and there are no policies,
-- so the anon and authenticated roles cannot read or write this table.

create table if not exists public.lab_characters (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  style text not null default 'semireal',
  appearance jsonb not null default '{}'::jsonb,
  personality text not null default '',
  scene text not null default '',
  prompt text not null default '',
  cover_path text,
  favorite boolean not null default false
);

create index if not exists lab_characters_updated_idx on public.lab_characters (updated_at desc);

alter table public.lab_characters enable row level security;
alter table public.lab_characters force row level security;

revoke all on public.lab_characters from anon, authenticated;
grant all on public.lab_characters to service_role;
