# Afterimage tables

Run in Supabase SQL editor.

Create a **public** Storage bucket named `afterimage`.

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

create index if not exists afterimage_prints_public_idx
  on afterimage_prints (created_at desc)
  where is_public = true and rejected = false;

create index if not exists afterimage_prints_user_idx
  on afterimage_prints (user_id, created_at desc);

create table if not exists afterimage_wallets (
  user_id uuid primary key,
  credits int default 0,
  preview_used boolean default false,
  updated_at timestamptz default now()
);
```
