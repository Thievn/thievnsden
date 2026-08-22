# Would You Rather

Optional. The game ships with a built-in bank and works without this.
Run it if you want live % splits stored in Supabase.

```sql
create table if not exists wyr_votes (
  pair_id text primary key,
  picks_a int not null default 0,
  picks_b int not null default 0,
  updated_at timestamptz not null default now()
);
```
