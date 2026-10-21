import { addCivilDays, nyDateTime, nyDay } from "../vault/time";
import type { Row, RawTables } from "./model";

function hoursAgo(now: Date, hours: number): string {
  return new Date(now.getTime() - hours * 3_600_000).toISOString();
}

function curve(deskId: string, now: Date, base: number, drift: number): Row[] {
  const rows: Row[] = [];
  for (let hour = 72; hour >= 0; hour -= 1) {
    const wave = Math.sin(hour / 5) * base * 0.01;
    rows.push({
      desk_id: deskId,
      time: hoursAgo(now, hour),
      equity_usd: Math.round((base + (72 - hour) * drift + wave) * 100) / 100,
    });
  }
  return rows;
}

function prices(deskId: string, pair: string, now: Date, start: number, end: number): Row[] {
  const rows: Row[] = [];
  for (let hour = 36; hour >= 0; hour -= 1) {
    const progress = (36 - hour) / 36;
    rows.push({
      desk_id: deskId,
      pair,
      time: hoursAgo(now, hour),
      price: Math.round((start + (end - start) * progress + Math.sin(hour) * start * 0.004) * 100) / 100,
    });
  }
  return rows;
}

export function exampleTables(now: Date): RawTables {
  const today = nyDay(now);
  const yesterday = addCivilDays(today, -1);
  const older = addCivilDays(today, -3);
  const solanaTrades: Row[] = [
    { id: "s1", desk_id: "solana", time: nyDateTime(today, 11), pair: "SOL-USD", symbol: "SOL", side: "sell", strategy: "breakout", usd: 148, fee_usd: 0.12, slippage_pct: 0.08, pnl: 18.4, reason: "Target hit" },
    { id: "s2", desk_id: "solana", time: nyDateTime(today, 9), pair: "SOL-USD", symbol: "SOL", side: "buy", strategy: "breakout", usd: 140, fee_usd: 0.1, slippage_pct: 0.11, pnl: 0, reason: "Opened" },
    { id: "s3", desk_id: "solana", time: nyDateTime(yesterday, 14), pair: "SOL-USD", symbol: "SOL", side: "sell", strategy: "grid", usd: 136, fee_usd: 0.09, slippage_pct: 0.2, pnl: -6.2, reason: "Stop" },
    { id: "s4", desk_id: "solana", time: nyDateTime(older, 12), pair: "SOL-USD", symbol: "SOL", side: "sell", strategy: "dca", usd: 130, fee_usd: 0.08, slippage_pct: 0.05, pnl: 9.5, reason: "Take profit" },
  ];
  const venueTrades: Row[] = [
    { id: "b1", desk_id: "binanceus", time: nyDateTime(today, 10), pair: "BTC-USD", side: "sell", strategy: "grid", usd: 420, fee_usd: 0.08, slippage_pct: 0.01, pnl: -4.2, reason: "Grid sell" },
    { id: "b2", desk_id: "binanceus", time: nyDateTime(today, 8), pair: "ETH-USD", side: "buy", strategy: "dca", usd: 80, fee_usd: 0.02, slippage_pct: 0.02, pnl: -8.2, reason: "DCA buy" },
    { id: "b3", desk_id: "binanceus", time: nyDateTime(yesterday, 15), pair: "ETH-USD", side: "sell", strategy: "dca", usd: 90, fee_usd: 0.02, slippage_pct: 0.03, pnl: 6.4, reason: "Take profit" },
    { id: "c1", desk_id: "coinbase", time: nyDateTime(today, 13), pair: "ETH-USD", side: "sell", strategy: "grid", usd: 210, fee_usd: 2.52, slippage_pct: 0.04, pnl: 4.1, reason: "Grid sell" },
    { id: "c2", desk_id: "coinbase", time: nyDateTime(older, 11), pair: "SOL-USD", side: "buy", strategy: "dca", usd: 70, fee_usd: 0.84, slippage_pct: 0.06, pnl: -1.5, reason: "DCA buy" },
  ];
  const sum = (rows: Row[], desk: string) => rows
    .filter((row) => row.desk_id === desk && nyDay(String(row.time)) === today)
    .reduce((total, row) => total + Number(row.pnl ?? 0), 0);

  return {
    status: [
      {
        desk_id: "solana", status: "running", updated_at: now.toISOString(),
        equity_usd: 10428.55, cash_usd: 8208.55, in_market_usd: 2220, today_pnl_usd: Math.round(sum(solanaTrades, "solana") * 100) / 100,
        exposure_usd: 2220, max_exposure_usd: 4000, icon_url: null,
        per_trade_usd: 25,
      },
      {
        desk_id: "binanceus", status: "paused", updated_at: hoursAgo(now, 3),
        equity_usd: 2510.2, cash_usd: 1610.2, in_market_usd: 900, today_pnl_usd: Math.round(sum(venueTrades, "binanceus") * 100) / 100,
        exposure_usd: 900, max_exposure_usd: 1500,
        per_trade_usd: 40,
      },
      {
        desk_id: "coinbase", status: "error", updated_at: now.toISOString(),
        equity_usd: 1804.1, cash_usd: 1204.1, in_market_usd: 600, today_pnl_usd: Math.round(sum(venueTrades, "coinbase") * 100) / 100,
        exposure_usd: 600, max_exposure_usd: 1000,
        per_trade_usd: 25,
      },
    ],
    equity: [
      ...curve("solana", now, 10040, 5),
      ...curve("binanceus", now, 2480, 0.4),
      ...curve("coinbase", now, 1760, 0.6),
    ],
    prices: [
      ...prices("solana", "SOL-USD", now, 132, 148),
      ...prices("binanceus", "BTC-USD", now, 61200, 63400),
      ...prices("binanceus", "ETH-USD", now, 3120, 3280),
      ...prices("coinbase", "ETH-USD", now, 3140, 3295),
    ],
    settings: [
      {
        desk_id: "solana", enabled: true, starting_balance_usd: 10000, per_trade_usd: 25,
        daily_loss_halt_usd: 50, max_exposure_usd: 4000, pairs: ["SOL-USD"],
        dca_enabled: false, interval_hours: 24, take_profit_pct: 3, max_buys_per_pair: 2,
        grid_enabled: false, width_pct: 8, levels: 6, max_lots_per_pair: 4,
      },
      {
        desk_id: "binanceus", enabled: true, starting_balance_usd: 2500, per_trade_usd: 40,
        daily_loss_halt_usd: 80, max_exposure_usd: 1500, pairs: ["BTC-USD", "ETH-USD"],
        dca_enabled: true, interval_hours: 12, take_profit_pct: 1.5, max_buys_per_pair: 4,
        grid_enabled: true, width_pct: 8, levels: 6, max_lots_per_pair: 4,
      },
      {
        desk_id: "coinbase", enabled: false, starting_balance_usd: 1800, per_trade_usd: 80,
        daily_loss_halt_usd: 60, max_exposure_usd: 1000, pairs: ["ETH-USD", "SOL-USD"],
        dca_enabled: false, interval_hours: 24, take_profit_pct: 2, max_buys_per_pair: 3,
        grid_enabled: true, width_pct: 10, levels: 8, max_lots_per_pair: 5,
      },
    ],
    wallets: [
      { id: "w1", desk_id: "solana", address: "So11111111111111111111111111111111111111112", chain: "solana", label: "Cold watch" },
      { id: "w2", desk_id: "binanceus", address: "0x1111111111111111111111111111111111111111", chain: "ethereum", label: "Fee wallet" },
    ],
    positions: [
      { id: "p1", desk_id: "solana", pair: "SOL-USD", symbol: "SOL", qty: 15, entry: 140, stop: 130, target: 168, cost_usd: 2100 },
      { id: "p2", desk_id: "binanceus", pair: "BTC-USD", symbol: "BTC", qty: 0.008, entry: 62000, stop: 59000, target: 68000, cost_usd: 496 },
      { id: "p3", desk_id: "binanceus", pair: "ETH-USD", symbol: "ETH", qty: 0.12, entry: 3200, stop: 3000, target: 3600, cost_usd: 384, grid_levels: [3040, 3120, 3200, 3280, 3360] },
      { id: "p4", desk_id: "coinbase", pair: "ETH-USD", symbol: "ETH", qty: 0.18, entry: 3180, stop: 3000, target: 3500, cost_usd: 572.4 },
    ],
    trades: [
      ...solanaTrades,
      { id: "ignore-me", desk_id: "binanceus", time: nyDateTime(today, 12), pair: "BTC-USD", symbol: "BTC", action: "close", usd: 1, pnl: 9999, reason: "Not a venue fill" },
    ],
    venueTrades,
    checks: [
      { id: "k1", desk_id: "solana", time: hoursAgo(now, 1), symbol: "MOON", stage: "pool", verdict: "SKIP", reason: "thin_pool" },
      { id: "k2", desk_id: "solana", time: hoursAgo(now, 2), symbol: "RUG", stage: "facts", verdict: "SKIP", reason: "already_rugged" },
      { id: "k3", desk_id: "solana", time: hoursAgo(now, 3), symbol: "NEW", stage: "limits", verdict: "SKIP", reason: "too_fresh" },
      { id: "k4", desk_id: "solana", time: hoursAgo(now, 4), symbol: "LATE", stage: "budget", verdict: "SKIP", reason: "daily grok budget reached" },
      { id: "k5", desk_id: "solana", time: hoursAgo(now, 5), symbol: "WIDE", stage: "pool", verdict: "SKIP", reason: "thin_pool" },
      { id: "k6", desk_id: "coinbase", time: hoursAgo(now, 1), symbol: "ETH", stage: "pool", verdict: "SKIP", reason: "thin_pool" },
    ],
  };
}
