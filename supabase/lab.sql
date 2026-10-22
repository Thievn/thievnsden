-- Lab gallery for ThievnsDen (Supabase project yifocyooygtxwvqfwghv).
-- Saved characters are not part of the lab. This file does not create a character table.
-- Pictures stay in public.attic_images and the private attic storage bucket
-- from supabase/attic.sql.
-- favorite marks a favorite. folder holds comma-separated tags.
-- src records provenance: lab or upload. Edits keep the weaker source.
-- Idempotent and non-destructive. The app does not run this file.

alter table public.attic_images add column if not exists src text;

alter table public.attic_images enable row level security;
alter table public.attic_images force row level security;

revoke all on public.attic_images from anon, authenticated;
grant all on public.attic_images to service_role;
