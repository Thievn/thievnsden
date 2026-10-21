import { explainReason, stageLabel } from "../vault/reasons";
import { nyDay, addCivilDays } from "../vault/time";
import { SETTING_DEFAULTS, type Settings } from "./clamp";
import { DESKS, DESK_IDS, PAIRS, type DeskId, type PairId } from "./ids";
import { pairHead } from "./logos";

export const FRESH_MS = 20 * 60 * 1000;

export type DeskSource = "live" | "example" | "empty";

export type Row = Record<string, unknown>;

export type DeskStatusName = "running" | "paused" | "halted" | "error";

export type RawTables = {
  status: Row[];
  equity: Row[];
  prices: Row[];
  settings: Row[];
  wallets: Row[];
  positions: Row[];
  trades: Row[];
  venueTrades: Row[];
  checks: Row[];
};

export type Mark = { symbol: string; iconUrl: string | null };

export type Point = { t: string; usd: number };

export type HubCard = {
  id: DeskId;
  name: string;
  venue: boolean;
  mark: string;
  iconUrl: string | null;
  status: DeskStatusName;
  updatedAt: string | null;
  fresh: boolean;
  equity: number;
  todayPnl: number;
  openCount: number;
  marks: Mark[];
  spark: Point[];
  waiting: boolean;
};

export type PositionView = {
  id: string;
  pair: string;
  symbol: string;
  iconUrl: string | null;
  qty: number | null;
  cost: number | null;
  price: number | null;
  entry: number | null;
  stop: number | null;
  target: number | null;
  pnl: number | null;
  prices: Point[];
  grids: number[];
};

export type TradeView = {
  id: string;
  time: string;
  pair: string;
  symbol: string;
  iconUrl: string | null;
  strategy: string;
  side: string;
  usd: number | null;
  fee: number | null;
  slippage: number | null;
  pnl: number | null;
  reason: string | null;
};

export type CheckView = {
  id: string;
  time: string;
  symbol: string;
  stage: string;
  stageLabel: string;
  reasonLabel: string;
};

export type KillSlice = { stage: string; label: string; count: number };

export type WalletView = { id: string; address: string; chain: string; label: string };

export type SettingsUsing = {
  enabled?: boolean;
  starting_balance_usd?: number;
  per_trade_usd?: number;
  daily_loss_halt_usd?: number;
  max_exposure_usd?: number;
  pairs?: PairId[];
  dca?: Partial<Settings["dca"]>;
  grid?: Partial<Settings["grid"]>;
};

export type DeskDetail = {
  id: DeskId;
  name: string;
  venue: boolean;
  mark: string;
  iconUrl: string | null;
  status: DeskStatusName;
  updatedAt: string | null;
  fresh: boolean;
  equity: number;
  cash: number;
  inMarket: number;
  todayPnl: number;
  exposure: number;
  maxExposure: number;
  openCount: number;
  equityCurve: Point[];
  daily: { day: string; usd: number }[];
  positions: PositionView[];
  trades: TradeView[];
  strategies: string[];
  sides: string[];
  checks: CheckView[];
  kills: KillSlice[];
  settings: Settings;
  settingsSaved: boolean;
  using: SettingsUsing;
  wallets: WalletView[];
  waiting: boolean;
};

const TIME_KEYS = ["time", "at", "ts", "t", "created_at", "updated_at", "recorded_at", "traded_at", "opened", "heartbeat_at", "as_of", "ran_at"];

export function emptyTables(): RawTables {
  return {
    status: [], equity: [], prices: [], settings: [], wallets: [],
    positions: [], trades: [], venueTrades: [], checks: [],
  };
}

export function isFresh(iso: string | null, now: number): boolean {
  if (!iso) return false;
  const stamp = new Date(iso).getTime();
  if (!Number.isFinite(stamp)) return false;
  const age = now - stamp;
  if (age < 0) return true;
  return age < FRESH_MS;
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickText(row: Row, keys: string[]): string | null {
  for (const key of keys) {
    const value = text(row[key]);
    if (value) return value;
  }
  return null;
}

function pickNum(row: Row, keys: string[]): number | null {
  for (const key of keys) {
    if (!(key in row) || row[key] == null || row[key] === "") continue;
    const value = num(row[key]);
    if (value != null) return value;
  }
  return null;
}

function pickTime(row: Row): string | null {
  return pickText(row, TIME_KEYS);
}

function asObj(value: unknown): Row | null {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Row;
  if (typeof value === "string" && value.startsWith("{")) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Row;
    } catch {
      return null;
    }
  }
  return null;
}

