create table if not exists public.den_provenance (
  sha256 text primary key check (sha256 ~ '^[a-f0-9]{64}$'),
  phash text not null,
  origin text not null check (origin in ('t2i','edit')),
  clean boolean not null default false,
  parent_sha text,
  runpod_id text,
  image_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists den_provenance_phash on public.den_provenance (phash);
alter table public.den_provenance enable row level security;
revoke all on public.den_provenance from anon, authenticated;
