import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

function preview(args: string[]) {
  const result = spawnSync("python3", ["desk/notify.py", "--preview", ...args], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout) as { title: string; body: string; url: string; event: string };
}

test("quiet hours wrap midnight and a test ignores them", () => {
  const result = spawnSync("python3", ["-c", `
import importlib.util
from datetime import datetime
from zoneinfo import ZoneInfo
spec = importlib.util.spec_from_file_location("notify", "desk/notify.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
ny = ZoneInfo("America/New_York")
late = datetime(2026, 1, 15, 23, 30, tzinfo=ny)
noon = datetime(2026, 1, 15, 12, 0, tzinfo=ny)
row = {"quiet_hours": True, "quiet_start": "22:00", "quiet_end": "07:00", "alerts_on": True, "events": {}}
assert mod.in_quiet(row, late)
assert not mod.in_quiet(row, noon)
assert not mod.in_quiet({**row, "quiet_hours": False}, late)
assert mod.wanted(row, "test", mod.argparse.Namespace(), late)
assert not mod.wanted(row, "paper_trade", mod.argparse.Namespace(), late)
low = {"alerts_on": True, "quiet_hours": False, "events": {"low_balance": True}, "low_balance_sol": 0.1}
assert mod.wanted(low, "low_balance", mod.argparse.Namespace(sol=0.04), noon)
assert not mod.wanted(low, "low_balance", mod.argparse.Namespace(sol=0.2), noon)
print("ok")
`], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /ok/);
});

test("notify.py builds one payload per desk event", () => {
  const cases: Array<[string[], string, string]> = [
    [["--event", "paper_trade", "--side", "open", "--symbol", "WAX", "--usd", "25"], "Paper buy, WAX. $25 in.", "/den?screen=trades"],
    [["--event", "paper_trade", "--side", "close", "--symbol", "HOOD", "--pnl", "-6.4"], "Closed HOOD. Down $6.40.", "/den?screen=trades"],
    [["--event", "stop_loss", "--symbol", "CINDER", "--pnl", "-9.5"], "Stop hit on CINDER. Down $9.50.", "/den?screen=trades"],
    [["--event", "take_profit", "--symbol", "ASH", "--pnl", "11.8"], "Target hit on ASH. Up $11.80.", "/den?screen=trades"],
    [["--event", "daily_loss", "--pnl", "-50"], "Daily loss stop. Down $50. Desk is paused.", "/den?screen=overview"],
    [["--event", "grok_budget"], "Grok budget is used up for today.", "/den?screen=checks"],
    [["--event", "xai_error"], "xAI hiccup. Check the runs.", "/den?screen=runs"],
    [["--event", "xai_error", "--detail", "account blocked"], "xAI account looks blocked.", "/den?screen=runs"],
    [["--event", "desk_stopped"], "Desk has been quiet for 45 minutes.", "/den?screen=runs"],
    [["--event", "nightly_report"], "Tonight's report is ready.", "/den?screen=reports"],
    [["--event", "approval_needed", "--symbol", "WAX"], "Approval needed for WAX.", "/den?screen=alerts"],
    [["--event", "low_balance", "--sol", "0.04"], "Wallet is low. 0.04 SOL left.", "/den?screen=wallet"],
    [["--event", "test"], "Test alert. You're all set.", "/den?screen=overview"],
  ];
  for (const [args, body, url] of cases) {
    const payload = preview(args);
    assert.equal(payload.title, "Den", args.join(" "));
    assert.equal(payload.body, body, args.join(" "));
    assert.equal(payload.url, url, args.join(" "));
  }
});
