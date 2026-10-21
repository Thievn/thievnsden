import { prefsFromRow, prefsToColumns, type PushPrefs, type StoredSubscription } from "./push";
import type { AlertRow, CheckRow, DeskMode, PositionRow, ReportRow, RunRow, Stage, TradeAction, TradeRow, Verdict } from "./types";

if (typeof window !== "undefined") {
  throw new Error("Desk reads stay on the server.");
}

export type DeskTables = {
  checks: CheckRow[];
  positions: PositionRow[];
  trades: TradeRow[];
  alerts: AlertRow[];
  reports: ReportRow[];
  runs: RunRow[];
};

const STAGES = new Set<Stage>(["limits", "facts", "pool", "grok", "budget"]);
const VERDICTS = new Set<Verdict>(["BUY", "SKIP"]);
const ACTIONS = new Set<TradeAction>(["open", "partial", "close"]);
const MODES = new Set<DeskMode>(["PAPER", "LIVE"]);

export function supabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

async function rest(path: string, init?: RequestInit): Promise<unknown> {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!base || !key) throw new Error("UNCONFIGURED");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`${base}/rest/v1/${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 240);
      const error = new Error(`BOOK_${response.status}`) as Error & { detail?: string };
      error.detail = detail;
      throw error;
    }
    if (response.status === 204) return null;
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function asRows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((row) => row && typeof row === "object") as Record<string, unknown>[] : [];
}

const SOLANA_TABLES = new Set([
  "desk_checks",
  "desk_positions",
  "desk_trades",
  "desk_alerts",
  "desk_runs",
]);

export function vaultReadPath(table: string, query: string): string {
  const scope = SOLANA_TABLES.has(table) ? "&desk_id=eq.solana" : "";
  return `${table}?${query}${scope}`;
}

export function deskColumnMissing(error: unknown): boolean {
  if (!(error instanceof Error) || error.message !== "BOOK_400") return false;
  const detail = "detail" in error ? String((error as { detail?: unknown }).detail ?? "") : "";
  return /desk_id/i.test(detail);
}

async function readVaultTable(table: string, query: string): Promise<unknown> {
  try {
    return await rest(vaultReadPath(table, query));
  } catch (error) {
    if (SOLANA_TABLES.has(table) && deskColumnMissing(error)) {
      console.error("vault desk_id skipped", table);
      return rest(`${table}?${query}`);
    }
    throw error;
  }
}

export async function serviceRest(path: string, init?: RequestInit): Promise<unknown> {
  return rest(path, init);
}

export function recordRows(value: unknown): Record<string, unknown>[] {
  return asRows(value);
}

export async function loadDesk(): Promise<DeskTables> {
  const [checks, positions, trades, alerts, reports, runs] = await Promise.all([
    readVaultTable("desk_checks", "select=id,time,mint,symbol,stage,verdict,confidence,reason&order=time.desc&limit=800"),
    readVaultTable("desk_positions", "select=mint,symbol,entry,qty0,qty,peak,liq0,opened,steps&order=opened.desc&limit=50"),
    readVaultTable("desk_trades", "select=id,time,mint,symbol,action,usd,pnl,reason&order=time.desc&limit=300"),
    readVaultTable("desk_alerts", "select=id,created_at,source,kind,mint,symbol,text,acknowledged&order=created_at.desc&limit=100"),
    readVaultTable("desk_reports", "select=day,mode,body,created_at&order=day.desc&limit=60"),
    readVaultTable("desk_runs", "select=id,ran_at,kind,status,counts,error&order=ran_at.desc&limit=40"),
  ]);

  return {
    checks: asRows(checks).flatMap((row) => {
      const stage = text(row.stage);
      const verdict = text(row.verdict);
      const id = text(row.id);
      const time = text(row.time);
      const mint = text(row.mint);
      if (!id || !time || !mint || !stage || !verdict || !STAGES.has(stage as Stage) || !VERDICTS.has(verdict as Verdict)) {
        return [];
      }
      return [{
        id,
        time,
        mint,
        symbol: text(row.symbol),
        stage: stage as Stage,
        verdict: verdict as Verdict,
        confidence: num(row.confidence),
        reason: text(row.reason),
      }];
    }),
    positions: asRows(positions).flatMap((row) => {
      const mint = text(row.mint);
      if (!mint) return [];
      return [{
        mint,
        symbol: text(row.symbol),
        entry: num(row.entry),
        qty0: num(row.qty0),
        qty: num(row.qty),
        peak: num(row.peak),
        liq0: num(row.liq0),
        opened: text(row.opened),
        steps: num(row.steps) ?? 0,
      }];
    }),
    trades: asRows(trades).flatMap((row) => {
      const action = text(row.action);
      const id = text(row.id);
      const time = text(row.time);
      const mint = text(row.mint);
      if (!id || !time || !mint || !action || !ACTIONS.has(action as TradeAction)) return [];
      return [{
        id,
        time,
        mint,
        symbol: text(row.symbol),
        action: action as TradeAction,
        usd: num(row.usd),
        pnl: num(row.pnl),
        reason: text(row.reason),
      }];
    }),
    alerts: asRows(alerts).flatMap((row) => {
      const id = text(row.id);
      const createdAt = text(row.created_at);
      const body = text(row.text);
      if (!id || !createdAt || !body) return [];
      return [{
        id,
        createdAt,
        source: text(row.source),
        kind: text(row.kind),
        mint: text(row.mint),
        symbol: text(row.symbol),
        text: body,
        acknowledged: row.acknowledged === true,
      }];
    }),
    reports: asRows(reports).flatMap((row) => {
      const day = text(row.day);
      const body = text(row.body);
      const createdAt = text(row.created_at);
      if (!day || !body || !createdAt) return [];
      const mode = text(row.mode);
      return [{
        day,
        mode: mode && MODES.has(mode as DeskMode) ? mode as DeskMode : null,
        body,
        createdAt,
      }];
    }),
    runs: asRows(runs).flatMap((row) => {
      const ranAt = text(row.ran_at);
      const kind = text(row.kind);
      const status = text(row.status);
      if (!ranAt || !kind || !status) return [];
      const counts: Record<string, number> | null = row.counts && typeof row.counts === "object"
        ? Object.fromEntries(
          Object.entries(row.counts as Record<string, unknown>)
            .map(([key, value]) => [key, num(value)] as const)
            .filter((entry): entry is [string, number] => entry[1] !== null),
        )
        : null;
      return [{
        id: String(row.id ?? ranAt),
        ranAt,
        kind,
        status,
        counts,
        error: text(row.error),
      }];
    }),
  };
}

export function deskIsEmpty(tables: DeskTables): boolean {
  return tables.checks.length + tables.positions.length + tables.trades.length
    + tables.alerts.length + tables.reports.length + tables.runs.length === 0;
}

export async function acknowledgeAlert(id: string): Promise<void> {
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(id) || id.startsWith("ex-")) throw new Error("BAD_ID");
  await rest(`desk_alerts?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ acknowledged: true }),
  });
}

