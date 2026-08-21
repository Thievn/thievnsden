# Gaming settings columns

Run this in the Supabase SQL editor so Admin → Gaming can persist config and cards.

```sql
alter table site_settings
  add column if not exists gaming_config jsonb default '{}'::jsonb;

alter table site_settings
  add column if not exists gaming_items jsonb default '[]'::jsonb;
```

Until these columns exist, the public `/gaming` page still works using built-in seed cards.
The admin save will return an error with a hint if the columns are missing.

## RAWG

1. Create a free API key at https://rawg.io/apidocs
2. Paste it in **Admin → Gaming → RAWG API key**
3. Enable radar and save

Platform id `4` = PC on RAWG.
