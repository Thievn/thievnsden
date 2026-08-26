# Highway Hunter scores (optional)

```sql
create table if not exists highway_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  username text,
  score int default 0,
  grade text,
  distance int default 0,
  kills int default 0,
  civ_hits int default 0,
  combo_max int default 0,
  created_at timestamptz default now()
);

create index if not exists highway_runs_score on highway_runs (score desc);

alter table highway_runs enable row level security;
```
