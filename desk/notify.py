#!/usr/bin/env python3
"""Send desk push alerts from the box. Never run this on Vercel.

Reads subscriptions with the Supabase service role. The private VAPID key
stays in the environment. See DESK_NOTIFY.md.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

NY = ZoneInfo("America/New_York")
SUBJECT = "mailto:thievnsden@gmail.com"
SILENCE = timedelta(minutes=45)
DEDUPE = timedelta(hours=6)

SCREENS = {
    "paper_trade": "trades",
    "stop_loss": "trades",
    "take_profit": "trades",
    "daily_loss": "overview",
    "grok_budget": "checks",
    "xai_error": "runs",
    "desk_stopped": "runs",
    "nightly_report": "reports",
    "approval_needed": "alerts",
    "low_balance": "wallet",
    "test": "overview",
}


def usd(value: float) -> str:
    amount = abs(float(value))
    text = f"{amount:.0f}" if amount == int(amount) else f"{amount:.2f}"
    return f"{'Up' if value > 0 else 'Down'} ${text}"


def sol_text(value: float) -> str:
    return f"{float(value):.4f}".rstrip("0").rstrip(".") or "0"


def build(event: str, args: argparse.Namespace) -> dict:
    if event not in SCREENS:
        raise SystemExit(f"Unknown event {event}")
    symbol = (getattr(args, "symbol", None) or "").strip()
    name = symbol or "that one"
    if event == "paper_trade" and getattr(args, "side", "open") == "close":
        pnl = getattr(args, "pnl", None)
        body = f"Closed {name}. {usd(pnl if pnl is not None else 0)}."
    elif event == "paper_trade":
        amount = getattr(args, "usd", None)
        shown = 25 if amount is None else amount
        body = f"Paper buy, {name}. ${shown:.0f} in." if symbol else f"Paper buy. ${shown:.0f} in."
    elif event == "stop_loss":
        body = f"Stop hit on {name}. {usd(getattr(args, 'pnl', None) or 0)}."
    elif event == "take_profit":
        body = f"Target hit on {name}. {usd(getattr(args, 'pnl', None) or 0)}."
    elif event == "daily_loss":
        body = f"Daily loss stop. {usd(getattr(args, 'pnl', None) if getattr(args, 'pnl', None) is not None else -50)}. Desk is paused."
    elif event == "grok_budget":
        body = "Grok budget is used up for today."
    elif event == "xai_error":
        detail = (getattr(args, "detail", None) or "").lower()
        body = "xAI account looks blocked." if "block" in detail else "xAI hiccup. Check the runs."
    elif event == "desk_stopped":
        body = "Desk has been quiet for 45 minutes."
    elif event == "nightly_report":
        body = "Tonight's report is ready."
    elif event == "approval_needed":
        body = f"Approval needed for {symbol}." if symbol else "Approval needed."
    elif event == "low_balance":
        body = f"Wallet is low. {sol_text(getattr(args, 'sol', None) or 0)} SOL left."
    else:
        body = "Test alert. You're all set."
    return {"title": "Den", "body": body, "url": f"/den?screen={SCREENS[event]}", "event": event}


def parse_clock(value: str) -> int:
    hour, minute, *_ = (value or "00:00").split(":")
    return int(hour) * 60 + int(minute)


def in_quiet(row: dict, now: datetime | None = None) -> bool:
    if not row.get("quiet_hours"):
        return False
    current = now.astimezone(NY) if now else datetime.now(NY)
    start = parse_clock(str(row.get("quiet_start") or "22:00"))
    end = parse_clock(str(row.get("quiet_end") or "07:00"))
    minute = current.hour * 60 + current.minute
    if start <= end:
        return start <= minute < end
    return minute >= start or minute < end


def wanted(row: dict, event: str, args: argparse.Namespace, now: datetime | None = None) -> bool:
    if row.get("alerts_on") is False:
        return False
    if event == "test":
        return True
    events = row.get("events") or {}
    if events.get(event) is False:
        return False
    if in_quiet(row, now):
        return False
    if event == "low_balance":
        sol = getattr(args, "sol", None)
        try:
            threshold = float(row.get("low_balance_sol") if row.get("low_balance_sol") is not None else 0.1)
            balance = float(sol)
        except (TypeError, ValueError):
            return False
        return balance < threshold
    return True


def require(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise SystemExit(f"Missing {name}")
    return value


def rest(method: str, path: str, body: dict | None = None, prefer: str | None = None):
    base = require("SUPABASE_URL").rstrip("/")
    key = require("SUPABASE_SERVICE_ROLE_KEY")
    data = None if body is None else json.dumps(body).encode()
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    request = urllib.request.Request(f"{base}/rest/v1/{path}", data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            raw = response.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", "replace")[:240]
        raise SystemExit(f"Supabase {error.code}: {detail}") from None


def subscriptions() -> list[dict]:
    rows = rest("GET", "push_subscriptions?select=id,endpoint,p256dh,auth,alerts_on,quiet_hours,quiet_start,quiet_end,low_balance_sol,events")
    return rows if isinstance(rows, list) else []


def drop(row_id: int) -> None:
    rest("DELETE", f"push_subscriptions?id=eq.{int(row_id)}", prefer="return=minimal")


def deliver(message: dict, row: dict) -> str:
    try:
        from pywebpush import WebPushException, webpush
    except ImportError:
        raise SystemExit("Install pywebpush first: python3 -m pip install pywebpush") from None
    try:
        webpush(
            subscription_info={
                "endpoint": row["endpoint"],
                "keys": {"p256dh": row["p256dh"], "auth": row["auth"]},
            },
            data=json.dumps({key: message[key] for key in ("title", "body", "url")}),
            vapid_private_key=require("VAPID_PRIVATE_KEY"),
            vapid_claims={"sub": os.environ.get("VAPID_SUBJECT", "").strip() or SUBJECT},
            ttl=60,
        )
        return "sent"
    except WebPushException as error:
        status = getattr(getattr(error, "response", None), "status_code", None)
        if status in (404, 410):
            drop(row["id"])
            return "expired"
        print(f"push failed ({status or 'error'})", file=sys.stderr)
        return "failed"


def send(message: dict, args: argparse.Namespace) -> int:
    rows = [row for row in subscriptions() if wanted(row, message["event"], args)]
    if not rows:
        print("no alerts sent")
        return 0
    results = [deliver(message, row) for row in rows]
    print(f"sent {results.count('sent')}")
    return 1 if "failed" in results else 0


def namespace_from(payload: dict) -> argparse.Namespace:
    return argparse.Namespace(
        symbol=payload.get("symbol"),
        side=payload.get("side") or "open",
        pnl=payload.get("pnl"),
        usd=payload.get("usd"),
        sol=payload.get("sol"),
        detail=payload.get("detail"),
    )


def drain() -> int:
    rows = rest("GET", "push_outbox?sent_at=is.null&select=id,event,payload&order=created_at.asc&limit=50") or []
    failures = 0
    for row in rows:
        payload = row.get("payload") or {}
        args = namespace_from(payload if isinstance(payload, dict) else {})
        message = build(row["event"], args)
        if send(message, args) != 0:
            failures += 1
            continue
        rest(
            "PATCH",
            f"push_outbox?id=eq.{int(row['id'])}",
            {"sent_at": datetime.now(timezone.utc).isoformat()},
            prefer="return=minimal",
        )
    return 1 if failures else 0


def watch_silence() -> int:
    runs = rest("GET", "desk_runs?select=ran_at&order=ran_at.desc&limit=1") or []
    if runs:
        ran = datetime.fromisoformat(str(runs[0]["ran_at"]).replace("Z", "+00:00"))
        if datetime.now(timezone.utc) - ran < SILENCE:
            print("desk is running")
            return 0
    since = (datetime.now(timezone.utc) - DEDUPE).isoformat()
    recent = rest(
        "GET",
        "push_outbox?event=eq.desk_stopped&created_at=gte."
        + urllib.parse.quote(since)
        + "&select=id&limit=1",
    ) or []
    if recent:
        print("already sent")
        return 0
    message = build("desk_stopped", argparse.Namespace())
    status = send(message, argparse.Namespace())
    if status == 0:
        rest(
            "POST",
            "push_outbox",
            {"event": "desk_stopped", "payload": {}, "sent_at": datetime.now(timezone.utc).isoformat()},
            prefer="return=minimal",
        )
    return status


def parser() -> argparse.ArgumentParser:
    tool = argparse.ArgumentParser(description="Send a desk push alert.")
    tool.add_argument("--preview", action="store_true", help="Print the payload and exit.")
    tool.add_argument("--drain", action="store_true", help="Send queued push_outbox rows.")
    tool.add_argument("--watch-silence", action="store_true", help="Alert if desk_runs is quiet for 45 minutes.")
    tool.add_argument("--event", choices=sorted(SCREENS))
    tool.add_argument("--symbol", default="")
    tool.add_argument("--side", choices=("open", "close"), default="open")
    tool.add_argument("--pnl", type=float)
    tool.add_argument("--usd", type=float)
    tool.add_argument("--sol", type=float)
    tool.add_argument("--detail", default="")
    return tool


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    if args.preview:
        if not args.event:
            raise SystemExit("--preview needs --event")
        print(json.dumps(build(args.event, args), ensure_ascii=False))
        return 0
    if args.drain:
        return drain()
    if args.watch_silence:
        return watch_silence()
    if not args.event:
        raise SystemExit("Pass --event, --drain, or --watch-silence")
    return send(build(args.event, args), args)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except BrokenPipeError:
        raise SystemExit(0) from None
