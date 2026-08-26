# House cast (Supabase)

Already applied on the live project. Keep this as the source of truth if you rebuild.

House accounts are Cast portraits. They never show as “demo” on the public site.

```sql
alter table public.profiles
  add column if not exists is_demo boolean not null default false;

update public.profiles p
set is_demo = true
where p.is_demo = false
  and (
    exists (
      select 1 from public.judgments j
      where j.user_id = p.id and j.is_demo = true
    )
    or lower(p.username) like 'demo%'
  );

create table if not exists public.used_usernames (
  username text primary key,
  user_id uuid references public.profiles(id) on delete set null,
  source text not null default 'cast',
  created_at timestamptz not null default now()
);

alter table public.used_usernames enable row level security;

insert into public.used_usernames (username, user_id, source)
select lower(p.username), p.id, case when p.is_demo then 'cast' else 'user' end
from public.profiles p
where p.username is not null and length(trim(p.username)) > 0
on conflict (username) do nothing;

alter table public.judgments
  add column if not exists cast_recipe jsonb;

create index if not exists profiles_is_demo_idx on public.profiles (is_demo);
create index if not exists used_usernames_user_id_idx on public.used_usernames (user_id);
```

`used_usernames` keeps handles reserved after a house account is deleted so names don’t recycle.

Also mark leftover Auth house emails:

```sql
update public.profiles p
set is_demo = true
from auth.users u
where u.id = p.id
  and p.is_demo = false
  and (
    u.email ilike 'demo+%'
    or u.email ilike 'house+%'
    or coalesce(u.raw_user_meta_data->>'is_demo','') in ('true','t')
    or coalesce(u.raw_app_meta_data->>'is_demo','') in ('true','t')
  );
```
