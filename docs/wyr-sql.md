# Would You Rather tables

## Votes (live %)

```sql
create table if not exists wyr_votes (
  pair_id text primary key,
  picks_a int not null default 0,
  picks_b int not null default 0,
  updated_at timestamptz not null default now()
);
```

## Questions (source of truth)

```sql
create table if not exists wyr_pairs (
  id text primary key,
  a text not null,
  b text not null,
  heat text not null default 'spicy',
  packs text[] not null default '{}',
  a_lean jsonb not null default '{"appetite":1,"image":1,"stay":1}'::jsonb,
  b_lean jsonb not null default '{"appetite":1,"image":1,"stay":1}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wyr_pairs_active_idx on wyr_pairs (active);
```

After this exists, open **Admin → WYR** and hit **Seed built-in bank** once.
The game reads this table. Code bank is only a fallback + seed source.
