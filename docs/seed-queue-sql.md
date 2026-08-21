# Seed job queue

Run in Supabase SQL editor so Admin → Seeds can queue bulk demos and keep running after you close the tab.

```sql
create table if not exists seed_jobs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending',
  total int not null check (total > 0 and total <= 25),
  completed int not null default 0,
  failed int not null default 0,
  make_public boolean not null default true,
  mode text not null default 'random',
  preset text,
  filters jsonb not null default '{}'::jsonb,
  log jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seed_jobs_status_created_idx
  on seed_jobs (status, created_at);
```

Statuses: `pending` → `running` → `completed` | `cancelled`

Processing is **one demo at a time** with a single automatic retry on failure.
