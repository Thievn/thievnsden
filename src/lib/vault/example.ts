import { buildDesk } from "./aggregate";
import { EXAMPLE_SOL_USD } from "./constants";
import { addCivilDays, nyDateTime, nyDay } from "./time";
import type { AlertRow, BalanceSample, CheckRow, DeskView, PositionRow, ReportRow, RunRow, Stage, TradeRow, Verdict } from "./types";

const MINTS = {
  wax: "BHhLhBvB2PusycxycgQVVsBuU73ZiBB5gdJsSCr12aPe",
  ember: "G5caahV1rDj23DEd227hS62EKQrs5pgmSfJuP4uXEh1u",
  hood: "BzRY1UTaJJH7Ez3FY3wdNhbMwm34miftUXWyhTXw9stb",
  cinder: "3oA1nHcwfJ49rAqU7L1MXXUZmvmTC6qvUAtoGD4RmKgn",
  ash: "2obNpkq3Tp5RFQ3D9z4wfHUSnSDU8S9DeAE38E9WLKPe",
  key: "2d3rYY1KkzwgJwWrq377YxLaA2GwVEA32gVx9NduuC1b",
} as const;

function check(
  id: string,
  time: string,
  symbol: string,
  mint: string,
  stage: Stage,
  verdict: Verdict,
  reason: string,
  confidence: number | null = null,
): CheckRow {
  return { id, time, mint, symbol, stage, verdict, confidence, reason };
}

export function exampleBalance(now = new Date()): BalanceSample[] {
  const points: BalanceSample[] = [];
  let usd = 186;
  for (let index = 27; index >= 0; index -= 1) {
    const wave = Math.sin(index / 3.2) * 14;
    usd = Math.max(62, usd + wave * 0.15 - (index < 6 ? 6.5 : 1.1));
    const day = addCivilDays(nyDay(now), -index);
    points.push({ t: nyDateTime(day, 16, 10), usd: Math.round(usd * 100) / 100 });
  }
  points[points.length - 1] = { t: now.toISOString(), usd: 78.4 };
  return points;
}

