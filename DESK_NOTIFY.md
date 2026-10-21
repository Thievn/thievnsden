# Desk push alerts

The site stores the phone's push subscription and the on/off toggles. It does not send notifications. The box sends them with `desk/notify.py`, which uses the VAPID private key and the Supabase service role.

Run `supabase/push.sql` once in the Supabase SQL editor before the first send. That file adds `push_subscriptions` and `push_outbox`. RLS is forced, there are no policies, and only the service role can read or write. The site will not apply this SQL for you.

## Env on the box

Set these in the box environment. Do not commit them.

| Name | Purpose |
| --- | --- |
| `VAPID_PRIVATE_KEY` | Private key. Stays on the box. |
| `VAPID_PUBLIC_KEY` | Same pair as the key on Vercel. |
| `VAPID_SUBJECT` | `mailto:thievnsden@gmail.com`. The script uses this if the variable is unset. |
| `SUPABASE_URL` | Desk project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Reads subscriptions and deletes expired ones. |

Generate a key pair locally (print it, then put the values in env, do not commit the output):

```bash
npx --yes web-push generate-vapid-keys
```

On Vercel, set only `VAPID_PUBLIC_KEY` for preview (and production when you want alerts there). The private key does not go on Vercel.

Install the sender once on the box:

```bash
python3 -m pip install pywebpush
```

## What the script does

`desk/notify.py` loads every row in `push_subscriptions`. It skips a phone when alerts are off, when that event's toggle is off, or when quiet hours are on and the clock in America/New_York is inside the window (default 10pm–7am, and the window is off until someone turns it on). A test alert ignores quiet hours and the per-event toggles. It still requires the master alerts toggle.

`low_balance` is sent only when `--sol` is below that row's `low_balance_sol` (default 0.1).

A push that comes back 404 or 410 deletes that subscription.

Tapping the notification opens `/den?screen=...`, which lands on the matching Vault screen.

## Call it like this

From a checkout of this repo on the box, with the env vars exported:

```bash
python3 desk/notify.py --event paper_trade --side open --symbol WAX --usd 25
python3 desk/notify.py --event paper_trade --side close --symbol HOOD --pnl -6.4
python3 desk/notify.py --event stop_loss --symbol CINDER --pnl -9.5
python3 desk/notify.py --event take_profit --symbol ASH --pnl 11.8
python3 desk/notify.py --event daily_loss --pnl -50
python3 desk/notify.py --event grok_budget
python3 desk/notify.py --event xai_error
python3 desk/notify.py --event xai_error --detail "account blocked"
python3 desk/notify.py --event desk_stopped
python3 desk/notify.py --event nightly_report
python3 desk/notify.py --event approval_needed --symbol WAX
python3 desk/notify.py --event low_balance --sol 0.04
python3 desk/notify.py --event test
```

`--preview` prints the payload and does not send, and it does not need the env vars:

```bash
python3 desk/notify.py --preview --event paper_trade --side close --symbol HOOD --pnl -6.4
```

The Settings button "Send test notification" does not send from Vercel. It inserts `{ "event": "test", "payload": {} }` into `push_outbox`. Drain the queue on the box:

```bash
python3 desk/notify.py --drain
```

The desk-stopped alert has to fire even when the desk itself is down. Cron can do that, and it will not repeat the same silence alert inside six hours:

```bash
*/10 * * * * cd /path/to/thievnsden && python3 desk/notify.py --watch-silence
*/2 * * * * cd /path/to/thievnsden && python3 desk/notify.py --drain
```

`--watch-silence` looks at the newest `desk_runs.ran_at`. If that is missing, or older than 45 minutes, it sends `desk_stopped`.

## Payload

Each event posts this shape. The service worker shows `title` and `body`, and a tap opens `url`.

| Event | Screen | Example body |
| --- | --- | --- |
| `paper_trade` open | `trades` | Paper buy, WAX. $25 in. |
| `paper_trade` close | `trades` | Closed HOOD. Down $6.40. |
| `stop_loss` | `trades` | Stop hit on CINDER. Down $9.50. |
| `take_profit` | `trades` | Target hit on ASH. Up $11.80. |
| `daily_loss` | `overview` | Daily loss stop. Down $50. Desk is paused. |
| `grok_budget` | `checks` | Grok budget is used up for today. |
| `xai_error` | `runs` | xAI hiccup. Check the runs. |
| `xai_error` with "block" in `--detail` | `runs` | xAI account looks blocked. |
| `desk_stopped` | `runs` | Desk has been quiet for 45 minutes. |
| `nightly_report` | `reports` | Tonight's report is ready. |
| `approval_needed` | `alerts` | Approval needed for WAX. |
| `low_balance` | `wallet` | Wallet is low. 0.04 SOL left. |
| `test` | `overview` | Test alert. You're all set. |

Pass extra fields the same way the examples do: `--symbol`, `--side open|close`, `--pnl`, `--usd`, `--sol`, `--detail`.
