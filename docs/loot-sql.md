# Loot picks

Bucket `loot` stays public.

```sql
create table if not exists loot_covers (
  id text primary key,
  image_url text not null,
  prompt text,
  updated_at timestamptz default now()
);

create table if not exists loot_settings (
  id int primary key default 1,
  default_tag text default 'thievnsden-20',
  updated_at timestamptz default now()
);

insert into loot_settings (id, default_tag)
values (1, 'thievnsden-20')
on conflict (id) do nothing;

create table if not exists loot_picks (
  id text primary key,
  section text not null default 'desk',
  name text not null,
  snippet text default '',
  body text default '',
  image_url text,
  search_query text default '',
  asin text default '',
  dest_url text default '',
  tag_override text default '',
  status text default 'In the Den',
  active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index if not exists loot_picks_section_idx
  on loot_picks (section, sort_order, created_at desc);
```