export function exampleDesk(now = new Date()): DeskView {
  const today = nyDay(now);
  const day = (offset: number, hour: number, minute = 15) => nyDateTime(addCivilDays(today, offset), hour, minute);
  const checks: CheckRow[] = [
    check("ex-c1", day(0, 9, 5), "WAX", MINTS.wax, "limits", "SKIP", "already_open"),
    check("ex-c2", day(0, 9, 6), "EMBER", MINTS.ember, "limits", "SKIP", "max_open"),
    check("ex-c3", day(0, 9, 12), "HOOD", MINTS.hood, "facts", "SKIP", "mint_open"),
    check("ex-c4", day(0, 9, 18), "CINDER", MINTS.cinder, "facts", "SKIP", "top10_heavy"),
    check("ex-c5", day(0, 9, 24), "ASH", MINTS.ash, "pool", "SKIP", "thin_pool"),
    check("ex-c6", day(0, 9, 31), "KEY", MINTS.key, "pool", "SKIP", "too_fresh"),
    check("ex-c7", day(0, 9, 40), "WAX", MINTS.wax, "grok", "BUY", "clean enough to paper", 0.74),
    check("ex-c8", day(0, 10, 2), "EMBER", MINTS.ember, "grok", "SKIP", "low confidence", 0.31),
    check("ex-c9", day(-1, 11, 5), "HOOD", MINTS.hood, "limits", "SKIP", "cooldown"),
    check("ex-c10", day(-1, 11, 11), "CINDER", MINTS.cinder, "facts", "SKIP", "lp_unlocked"),
    check("ex-c11", day(-1, 11, 20), "ASH", MINTS.ash, "facts", "SKIP", "danger:freeze"),
    check("ex-c12", day(-1, 12, 4), "KEY", MINTS.key, "pool", "SKIP", "ticket_too_big"),
    check("ex-c13", day(-1, 12, 18), "HOOD", MINTS.hood, "grok", "BUY", "second look held", 0.66),
    check("ex-c14", day(-1, 13, 2), "WAX", MINTS.wax, "grok", "SKIP", "grok failed"),
    check("ex-c15", day(-2, 10, 8), "EMBER", MINTS.ember, "limits", "SKIP", "halted_daily_loss"),
    check("ex-c16", day(-2, 10, 16), "ASH", MINTS.ash, "facts", "SKIP", "dev_holds"),
    check("ex-c17", day(-2, 10, 28), "CINDER", MINTS.cinder, "pool", "SKIP", "nobody_can_sell"),
    check("ex-c18", day(-2, 11, 4), "KEY", MINTS.key, "grok", "SKIP", "low confidence", 0.22),
    check("ex-c19", day(-3, 15, 10), "WAX", MINTS.wax, "limits", "SKIP", "max_entries_today"),
    check("ex-c20", day(-3, 15, 22), "HOOD", MINTS.hood, "facts", "SKIP", "already_rugged"),
    check("ex-c21", day(-3, 15, 40), "EMBER", MINTS.ember, "pool", "SKIP", "no_price"),
    check("ex-c22", day(-3, 16, 5), "ASH", MINTS.ash, "facts", "SKIP", "insiders"),
    check("ex-c23", day(-4, 9, 12), "CINDER", MINTS.cinder, "limits", "SKIP", "already_open"),
    check("ex-c24", day(-4, 9, 30), "KEY", MINTS.key, "facts", "SKIP", "no_report"),
    check("ex-c25", day(-4, 10, 8), "WAX", MINTS.wax, "pool", "SKIP", "too_old"),
    check("ex-c26", day(-4, 10, 40), "HOOD", MINTS.hood, "grok", "SKIP", "low confidence", 0.28),
    check("ex-c27", day(-5, 14, 12), "EMBER", MINTS.ember, "limits", "SKIP", "cooldown"),
    check("ex-c28", day(-5, 14, 30), "ASH", MINTS.ash, "pool", "SKIP", "thin_pool"),
    check("ex-c29", day(-5, 15, 5), "CINDER", MINTS.cinder, "grok", "BUY", "paper ticket", 0.71),
  ];

  const positions: PositionRow[] = [
    {
      mint: MINTS.wax,
      symbol: "WAX",
      entry: 0.00042,
      qty0: 59_400,
      qty: 59_400,
      peak: 0.00051,
      liq0: 84_200,
      opened: day(0, 9, 42),
      steps: 1,
    },
    {
      mint: MINTS.hood,
      symbol: "HOOD",
      entry: 0.000018,
      qty0: 1_380_000,
      qty: 690_000,
      peak: 0.000022,
      liq0: 41_500,
      opened: day(-1, 12, 20),
      steps: 2,
    },
  ];

  const trade = (
    id: string,
    time: string,
    symbol: string,
    mint: string,
    action: TradeRow["action"],
    usd: number,
    pnl: number,
    reason: string,
  ): TradeRow => ({ id, time, mint, symbol, action, usd, pnl, reason });

  const trades: TradeRow[] = [
    trade("ex-t1", day(0, 9, 42), "WAX", MINTS.wax, "open", 25, 0, "paper open"),
    trade("ex-t2", day(0, 14, 10), "HOOD", MINTS.hood, "partial", 12.5, 4.2, "step 2"),
    trade("ex-t3", day(-1, 12, 20), "HOOD", MINTS.hood, "open", 25, 0, "paper open"),
    trade("ex-t4", day(-1, 18, 5), "CINDER", MINTS.cinder, "close", 25, -6.4, "pool faded"),
    trade("ex-t5", day(-2, 11, 30), "ASH", MINTS.ash, "close", 25, 11.8, "target"),
    trade("ex-t6", day(-2, 16, 12), "KEY", MINTS.key, "close", 25, -3.1, "time stop"),
    trade("ex-t7", day(-3, 13, 4), "EMBER", MINTS.ember, "close", 25, 8.6, "target"),
    trade("ex-t8", day(-4, 15, 40), "WAX", MINTS.wax, "close", 25, -9.5, "stop"),
    trade("ex-t9", day(-5, 12, 15), "HOOD", MINTS.hood, "close", 25, 6.4, "target"),
    trade("ex-t10", day(-6, 17, 5), "CINDER", MINTS.cinder, "close", 25, 2.2, "flat exit"),
    trade("ex-t11", day(-8, 11, 45), "ASH", MINTS.ash, "close", 25, -4.8, "stop"),
    trade("ex-t12", day(-10, 16, 20), "KEY", MINTS.key, "close", 25, 7.1, "target"),
    trade("ex-t13", day(-12, 10, 10), "EMBER", MINTS.ember, "close", 25, 3.4, "target"),
  ];

  const alerts: AlertRow[] = [
    {
      id: "ex-approval",
      createdAt: day(0, 9, 41),
      source: "check",
      kind: "APPROVAL_NEEDED",
      mint: MINTS.wax,
      symbol: "WAX",
      text: "WAX cleared the filter. Still paper until you answer.",
      acknowledged: false,
    },
    {
      id: "ex-sell",
      createdAt: day(0, 13, 5),
      source: "watch",
      kind: "SELL_NOW",
      mint: MINTS.hood,
      symbol: "HOOD",
      text: "HOOD pool is thinning. The watch wants it sold.",
      acknowledged: false,
    },
    {
      id: "ex-buy",
      createdAt: day(0, 9, 43),
      source: "check",
      kind: "PAPER_BUY",
      mint: MINTS.wax,
      symbol: "WAX",
      text: "Paper buy filled for WAX.",
      acknowledged: true,
    },
    {
      id: "ex-feed",
      createdAt: day(-1, 8, 12),
      source: "watch",
      kind: "FEED_DOWN",
      mint: null,
      symbol: null,
      text: "The watch missed a cycle. It came back on the next run.",
      acknowledged: true,
    },
    {
      id: "ex-sold",
      createdAt: day(-1, 18, 6),
      source: "watch",
      kind: "PAPER_SOLD",
      mint: MINTS.cinder,
      symbol: "CINDER",
      text: "Paper sold CINDER.",
      acknowledged: true,
    },
  ];

  const reports: ReportRow[] = [0, -1, -2, -3].map((offset) => ({
    day: addCivilDays(today, offset),
    mode: "PAPER" as const,
    body:
      offset === 0
        ? "Paper day. One new name was bought on the page and one older name was trimmed. No coin moved."
        : "Paper day. The book took the tickets it was allowed and left the rest on the table.",
    createdAt: day(offset, 21, 5),
  }));

  const runs: RunRow[] = [
    { id: "ex-r1", ranAt: day(0, 14, 20), kind: "watch", status: "ok", counts: { open: 2, alerts: 1 }, error: null },
    { id: "ex-r2", ranAt: day(0, 9, 50), kind: "scan", status: "ok", counts: { checked: 8, bought: 1, alerts: 1 }, error: null },
    { id: "ex-r3", ranAt: day(-1, 21, 10), kind: "report", status: "ok", counts: { reports: 1 }, error: null },
    { id: "ex-r4", ranAt: day(-1, 8, 10), kind: "watch", status: "error", counts: null, error: "feed timeout" },
    { id: "ex-r5", ranAt: day(-1, 11, 40), kind: "scan", status: "ok", counts: { checked: 7, bought: 1 }, error: null },
    { id: "ex-r6", ranAt: day(-2, 11, 5), kind: "scan", status: "ok", counts: { checked: 6, bought: 0 }, error: null },
  ];

  return buildDesk({ checks, positions, trades, alerts, reports, runs, now });
}

export { EXAMPLE_SOL_USD };
