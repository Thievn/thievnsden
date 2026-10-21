-- Desk push alerts. Service role only. Run this in the Supabase SQL editor.
-- The site does not apply it. RLS is forced and there are no policies.

create table if not exists public.push_subscriptions (
  id bigint generated always as identity primary key,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  alerts_on boolean not null default true,
  quiet_hours boolean not null default false,
  quiet_start time not null default '22:00',
  quiet_end time not null default '07:00',
  low_balance_sol numeric not null default 0.1,
  events jsonb not null default '{
    "paper_trade": true,
    "stop_loss": true,
    "take_profit": true,
    "daily_loss": true,
    "grok_budget": true,
    "xai_error": true,
    "desk_stopped": true,
    "nightly_report": true,
    "approval_needed": true,
    "low_balance": true
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_outbox (
  id bigint generated always as identity primary key,
  event text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists push_outbox_unsent_idx on public.push_outbox (created_at) where sent_at is null;

do $$ declare t text; begin
  foreach t in array array['push_subscriptions','push_outbox'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

grant usage, select on all sequences in schema public to service_role;
