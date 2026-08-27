# Gaming

Admin → Gaming is the desk. The public `/gaming` page is only a set of small shelves.

## What runs by itself

A Vercel cron hits `/api/cron/gaming` every day at **15:00 UTC**.

If auto-add is on and the RAWG key is saved, it:

1. Picks **five** random titles mixed across **just out**, **coming soon**, and **older / classics**
2. Pulls facts, ratings, and a cover from RAWG
3. Copies the cover into your storage as a JPEG
4. Asks Grok for a **short honest take** using those ratings (not a recap)
5. Publishes the card so `/gaming/{slug}` actually has a body

Every other day it also writes one **Den take** (culture notes like the good old days).

You do not need to sit in admin for the daily drop. Open Gaming when you want to search, rewrite, or kill a card.

## Manual desk

- Search RAWG by title → click a result → it lands on a shelf with a take
- Write this take → Grok writes a culture note from the topic list
- Fill empty takes → repairs cards that have covers but no article body
- Pull today now → runs the same job as the cron

## SQL

```sql
alter table site_settings
  add column if not exists gaming_config jsonb default '{}'::jsonb;

alter table site_settings
  add column if not exists gaming_items jsonb default '[]'::jsonb;
```

## RAWG

1. Create a key at https://rawg.io/apidocs
2. Paste it in Admin → Gaming
3. Leave auto-add on

Platform id `4` is PC.
