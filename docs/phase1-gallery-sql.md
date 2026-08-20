# Phase 1 — Gallery data foundation

Run this in **Supabase → SQL Editor** (all at once is fine).

```sql
-- Extend judgments for gallery + seeds
alter table public.judgments
  add column if not exists image_url text,
  add column if not exists is_demo boolean not null default false,
  add column if not exists likes int not null default 0,
  add column if not exists dislikes int not null default 0;

-- is_public may already exist from earlier work
alter table public.judgments
  add column if not exists is_public boolean not null default false;

create index if not exists judgments_public_created_idx
  on public.judgments (is_public, created_at desc)
  where is_public = true;

create index if not exists judgments_demo_idx
  on public.judgments (is_demo)
  where is_demo = true;

-- Votes (one vote per judgment per voter key)
create table if not exists public.gallery_votes (
  id uuid default gen_random_uuid() primary key,
  judgment_id uuid not null references public.judgments(id) on delete cascade,
  voter_key text not null,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz default now(),
  unique (judgment_id, voter_key)
);

create index if not exists gallery_votes_judgment_idx
  on public.gallery_votes (judgment_id);

alter table public.gallery_votes enable row level security;

-- Service role bypasses RLS; keep policies tight for anon/authenticated later
```

## Storage bucket

1. Supabase → **Storage** → **New bucket**
2. Name: `judgment-images`
3. **Public bucket**: ON (gallery needs readable URLs)
4. Optional file size limit: 5MB
5. Allowed MIME: `image/jpeg`, `image/png`, `image/webp`

## Verify

Table Editor → `judgments` should show: `image_url`, `is_demo`, `is_public`, `likes`, `dislikes`  
Table Editor → `gallery_votes` exists  
Storage → `judgment-images` exists

After that, say **start phase 2**.
