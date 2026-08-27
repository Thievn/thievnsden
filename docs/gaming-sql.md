# Gaming

Admin → Gaming is the desk. The public `/gaming` page is shelves plus a full-page article on click.

## Shelves (by RAWG release date)

- **Coming soon** — no date, TBA, or a date still in the future
- **Out now** — released, and younger than eight years
- **Classics** — released eight or more years ago
- **Den takes** — culture notes, not date-shelved

Hades (2020) and Diablo 4 (2023) belong on Out now in 2026. A title dated September 2026 does not belong on Out now in August 2026.

## What runs by itself

A Vercel cron hits `/api/cron/gaming` every day at **15:00 UTC**.

If auto-add is on and the RAWG key is saved, it:

1. Picks **five** random titles mixed across **out now**, **coming soon**, and **classics** (date windows match the shelves above)
2. Pulls facts, ratings, and a cover from RAWG (no Grok credits if RAWG has art)
3. Copies the cover into your storage as a JPEG
4. If RAWG has no still, Grok paints one and saves it on the card
5. Asks Grok for a **full-page article** (~700–1000 words) using those ratings
6. Publishes the card so `/gaming/{slug}` actually has a body

Every other day it also writes one **Den take** (culture notes) **with a generated still**. Generate in admin also writes the JPEG onto the card immediately — you do not have to hit Save.

You do not need to sit in admin for the daily drop. Open Gaming when you want to search, rewrite, or kill a card.

## Manual desk

- Search RAWG by title → click a result → shelf comes from the release date, Grok writes the article
- Recategorize + expand articles → re-reads RAWG dates, moves cards, and rewrites short game pages
- Write this take → Grok writes a culture note from the topic list, with a generated still and underlined Amazon links on shoppable phrases (`tag=thievnsden-20`)
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