export function rowDesk(row: Row): DeskId | null {
  const raw = pickText(row, ["desk_id", "desk", "venue"]);
  if (!raw) return "solana";
  const token = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (token === "sol" || token === "solana") return "solana";
  if (token === "binance" || token === "binanceus") return "binanceus";
  if (token === "coinbase" || token === "cb") return "coinbase";
  return null;
}

function statusName(value: unknown): DeskStatusName {
  const token = text(value)?.toLowerCase() ?? "";
  if (token === "running" || token === "ok") return "running";
  if (token === "halted" || token === "halt" || token === "stopped") return "halted";
  if (token === "error" || token === "failed") return "error";
  if (token === "paused" || token === "pause") return "paused";
  return "paused";
}

function cents(value: number): number {
  return Math.round(value * 100) / 100;
}

function readPairs(value: unknown): PairId[] | null {
  const items = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : null;
  if (!items) return null;
  const found = new Set<PairId>();
  for (const item of items) {
    const token = String(item).trim().toUpperCase();
    if ((PAIRS as readonly string[]).includes(token)) found.add(token as PairId);
  }
  return PAIRS.filter((pair) => found.has(pair));
}

function overlayUsing(using: SettingsUsing, source: Row) {
  if ("enabled" in source && typeof source.enabled === "boolean") using.enabled = source.enabled;
  const starting = pickNum(source, ["starting_balance_usd", "starting_balance", "start_balance_usd"]);
  const perTrade = pickNum(source, ["per_trade_usd", "per_trade"]);
  const daily = pickNum(source, ["daily_loss_halt_usd", "daily_loss_halt"]);
  const maxExposure = pickNum(source, ["max_exposure_usd", "max_exposure"]);
  if (starting != null) using.starting_balance_usd = starting;
  if (perTrade != null) using.per_trade_usd = perTrade;
  if (daily != null) using.daily_loss_halt_usd = daily;
  if (maxExposure != null) using.max_exposure_usd = maxExposure;
  if ("pairs" in source) {
    const pairs = readPairs(source.pairs);
    if (pairs) using.pairs = pairs;
  }
  const dcaObj = asObj(source.dca);
  const dcaSource = dcaObj ?? source;
  const dca: Partial<Settings["dca"]> = { ...using.dca };
  if (dcaObj && typeof dcaObj.enabled === "boolean") dca.enabled = dcaObj.enabled;
  if (!dcaObj && typeof source.dca_enabled === "boolean") dca.enabled = source.dca_enabled;
  const interval = pickNum(dcaSource, ["interval_hours"]);
  const takeProfit = pickNum(dcaSource, ["take_profit_pct"]);
  const maxBuys = pickNum(dcaSource, ["max_buys_per_pair"]);
  if (interval != null) dca.interval_hours = interval;
  if (takeProfit != null) dca.take_profit_pct = takeProfit;
  if (maxBuys != null) dca.max_buys_per_pair = maxBuys;
  if (Object.keys(dca).length > 0) using.dca = dca;
  const gridObj = asObj(source.grid);
  const gridSource = gridObj ?? source;
  const grid: Partial<Settings["grid"]> = { ...using.grid };
  if (gridObj && typeof gridObj.enabled === "boolean") grid.enabled = gridObj.enabled;
  if (!gridObj && typeof source.grid_enabled === "boolean") grid.enabled = source.grid_enabled;
  const width = pickNum(gridSource, ["width_pct", "grid_width_pct"]);
  const levels = pickNum(gridSource, gridObj ? ["levels", "grid_levels"] : ["grid_levels", "levels"]);
  const lots = pickNum(gridSource, ["max_lots_per_pair", "grid_max_lots_per_pair"]);
  if (width != null) grid.width_pct = width;
  if (levels != null) grid.levels = levels;
  if (lots != null) grid.max_lots_per_pair = lots;
  if (Object.keys(grid).length > 0) using.grid = grid;
}

export function readUsing(row: Row | null): SettingsUsing {
  if (!row) return {};
  const using: SettingsUsing = {};
  for (const source of [asObj(row.settings), asObj(row.clamped), asObj(row.effective), row]) {
    if (source) overlayUsing(using, source);
  }
  return using;
}

