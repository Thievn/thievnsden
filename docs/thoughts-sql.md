# Thoughts (admin generator)

```sql
create table if not exists den_thoughts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  body text not null,
  cover_url text,
  outlook text,
  topic text,
  heat text,
  form text,
  fingerprint text,
  recipe jsonb default '{}'::jsonb,
  published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists den_thoughts_pub on den_thoughts (published, created_at desc);
create index if not exists den_thoughts_fingerprint on den_thoughts (fingerprint);
create index if not exists den_thoughts_updated on den_thoughts (updated_at desc);
```

Every Draft click writes an unpublished row so later drafts can refuse the same idea.
Public `/api/thoughts` only returns `published = true`.
