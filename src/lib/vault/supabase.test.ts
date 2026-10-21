import assert from "node:assert/strict";
import test from "node:test";
import { deskColumnMissing, vaultReadPath } from "./supabase.ts";

const SCOPED = ["desk_checks", "desk_positions", "desk_trades", "desk_alerts", "desk_runs"];

test("the vault scopes solana rows and leaves reports unfiltered", () => {
  const reports = vaultReadPath("desk_reports", "select=day,mode,body,created_at&order=day.desc&limit=60");
  assert.equal(reports.includes("desk_id"), false);
  assert.match(reports, /^desk_reports\?select=day/);
  for (const table of SCOPED) {
    const path = vaultReadPath(table, "select=id&order=time.desc");
    assert.match(path, new RegExp(`^${table}\\?select=id&order=time\\.desc&desk_id=eq\\.solana$`));
  }
});

test("a missing desk_id column is the only reason to retry a vault read", () => {
  const missing = new Error("BOOK_400") as Error & { detail?: string };
  missing.detail = '{"code":"42703","message":"column desk_reports.desk_id does not exist"}';
  assert.equal(deskColumnMissing(missing), true);
  const other = new Error("BOOK_400") as Error & { detail?: string };
  other.detail = '{"message":"column desk_runs.ran_at does not exist"}';
  assert.equal(deskColumnMissing(other), false);
  assert.equal(deskColumnMissing(new Error("BOOK_401")), false);
});
