import { PAIRS, type PairId } from "./ids";

export type DcaSettings = {
  enabled: boolean;
  interval_hours: number;
  take_profit_pct: number;
  max_buys_per_pair: number;
};

export type GridSettings = {
  enabled: boolean;
  width_pct: number;
  levels: number;
  max_lots_per_pair: number;
};

export type Settings = {
  enabled: boolean;
  starting_balance_usd: number;
  per_trade_usd: number;
  daily_loss_halt_usd: number;
  max_exposure_usd: number;
  pairs: PairId[];
  dca: DcaSettings;
  grid: GridSettings;
};

export const SETTING_DEFAULTS: Settings = {
  enabled: true,
  starting_balance_usd: 1000,
  per_trade_usd: 25,
  daily_loss_halt_usd: 50,
  max_exposure_usd: 100,
  pairs: ["SOL-USD", "BTC-USD", "ETH-USD"],
  dca: { enabled: false, interval_hours: 24, take_profit_pct: 2, max_buys_per_pair: 3 },
  grid: { enabled: false, width_pct: 10, levels: 8, max_lots_per_pair: 4 },
};

export type ClampResult =
  | { ok: true; settings: Settings; adjusted: boolean }
  | { ok: false; error: string };

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function readNum(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return Number.NaN;
}

function apply(value: unknown, min: number, max: number, digits: number): { value: number; adjusted: boolean } {
  const raw = readNum(value);
  if (!Number.isFinite(raw)) return { value: min, adjusted: true };
  let next = Math.min(max, Math.max(min, raw));
  next = roundTo(next, digits);
  if (next < min) next = min;
  if (next > max) next = max;
  return { value: next, adjusted: next !== raw };
}

function readPairs(value: unknown): { pairs: PairId[]; adjusted: boolean } {
  if (!Array.isArray(value)) return { pairs: [], adjusted: true };
  const found = new Set<PairId>();
  let dropped = false;
  for (const item of value) {
    const token = String(item).trim().toUpperCase();
    if ((PAIRS as readonly string[]).includes(token)) found.add(token as PairId);
    else dropped = true;
  }
  return { pairs: PAIRS.filter((pair) => found.has(pair)), adjusted: dropped };
}

export function clampSettings(input: unknown): ClampResult {
  if (!input || typeof input !== "object") return { ok: false, error: "Those settings didn't look right." };
  const body = input as Record<string, unknown>;
  const dca = body.dca;
  const grid = body.grid;
  if (typeof body.enabled !== "boolean") return { ok: false, error: "Those settings didn't look right." };
  if (!dca || typeof dca !== "object" || typeof (dca as { enabled?: unknown }).enabled !== "boolean") {
    return { ok: false, error: "Those settings didn't look right." };
  }
  if (!grid || typeof grid !== "object" || typeof (grid as { enabled?: unknown }).enabled !== "boolean") {
    return { ok: false, error: "Those settings didn't look right." };
  }
  const dcaBody = dca as Record<string, unknown>;
  const gridBody = grid as Record<string, unknown>;
  const starting = apply(body.starting_balance_usd, 10, 10_000, 2);
  let maxExposure = apply(body.max_exposure_usd, 1, 10_000, 2);
  if (maxExposure.value > starting.value) maxExposure = { value: starting.value, adjusted: true };
  let perTrade = apply(body.per_trade_usd, 1, 500, 2);
  if (perTrade.value > maxExposure.value) perTrade = { value: maxExposure.value, adjusted: true };
  const daily = apply(body.daily_loss_halt_usd, 1, 1_000, 2);
  const pairs = readPairs(body.pairs);
  const interval = apply(dcaBody.interval_hours, 1, 168, 0);
  const takeProfit = apply(dcaBody.take_profit_pct, 0.5, 100, 2);
  const maxBuys = apply(dcaBody.max_buys_per_pair, 1, 50, 0);
  const width = apply(gridBody.width_pct, 2, 50, 2);
  const levels = apply(gridBody.levels, 2, 40, 0);
  const lots = apply(gridBody.max_lots_per_pair, 1, 40, 0);
  const adjusted = [
    starting, maxExposure, perTrade, daily, pairs, interval, takeProfit, maxBuys, width, levels, lots,
  ].some((item) => item.adjusted);
  return {
    ok: true,
    adjusted,
    settings: {
      enabled: body.enabled,
      starting_balance_usd: starting.value,
      per_trade_usd: perTrade.value,
      daily_loss_halt_usd: daily.value,
      max_exposure_usd: maxExposure.value,
      pairs: pairs.pairs,
      dca: {
        enabled: dcaBody.enabled as boolean,
        interval_hours: interval.value,
        take_profit_pct: takeProfit.value,
        max_buys_per_pair: maxBuys.value,
      },
      grid: {
        enabled: gridBody.enabled as boolean,
        width_pct: width.value,
        levels: levels.value,
        max_lots_per_pair: lots.value,
      },
    },
  };
}