export function publicDeskError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNCONFIGURED") return "Vault isn't connected.";
  if (message.startsWith("BOOK_")) return "Couldn't load the data.";
  return "Couldn't load the data.";
}

export function publicPushError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNCONFIGURED" || message === "BOOK_404") return "Alerts aren't saved yet.";
  return "Couldn't save that.";
}

function quoteFilter(value: string): string {
  return encodeURIComponent(value);
}

export async function loadPushState(endpoint: string | null): Promise<{ subscribed: boolean; prefs: PushPrefs }> {
  const fallback = { subscribed: false, prefs: prefsFromRow({}) };
  if (!supabaseConfigured()) return fallback;
  if (endpoint) {
    const mine = asRows(await rest(`push_subscriptions?select=*&endpoint=eq.${quoteFilter(endpoint)}&limit=1`));
    if (mine[0]) return { subscribed: true, prefs: prefsFromRow(mine[0]) };
  }
  const shared = asRows(await rest("push_subscriptions?select=*&order=updated_at.desc&limit=1"));
  if (!shared[0]) return fallback;
  const prefs = prefsFromRow(shared[0]);
  return { subscribed: false, prefs: { ...prefs, alertsOn: false } };
}

export async function savePushSubscription(subscription: StoredSubscription, prefs: PushPrefs): Promise<void> {
  await rest("push_subscriptions?on_conflict=endpoint", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
      ...prefsToColumns({ ...prefs, alertsOn: true }),
    }),
  });
}

export async function savePushPrefs(prefs: PushPrefs): Promise<boolean> {
  const existing = asRows(await rest("push_subscriptions?select=id&limit=1"));
  if (!existing[0]) return false;
  await rest("push_subscriptions?id=not.is.null", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(prefsToColumns(prefs)),
  });
  return true;
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  await rest(`push_subscriptions?endpoint=eq.${quoteFilter(endpoint)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}

export async function queuePushTest(): Promise<void> {
  await rest("push_outbox", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ event: "test", payload: {} }),
  });
}
