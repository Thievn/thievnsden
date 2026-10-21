-- Den's Attic. Owner-only. Run once in the Supabase SQL editor.
-- The app uses the service role. RLS is forced and there are no policies,
-- so the anon and authenticated roles cannot read or write these tables.

create table if not exists public.attic_profile (
  id smallint primary key default 1 check (id = 1),
  face_path text,
  body_path text,
  body_notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.attic_folders (
  name text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.attic_images (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null,
  prompt text not null default '',
  negative text not null default '',
  model text,
  style text,
  seed bigint,
  steps int,
  cfg numeric,
  width int,
  height int,
  strength numeric,
  favorite boolean not null default false,
  folder text,
  storage_path text,
  status text not null default 'queued',
  runpod_id text,
  content_sha text,
  upload_sha text,
  error text,
  parent_id uuid
);

alter table public.attic_images add column if not exists upload_sha text;

create index if not exists attic_images_created_idx on public.attic_images (created_at desc);

alter table public.attic_profile enable row level security;
alter table public.attic_profile force row level security;
alter table public.attic_folders enable row level security;
alter table public.attic_folders force row level security;
alter table public.attic_images enable row level security;
alter table public.attic_images force row level security;

revoke all on public.attic_profile from anon, authenticated;
revoke all on public.attic_folders from anon, authenticated;
revoke all on public.attic_images from anon, authenticated;
grant all on public.attic_profile to service_role;
grant all on public.attic_folders to service_role;
grant all on public.attic_images to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('attic', 'attic', false, 10485760, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = false;
