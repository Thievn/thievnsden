# Afterimage catalog

Run this once, then Admin → Afterimage → Seed catalog.

```sql
create table if not exists afterimage_catalog (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  slug text not null,
  label text not null,
  hint text default '',
  parent_slug text default '',
  prompt text default '',
  aliases text default '',
  sort_order int default 0,
  created_at timestamptz default now()
);

create unique index if not exists afterimage_catalog_kind_slug
  on afterimage_catalog (kind, slug);

create index if not exists afterimage_catalog_search
  on afterimage_catalog (kind, label);
```
