# Afterimage setup

Do this in Supabase. One bucket for everyone. Each account gets its own folder inside it.

## 1. Storage bucket

Dashboard → Storage → New bucket

- Name: `afterimage`
- Public bucket: **ON** (needed so the board and account thumbnails load)
- File size limit: 8 MB is plenty
- Allowed MIME: `image/jpeg`, `image/png`, `image/webp`

Do **not** make a new bucket per user. Files already save as:

`afterimage / {user-uuid} / timestamp.jpg`

That is their locker.

## 2. SQL editor — paste all of this once

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

alter table afterimage_prints enable row level security;
alter table afterimage_wallets enable row level security;

drop policy if exists afterimage_prints_select on afterimage_prints;
create policy afterimage_prints_select on afterimage_prints
  for select using (
    is_public = true
    or auth.uid() = user_id
  );

drop policy if exists afterimage_wallets_select on afterimage_wallets;
create policy afterimage_wallets_select on afterimage_wallets
  for select using (auth.uid() = user_id);
```

The site APIs use the service role key, so they can still insert, hide, delete, and grant credits.

## 3. Check it worked

- Tables: `afterimage_prints`, `afterimage_wallets`
- Bucket: `afterimage` marked Public
- Print one from Admin → Afterimage with “Show on board” on
- File should appear under Storage → afterimage → your user id
- Public ones show on `/afterimage`
- All of yours show on `/account/afterimage`
