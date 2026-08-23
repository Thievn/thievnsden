# Afterimage setup

## Storage
Public bucket `afterimage`.

## SQL

```sql
create table if not exists afterimage_prints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  username text,
  image_url text not null,
  want text,
  compiled_prompt text,
  phone_id text,
  style_id text,
  heat text default 'flirty',
  finish text default 'preview',
  model text,
  resolution text,
  aspect text,
  is_public boolean default false,
  is_admin boolean default false,
  rejected boolean default false,
  created_at timestamptz default now()
);

create table if not exists afterimage_wallets (
  user_id uuid primary key,
  credits int default 0,
  preview_used boolean default false,
  updated_at timestamptz default now()
);

create table if not exists afterimage_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  username text,
  status text default 'queued',
  payload jsonb default '{}'::jsonb,
  print_id uuid,
  image_url text,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```