export function readSettings(row: Row | null): Settings {
  const using = readUsing(row);
  return {
    enabled: using.enabled ?? SETTING_DEFAULTS.enabled,
    starting_balance_usd: using.starting_balance_usd ?? SETTING_DEFAULTS.starting_balance_usd,
    per_trade_usd: using.per_trade_usd ?? SETTING_DEFAULTS.per_trade_usd,
    daily_loss_halt_usd: using.daily_loss_halt_usd ?? SETTING_DEFAULTS.daily_loss_halt_usd,
    max_exposure_usd: using.max_exposure_usd ?? SETTING_DEFAULTS.max_exposure_usd,
    pairs: using.pairs ?? SETTING_DEFAULTS.pairs,
    dca: { ...SETTING_DEFAULTS.dca, ...using.dca },
    grid: { ...SETTING_DEFAULTS.grid, ...using.grid },
  };
}

export function gridPrices(entry: number, widthPct: number, levels: number): number[] {
  if (!Number.isFinite(entry) || levels < 2) return [];
  const half = widthPct / 100 / 2;
  const low = entry * (1 - half);
  const high = entry * (1 + half);
  const count = Math.min(levels, 40);
  const prices: number[] = [];
  for (let index = 0; index < count; index += 1) {
    prices.push(low + ((high - low) * index) / (count - 1));
  }
  return prices;
}

export function filterEquity(points: Point[], range: "1D" | "1W" | "All", now: number): Point[] {
  if (range === "All") return points;
  const windowMs = range === "1D" ? 86_400_000 : 7 * 86_400_000;
  return points.filter((point) => {
    const stamp = new Date(point.t).getTime();
    return Number.isFinite(stamp) && now - stamp <= windowMs && stamp - now < 60_000;
  });
}

function byTime<T extends { t?: string; time?: string }>(left: T, right: T): number {
  return (left.t ?? left.time ?? "").localeCompare(right.t ?? right.time ?? "");
}

function group(rows: Row[]): Record<DeskId, Row[]> {
  const buckets: Record<DeskId, Row[]> = { solana: [], binanceus: [], coinbase: [] };
  for (const row of rows) {
    const id = rowDesk(row);
    if (id) buckets[id].push(row);
  }
  return buckets;
}

function pointFrom(row: Row, valueKeys: string[]): Point | null {
  const t = pickTime(row);
  const usd = pickNum(row, valueKeys);
  if (!t || usd == null) return null;
  return { t, usd };
}

function readGrid(row: Row): number[] {
  const raw = row.grid_levels ?? row.grid_prices ?? row.grids;
  const list = Array.isArray(raw) ? raw : null;
  if (!list) return [];
  const prices: number[] = [];
  for (const item of list) {
    if (typeof item === "number" && Number.isFinite(item)) prices.push(item);
    else if (item && typeof item === "object") {
      const price = num((item as Row).price ?? (item as Row).usd);
      if (price != null) prices.push(price);
    }
  }
  return prices;
}

function tradeOf(row: Row, index: number): TradeView | null {
  const time = pickTime(row);
  const pair = pickText(row, ["pair", "symbol", "market", "mint"]);
  if (!time || !pair) return null;
  const side = pickText(row, ["side", "action"]) ?? "—";
  return {
    id: pickText(row, ["id"]) ?? `${time}-${index}`,
    time,
    pair,
    symbol: pairHead(pair),
    iconUrl: pickText(row, ["icon_url"]),
    strategy: pickText(row, ["strategy", "strat", "book"]) ?? "—",
    side,
    usd: pickNum(row, ["usd", "notional_usd", "quote_usd", "amount_usd"]),
    fee: pickNum(row, ["fee_usd", "fee"]),
    slippage: pickNum(row, ["slippage_pct", "slippage"]),
    pnl: pickNum(row, ["pnl_usd", "pnl", "realized_pnl"]),
    reason: pickText(row, ["reason"]),
  };
}

function todayPnl(trades: TradeView[], now: Date): number {
  const today = nyDay(now);
  return cents(trades.reduce((sum, trade) => sum + (nyDay(trade.time) === today ? trade.pnl ?? 0 : 0), 0));
}

function dailyBars(trades: TradeView[], now: Date): { day: string; usd: number }[] {
  const today = nyDay(now);
  const byDay = new Map<string, number>();
  for (const trade of trades) {
    const day = nyDay(trade.time);
    byDay.set(day, cents((byDay.get(day) ?? 0) + (trade.pnl ?? 0)));
  }
  const bars: { day: string; usd: number }[] = [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const day = addCivilDays(today, -offset);
    bars.push({ day, usd: byDay.get(day) ?? 0 });
  }
  return bars;
}

