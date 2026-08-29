# Heat Check — data

SQL lives in the repo. Apply in the Supabase SQL editor. Do not expose this as a public upload drop.

## Buckets

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('heat-faces', 'heat-faces', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('heat-uploads', 'heat-uploads', false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('heat-rewards', 'heat-rewards', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
```

`heat-uploads` stays private. Tips may mention crop and lighting. Admins read via the service role.

## Settings

```sql
alter table public.site_settings
  add column if not exists heat_settings jsonb not null default '{}'::jsonb;
```

Defaults (kill off, not public, peek on, face gen on, reward threshold 8) live in `src/lib/heat-check.ts`. Flip `public` when everyone can play. Kill switch still blocks non-admin Grok.

## Tables

```sql
create table if not exists public.heat_names (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.heat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_name text not null,
  contact_face_url text,
  role text not null,
  heat text not null,
  voice text not null,
  who_starts text not null default 'they',
  skin text not null default 'ios',
  mood text not null default 'same',
  user_photo_path text,
  generate_face boolean not null default false,
  reward_photo_sent boolean not null default false,
  peek boolean not null default true,
  ended boolean not null default false,
  end_reason text,
  last_seen_label text,
  recap jsonb,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists heat_threads_user_idx
  on public.heat_threads (user_id, created_at desc);

create table if not exists public.heat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.heat_threads(id) on delete cascade,
  user_id uuid not null,
  sender text not null,
  body text,
  image_url text,
  score int,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists heat_messages_thread_idx
  on public.heat_messages (thread_id, created_at);

create table if not exists public.heat_tips (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.heat_threads(id) on delete cascade,
  message_id uuid references public.heat_messages(id) on delete set null,
  user_id uuid not null,
  tip text not null,
  score int not null,
  rewrite text,
  mood text,
  created_at timestamptz not null default now()
);

create index if not exists heat_tips_thread_idx
  on public.heat_tips (thread_id, created_at desc);

create table if not exists public.heat_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid references public.heat_threads(id) on delete set null,
  line text not null,
  created_at timestamptz not null default now()
);

create index if not exists heat_saves_user_idx
  on public.heat_saves (user_id, created_at desc);

create table if not exists public.heat_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  thread_id uuid,
  message_id uuid,
  reason text,
  notes text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.heat_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  thread_id uuid,
  kind text not null,
  bucket text not null,
  path text not null,
  url text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists heat_assets_status_idx
  on public.heat_assets (status, created_at desc);

-- Credits stub only. 1 free round/day later. No checkout. Failed gens never increment.
create table if not exists public.heat_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  extra int not null default 0,
  free_used_on date,
  updated_at timestamptz not null default now()
);

create table if not exists public.heat_roles (
  slug text primary key,
  label text not null,
  body text not null default '',
  sort int not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.heat_heats (
  slug text primary key,
  label text not null,
  body text not null default '',
  sort int not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.heat_voices (
  slug text primary key,
  label text not null,
  body text not null default '',
  sort int not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.heat_openers (
  slug text primary key,
  label text not null,
  body text not null default '',
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.heat_compiled_prompts (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  heat text not null,
  voice text not null,
  opener text not null,
  compiled_text text not null,
  source_hash text not null,
  stale boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (role, heat, voice, opener)
);

alter table public.heat_threads add column if not exists opener text;
alter table public.heat_threads add column if not exists compiled_hash text;
alter table public.heat_names add column if not exists vibe text;

create table if not exists public.heat_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  look_key text not null,
  presentation text not null default 'default',
  appearance text not null default 'any',
  face_url text,
  pose_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists heat_contacts_user_key_idx
  on public.heat_contacts (user_id, look_key, created_at desc);

alter table public.heat_threads add column if not exists presentation text;
alter table public.heat_threads add column if not exists appearance text;
alter table public.heat_threads add column if not exists look_key text;
alter table public.heat_threads add column if not exists contact_id uuid references public.heat_contacts(id) on delete set null;
alter table public.heat_threads add column if not exists user_photo_url text;
```

## RLS

User owns their rows. Admin work goes through the service role.

```sql
alter table public.heat_threads enable row level security;
alter table public.heat_messages enable row level security;
alter table public.heat_tips enable row level security;
alter table public.heat_saves enable row level security;
alter table public.heat_reports enable row level security;
alter table public.heat_assets enable row level security;
alter table public.heat_roles enable row level security;
alter table public.heat_heats enable row level security;
alter table public.heat_voices enable row level security;
alter table public.heat_openers enable row level security;
alter table public.heat_compiled_prompts enable row level security;
alter table public.heat_contacts enable row level security;
```

create policy heat_threads_own on public.heat_threads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy heat_messages_own on public.heat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy heat_tips_own on public.heat_tips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy heat_saves_own on public.heat_saves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy heat_reports_own on public.heat_reports
  for insert with check (auth.uid() = user_id);

create policy heat_reports_read_own on public.heat_reports
  for select using (auth.uid() = user_id);

create policy heat_assets_own on public.heat_assets
  for select using (auth.uid() = user_id);

create policy heat_credits_own on public.heat_credits
  for select using (auth.uid() = user_id);

create policy heat_names_read on public.heat_names
  for select using (true);

create policy heat_contacts_own on public.heat_contacts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Storage: the app writes with the service role. Users never get a public drop.

```sql
create policy heat_faces_public_read on storage.objects
  for select using (bucket_id = 'heat-faces');

create policy heat_rewards_public_read on storage.objects
  for select using (bucket_id = 'heat-rewards');

create policy heat_uploads_owner_read on storage.objects
  for select using (
    bucket_id = 'heat-uploads'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Name pool seed

Wide first-name pool. The app also refuses repeats from the user's last 20 contacts. Admin can generate 50 more via Grok.

```sql
insert into public.heat_names (name) values
  ('Mara'),('Jules'),('Nico'),('Rae'),('Ellis'),('Vesper'),('Quinn'),('Ivy'),('Sol'),
  ('Wren'),('Kade'),('Liora'),('Ash'),('Noa'),('Soren'),('Vera'),('Caius'),('Juniper'),
  ('Theo'),('Nyx'),('Harlow'),('Onyx'),('Lumen'),('Remy'),('Sage'),('Ophelia'),('Cass'),
  ('Indigo'),('Willa'),('Fox'),('Esme'),('Rowan'),('Lux'),('Dorian'),('Pilar'),('Arlo'),
  ('Cleo'),('Silas'),('Maeve'),('Tamsin'),('Keane'),('Lark'),('Briar'),('Faye'),('Leith'),
  ('Orion'),('Anouk'),('Joss'),('Mireille'),('Cal'),('Seraphine'),('Bo'),('Isolde'),
  ('Nash'),('Yara'),('Rhys'),('Paloma'),('Kit'),('Aurelia'),('Vale'),('Marlow'),('Zinnia'),
  ('Reed'),('Odette'),('Pascal'),('Idris'),('Cosima'),('Hart'),('Shay'),('Blythe'),
  ('Corin'),('Elodie'),('Tove'),('Ander'),('Nerissa'),('Grey'),('Mila'),('Jasper'),
  ('Oona'),('Leander'),('Priya'),('Dax'),('Amara'),('Linnea'),('Cruz'),('Hana'),
  ('Evander'),('Sable'),('Otto'),('Wrenley'),('Ellisyn'),('Lumenna'),('Sablette')
on conflict (name) do nothing;
```
