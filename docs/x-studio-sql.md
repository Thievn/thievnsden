# X Thoughts studio (admin)

Private queue + send layer. Public site never reads these tables.

```sql
alter table x_posts add column if not exists media_urls jsonb default '[]'::jsonb;
alter table x_posts add column if not exists zernio_post_id text;
alter table x_posts add column if not exists scheduled_for timestamptz;
alter table x_posts add column if not exists status text not null default 'draft';
alter table x_posts add column if not exists approved boolean not null default false;
alter table x_posts add column if not exists post_type text default 'thought';
alter table x_posts add column if not exists fail_reason text;
alter table x_posts add column if not exists aspect text;
update x_posts set status = 'sent' where posted_at is not null and status = 'draft';
create index if not exists x_posts_status on x_posts (status, scheduled_for);

create table if not exists x_cadence (
  id int primary key default 1,
  types text[] not null default array['thought','art','quote','mixed'],
  per_day int not null default 2,
  days int[] not null default array[0,1,2,3,4,5,6],
  times text[] not null default array['11:00','19:00'],
  timezone text not null default 'America/New_York',
  mode text not null default 'review',
  paused boolean not null default false,
  recipe jsonb default '{}'::jsonb,
  zernio_key text,
  zernio_account_id text,
  spend_cap int,
  updated_at timestamptz not null default now()
);
insert into x_cadence (id) values (1) on conflict (id) do nothing;
```
