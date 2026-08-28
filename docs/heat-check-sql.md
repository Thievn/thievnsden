# Heat Check

SQL and buckets are run in Supabase. Do not paste this on the public site.

If you already applied an earlier Heat Check migration, the `if not exists` statements are safe to re-run.

## Storage

Private buckets (no public listing):

- `heat-faces` — generated contact stills
- `heat-uploads` — player photos (tips only)
- `heat-rewards` — in-thread reward stills of the contact

If a bucket is missing, the app falls back to `afterimage/heat-check/...`.

## SQL

```sql
alter table site_settings
  add column if not exists heat_check jsonb default '{}'::jsonb;

create table if not exists heat_names (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  used_count int default 0,
  created_at timestamptz default now()
);

create table if not exists heat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  skin text not null default 'ios' check (skin in ('ios', 'android')),
  role text not null,
  heat text not null,
  voice text not null,
  they_start boolean default true,
  contact_name text not null,
  contact_face_url text,
  user_photo_url text,
  mood text default 'same',
  status text not null default 'active' check (status in ('active', 'recap', 'ended')),
  peek boolean default true,
  reward_used boolean default false,
  recap jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists heat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references heat_threads(id) on delete cascade,
  role text not null check (role in ('user', 'them', 'system')),
  body text,
  image_url text,
  mod_status text,
  created_at timestamptz default now()
);

create table if not exists heat_tips (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references heat_messages(id) on delete cascade,
  thread_id uuid,
  score int,
  tip text,
  rewrite text,
  created_at timestamptz default now()
);

create table if not exists heat_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  body text not null,
  source_thread uuid,
  created_at timestamptz default now()
);

create table if not exists heat_reports (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid,
  user_id uuid,
  reason text,
  preview text,
  created_at timestamptz default now()
);

create table if not exists heat_bans (
  user_id uuid primary key,
  reason text,
  created_at timestamptz default now()
);

alter table heat_threads add column if not exists reward_used boolean default false;
alter table heat_threads add column if not exists recap jsonb;
alter table heat_threads add column if not exists peek boolean default true;
alter table heat_messages add column if not exists mod_status text;
alter table heat_tips add column if not exists thread_id uuid;

create index if not exists heat_threads_user_idx on heat_threads (user_id, created_at desc);
create index if not exists heat_messages_thread_idx on heat_messages (thread_id, created_at);
create index if not exists heat_tips_thread_idx on heat_tips (thread_id, created_at);
create index if not exists heat_saves_user_idx on heat_saves (user_id, created_at desc);

alter table heat_names enable row level security;
alter table heat_threads enable row level security;
alter table heat_messages enable row level security;
alter table heat_tips enable row level security;
alter table heat_saves enable row level security;
alter table heat_reports enable row level security;
alter table heat_bans enable row level security;

drop policy if exists heat_threads_own on heat_threads;
create policy heat_threads_own on heat_threads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists heat_messages_own on heat_messages;
create policy heat_messages_own on heat_messages
  for all using (
    exists (select 1 from heat_threads t where t.id = thread_id and t.user_id = auth.uid())
  );

drop policy if exists heat_tips_own on heat_tips;
create policy heat_tips_own on heat_tips
  for all using (
    exists (select 1 from heat_threads t where t.id = thread_id and t.user_id = auth.uid())
  );

drop policy if exists heat_saves_own on heat_saves;
create policy heat_saves_own on heat_saves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists heat_reports_own on heat_reports;
create policy heat_reports_own on heat_reports
  for insert with check (auth.uid() = user_id);

drop policy if exists heat_names_read on heat_names;
create policy heat_names_read on heat_names for select using (true);

insert into heat_names (name) values
  ('Amina'), ('Ari'), ('Bao'), ('Camila'), ('Darius'), ('Elena'),
  ('Farah'), ('Gio'), ('Hana'), ('Imani'), ('Jules'), ('Kai'),
  ('Lina'), ('Mateo'), ('Noor'), ('Omar'), ('Priya'), ('Quinn'),
  ('Ravi'), ('Sasha'), ('Talia'), ('Ume'), ('Val'), ('Wren'),
  ('Yara'), ('Zeke'), ('Nico'), ('Soren'), ('Leila'), ('Kenji'),
  ('Marisol'), ('Dev'), ('Ines'), ('Tariq'), ('Nova'), ('Ellis'),
  ('Sahar'), ('Remy'), ('Anika'), ('Jalen'), ('Mira'), ('Otis'),
  ('Pilar'), ('Kofi'), ('Sable'), ('Theo'), ('Zara'), ('Idris')
on conflict (name) do nothing;

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('heat-faces', 'heat-faces', false, 5242880),
  ('heat-uploads', 'heat-uploads', false, 5242880),
  ('heat-rewards', 'heat-rewards', false, 5242880)
on conflict (id) do nothing;
```
