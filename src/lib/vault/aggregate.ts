import { DAILY_LOSS_HALT_USD, MAX_OPEN } from "./constants";
import { addCivilDays, nyDay } from "./time";
import type {
  AlertRow,
  CheckRow,
  DeskView,
  PositionRow,
  ReportRow,
  RunRow,
  Stage,
  TradeRow,
} from "./types";

const ALERT_RANK: Record<string, number> = {
  APPROVAL_NEEDED: 0,
  SELL_NOW: 1,
};

function cents(value: number): number {
  return Math.round(value * 100) / 100;
}

function byTimeDesc(left: { time: string }, right: { time: string }) {
  return right.time.localeCompare(left.time);
}

export function buildDesk(input: {
  checks: CheckRow[];
  positions: PositionRow[];
  trades: TradeRow[];
  alerts: AlertRow[];
  reports: ReportRow[];
  runs: RunRow[];
  now?: Date;
}): DeskView {
  const now = input.now ?? new Date();
  const today = nyDay(now);
  const checks = [...input.checks].sort(byTimeDesc);
  const trades = [...input.trades].sort(byTimeDesc);
  const positions = [...input.positions].sort((left, right) => (right.opened ?? "").localeCompare(left.opened ?? ""));
  const reports = [...input.reports].sort((left, right) => right.day.localeCompare(left.day));
  const runs = [...input.runs].sort((left, right) => right.ranAt.localeCompare(left.ranAt));
  const alerts = [...input.alerts].sort((left, right) => {
    if (left.acknowledged !== right.acknowledged) return left.acknowledged ? 1 : -1;
    const rank = (ALERT_RANK[left.kind ?? ""] ?? 5) - (ALERT_RANK[right.kind ?? ""] ?? 5);
    if (rank !== 0) return rank;
    return right.createdAt.localeCompare(left.createdAt);
  });

  const todayTrades = trades.filter((trade) => nyDay(trade.time) === today);
  const todayPnl = cents(todayTrades.reduce((sum, trade) => sum + (trade.pnl ?? 0), 0));
  const entriesToday = todayTrades.filter((trade) => trade.action === "open").length;
  const passed = (stages: Stage[]) => checks.filter((check) => stages.includes(check.stage)).length;
  const closes = trades.filter((trade) => trade.action === "close");
  const wins = closes.filter((trade) => (trade.pnl ?? 0) > 0).length;
  const losses = closes.filter((trade) => (trade.pnl ?? 0) < 0).length;
  const flat = closes.length - wins - losses;
  const decided = wins + losses;

  const ordered = [...trades].sort((left, right) => left.time.localeCompare(right.time) || left.id.localeCompare(right.id));
  let running = 0;
  const equity = ordered.map((trade) => {
    running = cents(running + (trade.pnl ?? 0));
    return { time: trade.time, usd: running };
  });

  const byDay = new Map<string, number>();
  for (const trade of trades) {
    const day = nyDay(trade.time);
    byDay.set(day, cents((byDay.get(day) ?? 0) + (trade.pnl ?? 0)));
  }
  const dailyPnl = [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const day = addCivilDays(today, -offset);
    dailyPnl.push({ day, usd: byDay.get(day) ?? 0 });
  }

  const last = runs[0] ?? null;
  return {
    overview: {
      mode: reports.find((report) => report.mode)?.mode ?? null,
      todayPnl,
      openCount: positions.length,
      entriesToday,
      dailyLossUsd: cents(Math.max(0, -todayPnl)),
      lastRun: last ? { ranAt: last.ranAt, kind: last.kind, status: last.status, error: last.error } : null,
    },
    alerts,
    positions,
    checks,
    funnel: {
      checked: checks.length,
      passedLimits: passed(["facts", "pool", "grok", "budget"]),
      passedFacts: passed(["pool", "grok", "budget"]),
      passedPool: passed(["grok", "budget"]),
      budget: passed(["budget"]),
      bought: checks.filter((check) => check.verdict === "BUY").length,
    },
    trades,
    equity,
    dailyPnl,
    winRate: {
      wins,
      losses,
      flat,
      rate: decided === 0 ? null : wins / decided,
    },
    reports,
    runs,
  };
}

export const DESK_LIMITS = {
  maxOpen: MAX_OPEN,
  haltUsd: DAILY_LOSS_HALT_USD,
};
