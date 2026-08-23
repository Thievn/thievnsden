# Loot covers

Storage → New bucket

- Name: `loot`
- Public: ON
- MIME: image/jpeg

SQL:

```sql
create table if not exists loot_covers (
  id text primary key,
  image_url text not null,
  prompt text,
  updated_at timestamptz default now()
);
```
