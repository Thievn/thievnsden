# X posts (admin log)

```sql
create table if not exists x_posts (
  id uuid primary key default gen_random_uuid(),
  post_id text unique,
  url text,
  body text not null default '',
  body_norm text not null default '',
  source text not null default 'manual',
  posted_at timestamptz,
  metrics jsonb default '{}'::jsonb,
  recipe jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists x_posts_created on x_posts (created_at desc);
create index if not exists x_posts_source on x_posts (source, posted_at desc);
```

Every Draft click writes a `source = 'draft'` row so later posts can refuse the same idea.
Tweaks update that row. Mark posted converts it instead of inserting a second copy.
Public site never reads this table.
