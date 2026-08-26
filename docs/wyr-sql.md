# The Floor (Would You Rather)

Play deals **10 random pairs** from `wyr_pairs`. Live Grok is not used per round.
Host stings are stored on each pair (`a_sting`, `b_sting`). If the active pool
drops below ~460, a background refill adds a small batch.

```sql
alter table wyr_pairs add column if not exists topic text;
alter table wyr_pairs add column if not exists topic_b text;
alter table wyr_pairs add column if not exists a_sting text;
alter table wyr_pairs add column if not exists b_sting text;
alter table wyr_pairs add column if not exists source text not null default 'bank';

create index if not exists wyr_pairs_topic_idx on wyr_pairs (topic) where active;
create index if not exists wyr_pairs_source_idx on wyr_pairs (source);

create table if not exists wyr_meta (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
```

Votes stay in `wyr_votes`. Rebuild the 500-question pool with:

```
npx tsx scripts/generate-wyr-pool.ts --replace --count=500
```

Admin → WYR can refill 16 without wiping the table.
