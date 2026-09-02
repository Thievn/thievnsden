# Night Grab

Scores (`night_grab_runs`) and per-user meta (`night_grab_meta`) are written by the app with the service role.

`site_settings.night_grab_live` (boolean, default true) gates board posts. Guests play free. Saving the board needs an account.

```sql
create table if not exists night_grab_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  username text,
  score int not null default 0,
  extracted int not null default 0,
  clocked int not null default 0,
  combo int not null default 1,
  floor text,
  loadout text,
  badges text[] default '{}',
  created_at timestamptz not null default now()
);

create index if not exists night_grab_runs_score_idx on night_grab_runs (score desc, created_at desc);

create table if not exists night_grab_meta (
  user_id uuid primary key references auth.users(id) on delete cascade,
  best_score int not null default 0,
  best_combo int not null default 0,
  extracts int not null default 0,
  badges text[] default '{}',
  updated_at timestamptz not null default now()
);

alter table night_grab_runs enable row level security;
alter table night_grab_meta enable row level security;

create policy if not exists night_grab_runs_read on night_grab_runs for select using (true);
create policy if not exists night_grab_runs_insert on night_grab_runs for insert to authenticated with check (auth.uid() = user_id);
create policy if not exists night_grab_meta_own on night_grab_meta for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table site_settings add column if not exists night_grab_live boolean default true;
```
