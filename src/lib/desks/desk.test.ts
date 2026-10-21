import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { clampSettings, SETTING_DEFAULTS } from "./clamp.ts";
import { exampleTables } from "./example.ts";
import { buildDesks, emptyTables, filterEquity, isFresh, FRESH_MS } from "./model.ts";
import { looksLikeSecret, walletProblem } from "./secrets.ts";
import { minimalSettingsRow, settingsToRow } from "./write.ts";

const base = {
  ...SETTING_DEFAULTS,
  dca: { ...SETTING_DEFAULTS.dca },
  grid: { ...SETTING_DEFAULTS.grid },
};

test("settings clamp to the allowed ranges", () => {
  const result = clampSettings({
    ...base,
    starting_balance_usd: 20_000,
    max_exposure_usd: 9_000,
    per_trade_usd: 500,
    daily_loss_halt_usd: 5_000,
    pairs: ["doge-usd", "btc-usd", "SOL-USD", "SOL-USD"],
    dca: { enabled: true, interval_hours: 200, take_profit_pct: 0.1, max_buys_per_pair: 80 },
    grid: { enabled: true, width_pct: 1, levels: 1, max_lots_per_pair: 90 },
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.adjusted, true);
  assert.equal(result.settings.starting_balance_usd, 10_000);
  assert.equal(result.settings.max_exposure_usd, 9_000);
  assert.equal(result.settings.per_trade_usd, 500);
  assert.equal(result.settings.daily_loss_halt_usd, 1_000);
  assert.deepEqual(result.settings.pairs, ["SOL-USD", "BTC-USD"]);
  assert.equal(result.settings.dca.interval_hours, 168);
  assert.equal(result.settings.dca.take_profit_pct, 0.5);
  assert.equal(result.settings.dca.max_buys_per_pair, 50);
  assert.equal(result.settings.grid.width_pct, 2);
  assert.equal(result.settings.grid.levels, 2);
  assert.equal(result.settings.grid.max_lots_per_pair, 40);
});

test("per trade cannot exceed exposure, and exposure cannot exceed the starting balance", () => {
  const result = clampSettings({
    ...base,
    starting_balance_usd: 5,
    max_exposure_usd: 9_000,
    per_trade_usd: 0,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.settings.starting_balance_usd, 10);
  assert.equal(result.settings.max_exposure_usd, 10);
  assert.equal(result.settings.per_trade_usd, 1);

  const tight = clampSettings({ ...base, starting_balance_usd: 1_000, max_exposure_usd: 40, per_trade_usd: 500 });
  assert.equal(tight.ok, true);
  if (!tight.ok) return;
  assert.equal(tight.settings.max_exposure_usd, 40);
  assert.equal(tight.settings.per_trade_usd, 40);
});

test("a settings write has to be an object with booleans", () => {
  assert.equal(clampSettings(null).ok, false);
  assert.equal(clampSettings({ ...base, enabled: "yes" }).ok, false);
});

test("pasted secrets are refused and public addresses are kept", () => {
  const words = "one two three four five six seven eight nine ten eleven twelve";
  assert.equal(looksLikeSecret(words), true);
  assert.equal(looksLikeSecret(`${words} alpha beta gamma delta echo foxtrot golf hotel india juliet kilo lima`), true);
  assert.equal(looksLikeSecret(words.split(" ").slice(0, 11).join(" ")), false);
  assert.equal(looksLikeSecret("a".repeat(64)), true);
  assert.equal(looksLikeSecret(`0x${"ab".repeat(32)}`), true);
  assert.equal(looksLikeSecret("a".repeat(63)), false);
  assert.equal(looksLikeSecret("z".repeat(65)), true);
  assert.equal(looksLikeSecret("z".repeat(64)), false);
  assert.equal(looksLikeSecret("0x1111111111111111111111111111111111111111"), false);
  assert.equal(looksLikeSecret("So11111111111111111111111111111111111111112"), false);
  assert.equal(looksLikeSecret("-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----"), true);
  const problem = walletProblem(words);
  assert.equal(problem?.clear, true);
  assert.match(problem?.message ?? "", /public address/);
  assert.equal(walletProblem("So11111111111111111111111111111111111111112"), null);
});

test("settings rows stay on paper and follow the live columns", () => {
  const cols = {
    columns: new Map<string, { type?: string }>([
      ["grid_width_pct", {}],
      ["mode", {}],
      ["enabled", {}],
      ["pairs", { type: "string" }],
    ]),
    required: new Set<string>(),
  };
  const row = settingsToRow(SETTING_DEFAULTS, cols);
  assert.equal(row.grid_width_pct, SETTING_DEFAULTS.grid.width_pct);
  assert.equal(row.width_pct, undefined);
  assert.equal(row.mode, "PAPER");
  assert.equal(row.paper, undefined);
  assert.equal(row.pairs, "SOL-USD,BTC-USD,ETH-USD");
  assert.equal(JSON.stringify(row).includes("LIVE"), false);
  const minimal = minimalSettingsRow(SETTING_DEFAULTS);
  assert.equal(minimal.paper, undefined);
  assert.equal(minimal.enabled, true);
});

test("a desk is fresh for 20 minutes and stale after that", () => {
  const now = Date.parse("2026-10-21T18:00:00Z");
  assert.equal(isFresh(new Date(now - FRESH_MS + 1_000).toISOString(), now), true);
  assert.equal(isFresh(new Date(now - FRESH_MS - 1_000).toISOString(), now), false);
  assert.equal(isFresh(null, now), false);
});

test("venue fills come from venue trades and solana fills come from desk trades", () => {
  const now = new Date("2026-10-21T18:00:00Z");
  const tables = emptyTables();
  const time = now.toISOString();
  tables.trades = [
    { desk_id: "solana", time, pair: "SOL-USD", side: "sell", pnl: 3 },
    { desk_id: "binanceus", time, pair: "BTC-USD", side: "sell", pnl: 9999 },
  ];
  tables.venueTrades = [
    { desk_id: "binanceus", time, pair: "ETH-USD", side: "sell", pnl: 2, fee_usd: 0.01, slippage_pct: 0.2, strategy: "grid" },
    { desk_id: "solana", time, pair: "SOL-USD", side: "sell", pnl: 50 },
  ];
  const { details } = buildDesks(tables, now);
  assert.equal(details.solana.todayPnl, 3);
  assert.equal(details.solana.trades.length, 1);
  assert.equal(details.binanceus.todayPnl, 2);
  assert.equal(details.binanceus.trades.length, 1);
  assert.equal(details.binanceus.trades[0].fee, 0.01);
  assert.equal(details.binanceus.trades[0].slippage, 0.2);
  assert.equal(details.binanceus.daily.some((bar) => bar.usd === 9999), false);
});

test("status aliases and the sample desks", () => {
  const now = new Date();
  const alias = emptyTables();
  alias.status = [{ desk: "Binance.US", state: "RUNNING", equity: "12.5", heartbeat_at: now.toISOString(), today_pnl: 1 }];
  const aliased = buildDesks(alias, now).cards[1];
  assert.equal(aliased.status, "running");
  assert.equal(aliased.equity, 12.5);
  assert.equal(aliased.fresh, true);
  assert.equal(aliased.todayPnl, 1);

  const sample = buildDesks(exampleTables(now), now);
  assert.deepEqual(sample.cards.map((card) => card.id), ["solana", "binanceus", "coinbase"]);
  assert.equal(sample.cards[0].status, "running");
  assert.equal(sample.cards[0].fresh, true);
  assert.equal(sample.cards[1].status, "paused");
  assert.equal(sample.cards[1].fresh, false);
  assert.equal(sample.cards[2].status, "error");
  assert.equal(sample.details.coinbase.settings.per_trade_usd, 80);
  assert.equal(sample.details.coinbase.using.per_trade_usd, 25);
  assert.equal(sample.details.solana.checks.length, 5);
  assert.equal(sample.details.coinbase.checks.length, 0);
  assert.ok(sample.details.solana.kills.some((slice) => slice.stage === "pool" && slice.count === 2));
  assert.equal(sample.details.coinbase.positions[0].grids.length, 8);
  assert.equal(sample.details.binanceus.positions[1].grids.length, 5);
  const week = filterEquity(sample.details.solana.equityCurve, "1D", now.getTime());
  assert.ok(week.length > 2);
  assert.ok(week.length < sample.details.solana.equityCurve.length);
});

test("the signed-in den links to the desks and the settings copy stays locked", () => {
  const dash = readFileSync(new URL("../../components/den/Dashboard.tsx", import.meta.url), "utf8");
  const settings = readFileSync(new URL("../../components/desks/DeskSettings.tsx", import.meta.url), "utf8");
  const home = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8");
  assert.match(dash, /href="\/desk"/);
  assert.doesNotMatch(home, /\/desk/);
  assert.match(settings, /Paper only\. Live trading is not built\./);
  assert.match(settings, /Coming later\./);
  assert.match(settings, /trade-only key/);
  assert.doesNotMatch(settings, /connect wallet/i);
});
