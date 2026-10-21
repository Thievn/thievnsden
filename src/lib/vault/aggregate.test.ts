import assert from "node:assert/strict";
import test from "node:test";
import { buildDesk } from "./aggregate.ts";
import { exampleDesk } from "./example.ts";
import { previewFeatures, readMaxTransferSol, resolveCluster } from "./env.ts";
import { nyDateTime, nyDay } from "./time.ts";
import type { CheckRow, TradeRow } from "./types.ts";

const NOW = new Date("2026-01-15T15:00:00.000Z");

test("new york day changes at midnight eastern", () => {
  assert.equal(nyDay("2026-01-15T04:30:00.000Z"), "2026-01-14");
  assert.equal(nyDay("2026-01-15T05:30:00.000Z"), "2026-01-15");
  assert.equal(nyDay(nyDateTime("2026-03-10", 12, 30)), "2026-03-10");
});

test("today's result, entries, and the loss halt use new york", () => {
  const trades: TradeRow[] = [
    { id: "a", time: "2026-01-15T14:00:00.000Z", mint: "m", symbol: "WAX", action: "close", usd: 25, pnl: 12.5, reason: null },
    { id: "b", time: "2026-01-15T13:00:00.000Z", mint: "m", symbol: "WAX", action: "open", usd: 25, pnl: 0, reason: null },
    { id: "c", time: "2026-01-14T20:00:00.000Z", mint: "m", symbol: "ASH", action: "close", usd: 25, pnl: -40, reason: null },
  ];
  const view = buildDesk({ checks: [], positions: [], trades, alerts: [], reports: [], runs: [], now: NOW });
  assert.equal(view.overview.todayPnl, 12.5);
  assert.equal(view.overview.entriesToday, 1);
  assert.equal(view.overview.dailyLossUsd, 0);

  const losing = buildDesk({
    checks: [],
    positions: [],
    trades: [{ ...trades[0], pnl: -80 }],
    alerts: [],
    reports: [],
    runs: [],
    now: NOW,
  });
  assert.equal(losing.overview.dailyLossUsd, 80);
});

test("the funnel counts rows that reached each gate", () => {
  const row = (id: string, stage: CheckRow["stage"], verdict: CheckRow["verdict"]): CheckRow => ({
    id,
    time: "2026-01-15T14:00:00.000Z",
    mint: "m",
    symbol: "WAX",
    stage,
    verdict,
    confidence: null,
    reason: null,
  });
  const view = buildDesk({
    checks: [
      row("1", "limits", "SKIP"),
      row("2", "facts", "SKIP"),
      row("3", "pool", "SKIP"),
      row("4", "grok", "BUY"),
      row("5", "grok", "SKIP"),
      row("6", "budget", "SKIP"),
    ],
    positions: [],
    trades: [],
    alerts: [],
    reports: [],
    runs: [],
    now: NOW,
  });
  assert.deepEqual(view.funnel, {
    checked: 6,
    passedLimits: 5,
    passedFacts: 4,
    passedPool: 3,
    budget: 1,
    bought: 1,
  });
});

test("preview sample has a curve, a buy, and both urgent alerts", () => {
  const view = exampleDesk(NOW);
  assert.ok(view.overview.todayPnl !== 0);
  assert.ok(view.equity.length > 2);
  assert.equal(view.dailyPnl.length, 14);
  assert.equal(view.funnel.budget, 1);
  assert.ok(view.funnel.bought > 0);
  assert.ok(view.funnel.bought <= view.funnel.passedPool);
  assert.ok(view.alerts.some((alert) => alert.kind === "APPROVAL_NEEDED" && !alert.acknowledged));
  assert.ok(view.alerts.some((alert) => alert.kind === "SELL_NOW" && !alert.acknowledged));
  assert.equal(view.overview.mode, "PAPER");
  assert.equal(view.winRate.wins > 0, true);
});

test("cluster and transfer cap stay conservative", () => {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  assert.equal(previewFeatures(), false);
  if (previous === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = previous;
  assert.equal(resolveCluster("devnet", false), "mainnet-beta");
  assert.equal(resolveCluster("devnet", true), "devnet");
  assert.equal(resolveCluster("mainnet", true), "mainnet-beta");
  assert.equal(readMaxTransferSol(undefined), 2);
  assert.equal(readMaxTransferSol("nope"), 2);
  assert.equal(readMaxTransferSol("0"), 2);
  assert.equal(readMaxTransferSol("3.5"), 3.5);
});
