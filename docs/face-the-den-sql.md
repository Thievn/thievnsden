# Face The Den — data

Public bucket `judgment-images` already exists (jpeg/png/webp, 5MB).

## SQL

```sql
alter table public.judgments
  add column if not exists intensity text,
  add column if not exists roast_length text,
  add column if not exists heat text,
  add column if not exists angle text;

create index if not exists judgments_public_likes_idx
  on public.judgments (likes desc, score desc)
  where is_public = true;

create index if not exists judgments_public_dislikes_idx
  on public.judgments (dislikes desc, score asc)
  where is_public = true;
```

Votes stay in `gallery_votes` (`value` 1 = Mark, -1 = Cut). Playing and voting require an account. Uploads go through `/api/face-the-den/upload` into `judgment-images/{user_id}/...`.