function newest(rows: Row[]): Row | null {
  if (rows.length === 0) return null;
  return [...rows].sort((left, right) => (pickTime(right) ?? "").localeCompare(pickTime(left) ?? ""))[0] ?? null;
}

type TaggedPrice = Point & { pair: string };

function taggedPrice(row: Row): TaggedPrice | null {
  const point = pointFrom(row, ["price", "price_usd", "usd", "close"]);
  const pair = pickText(row, ["pair", "symbol", "market"]);
  if (!point || !pair) return null;
  return { ...point, pair };
}

function sameMarket(left: string, right: string): boolean {
  if (left.toUpperCase().replace(/[/_]/g, "-") === right.toUpperCase().replace(/[/_]/g, "-")) return true;
  const a = pairHead(left);
  const b = pairHead(right);
  return a.length > 0 && a === b;
}

export function buildDesks(tables: RawTables, now: Date): { cards: HubCard[]; details: Record<DeskId, DeskDetail> } {
  const status = group(tables.status);
  const equity = group(tables.equity);
  const prices = group(tables.prices);
  const settings = group(tables.settings);
  const wallets = group(tables.wallets);
  const positions = group(tables.positions);
  const solanaTrades = group(tables.trades);
  const venueTrades = group(tables.venueTrades);
  const checks = group(tables.checks);
  const details = {} as Record<DeskId, DeskDetail>;

  for (const id of DESK_IDS) {
    const meta = DESKS[id];
    const state = newest(status[id]);
    const saved = newest(settings[id]);
    const using = readUsing(state);
    const stored = readSettings(saved);
    const equityCurve = equity[id]
      .map((row) => pointFrom(row, ["equity_usd", "equity", "usd", "nav_usd", "nav"]))
      .filter((point): point is Point => point !== null)
      .sort(byTime);
    const tagged = prices[id].map(taggedPrice).filter((point): point is TaggedPrice => point !== null).sort(byTime);
    const tradeRows = (id === "solana" ? solanaTrades[id] : venueTrades[id])
      .map(tradeOf)
      .filter((trade): trade is TradeView => trade !== null)
      .sort((left, right) => right.time.localeCompare(left.time) || left.id.localeCompare(right.id));
    const positionViews: PositionView[] = positions[id].flatMap((row, index) => {
      const pair = pickText(row, ["pair", "symbol", "market", "mint"]);
      if (!pair) return [];
      const series = tagged.filter((point) => sameMarket(point.pair, pair)).map(({ t, usd }) => ({ t, usd }));
      const entry = pickNum(row, ["entry", "entry_price", "avg_entry", "avg_price"]);
      const qty = pickNum(row, ["qty", "quantity", "size", "qty0"]);
      let cost = pickNum(row, ["cost_usd", "cost", "notional_usd", "notional"]);
      if (cost == null && entry != null && qty != null) cost = cents(entry * qty);
      const last = series.length > 0 ? series[series.length - 1].usd : null;
      let price = pickNum(row, ["price", "mark", "mark_price", "last"]);
      if (price == null) price = last;
      let pnl = pickNum(row, ["unrealized_usd", "unrealized", "upnl", "u_pnl"]);
      if (pnl == null && price != null && entry != null && qty != null) pnl = cents((price - entry) * qty);
      const explicitGrids = readGrid(row);
      const grids = explicitGrids.length > 0 || entry == null || !stored.grid.enabled
        ? explicitGrids
        : gridPrices(entry, stored.grid.width_pct, stored.grid.levels);
      return [{
        id: pickText(row, ["id", "mint"]) ?? `${pair}-${index}`,
        pair,
        symbol: pairHead(pair),
        iconUrl: pickText(row, ["icon_url"]),
        qty,
        cost,
        price,
        entry,
        stop: pickNum(row, ["stop", "stop_price", "stop_loss"]),
        target: pickNum(row, ["target", "target_price", "take_profit"]),
        pnl,
        prices: series.slice(-60),
        grids,
      }];
    });
    const statusEquity = state ? pickNum(state, ["equity_usd", "equity", "nav_usd", "nav"]) : null;
    const equityValue = statusEquity ?? (equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].usd : 0);
    const statusInMarket = state ? pickNum(state, ["in_market_usd", "in_market", "invested_usd", "invested"]) : null;
    const inMarket = statusInMarket ?? cents(positionViews.reduce((sum, position) => sum + (position.cost ?? 0), 0));
    const statusCash = state ? pickNum(state, ["cash_usd", "cash"]) : null;
    const cash = statusCash ?? cents(equityValue - inMarket);
    const statusToday = state ? pickNum(state, ["today_pnl_usd", "today_pnl", "pnl_today", "day_pnl_usd", "day_pnl"]) : null;
    const pnlToday = statusToday ?? todayPnl(tradeRows, now);
    const statusExposure = state ? pickNum(state, ["exposure_usd", "exposure", "gross_usd"]) : null;
    const exposure = statusExposure ?? inMarket;
    const maxExposure = (state ? pickNum(state, ["max_exposure_usd", "max_exposure"]) : null) ?? stored.max_exposure_usd;
    const updatedAt = state ? pickTime(state) : null;
    const fresh = isFresh(updatedAt, now.getTime());
    const iconUrl = (state ? pickText(state, ["icon_url"]) : null) ?? positionViews.find((position) => position.iconUrl)?.iconUrl ?? null;
    const openCount = state && pickNum(state, ["open_count", "positions_open"]) != null && positionViews.length === 0
      ? pickNum(state, ["open_count", "positions_open"]) ?? 0
      : positionViews.length;
    const strategies = [...new Set(tradeRows.map((trade) => trade.strategy).filter((value) => value && value !== "—"))];
    const sides = [...new Set(tradeRows.map((trade) => trade.side).filter((value) => value && value !== "—"))];
    const skipChecks = id === "solana"
      ? checks.solana.filter((row) => {
        const verdict = pickText(row, ["verdict"]);
        return !verdict || verdict.toUpperCase() === "SKIP";
      }).sort((left, right) => (pickTime(right) ?? "").localeCompare(pickTime(left) ?? ""))
      : [];
    const killMap = new Map<string, number>();
    for (const row of skipChecks) {
      const stage = pickText(row, ["stage"]) ?? "other";
      killMap.set(stage, (killMap.get(stage) ?? 0) + 1);
    }
    const checkViews: CheckView[] = skipChecks.slice(0, 10).flatMap((row, index) => {
      const time = pickTime(row);
      if (!time) return [];
      const stage = pickText(row, ["stage"]) ?? "other";
      const reason = pickText(row, ["reason"]);
      const verdict = pickText(row, ["verdict"]);
      return [{
        id: pickText(row, ["id"]) ?? `${time}-${index}`,
        time,
        symbol: pairHead(pickText(row, ["symbol", "pair", "mint"]) ?? ""),
        stage,
        stageLabel: stageLabel(stage),
        reasonLabel: explainReason(stage, verdict, reason).label,
      }];
    });
    const walletViews: WalletView[] = wallets[id].flatMap((row, index) => {
      const address = pickText(row, ["address", "pubkey", "public_address"]);
      if (!address) return [];
      return [{
        id: pickText(row, ["id"]) ?? `${address}-${index}`,
        address,
        chain: pickText(row, ["chain", "network"]) ?? "solana",
        label: pickText(row, ["label", "name"]) ?? "Watch",
      }];
    });
    details[id] = {
      id,
      name: meta.name,
      venue: meta.venue,
      mark: meta.mark,
      iconUrl,
      status: state ? statusName(pickText(state, ["status", "state"])) : "paused",
      updatedAt,
      fresh,
      equity: equityValue,
      cash,
      inMarket,
      todayPnl: pnlToday,
      exposure,
      maxExposure,
      openCount,
      equityCurve: equityCurve.slice(-400),
      daily: dailyBars(tradeRows, now),
      positions: positionViews,
      trades: tradeRows.slice(0, 300),
      strategies,
      sides,
      checks: checkViews,
      kills: [...killMap.entries()]
        .map(([stage, count]) => ({ stage, label: stageLabel(stage), count }))
        .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
      settings: stored,
      settingsSaved: saved !== null,
      using,
      wallets: walletViews,
      waiting: meta.venue && tradeRows.length === 0 && equityCurve.length === 0 && positionViews.length === 0,
    };
  }

  const cards: HubCard[] = DESK_IDS.map((id) => {
    const detail = details[id];
    return {
      id,
      name: detail.name,
      venue: detail.venue,
      mark: detail.mark,
      iconUrl: detail.iconUrl,
      status: detail.status,
      updatedAt: detail.updatedAt,
      fresh: detail.fresh,
      equity: detail.equity,
      todayPnl: detail.todayPnl,
      openCount: detail.openCount,
      marks: detail.positions.slice(0, 5).map((position) => ({ symbol: position.symbol, iconUrl: position.iconUrl })),
      spark: detail.equityCurve.slice(-36),
      waiting: detail.waiting,
    };
  });
  return { cards, details };
}
