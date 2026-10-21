export const PUSH_EVENTS = [
  "paper_trade",
  "stop_loss",
  "take_profit",
  "daily_loss",
  "grok_budget",
  "xai_error",
  "desk_stopped",
  "nightly_report",
  "approval_needed",
  "low_balance",
] as const;

export type PushEvent = (typeof PUSH_EVENTS)[number];

export type PushPrefs = {
  alertsOn: boolean;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
  lowBalanceSol: number;
  events: Record<PushEvent, boolean>;
};

export type StoredSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export const TEST_NOTICE = {
  title: "Den",
  body: "Test alert. You're all set.",
  url: "/den?screen=overview",
};

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function defaultPushPrefs(): PushPrefs {
  return {
    alertsOn: false,
    quietHours: false,
    quietStart: "22:00",
    quietEnd: "07:00",
    lowBalanceSol: 0.1,
    events: Object.fromEntries(PUSH_EVENTS.map((event) => [event, true])) as Record<PushEvent, boolean>,
  };
}

export function readVapidPublicKey(value = process.env.VAPID_PUBLIC_KEY): string | null {
  const key = value?.trim() ?? "";
  if (!/^[A-Za-z0-9_-]{80,200}$/.test(key)) return null;
  return key;
}

export function readSubscription(value: unknown): StoredSubscription | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const keys = record.keys;
  const keyRecord = keys && typeof keys === "object" ? keys as Record<string, unknown> : {};
  const endpoint = record.endpoint;
  const p256dh = keyRecord.p256dh;
  const auth = keyRecord.auth;
  if (typeof endpoint !== "string" || !/^https:\/\/\S{8,1800}$/.test(endpoint)) return null;
  if (typeof p256dh !== "string" || !/^[A-Za-z0-9_-]{16,200}$/.test(p256dh)) return null;
  if (typeof auth !== "string" || !/^[A-Za-z0-9_-]{8,200}$/.test(auth)) return null;
  return { endpoint, p256dh, auth };
}

export function readEndpoint(value: unknown): string | null {
  if (typeof value !== "string" || !/^https:\/\/\S{8,1800}$/.test(value)) return null;
  return value;
}

function clock(value: unknown, fallback: string): string {
  return typeof value === "string" && TIME.test(value) ? value : fallback;
}

export function readPushPrefs(value: unknown, base = defaultPushPrefs()): PushPrefs {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const incoming = record.events && typeof record.events === "object" ? record.events as Record<string, unknown> : {};
  const events = { ...base.events };
  for (const event of PUSH_EVENTS) {
    if (typeof incoming[event] === "boolean") events[event] = incoming[event];
  }
  const rawBalance = typeof record.lowBalanceSol === "number" ? record.lowBalanceSol : Number(record.lowBalanceSol);
  const lowBalanceSol = Number.isFinite(rawBalance) && rawBalance >= 0 && rawBalance <= 1000
    ? Math.round(rawBalance * 10000) / 10000
    : base.lowBalanceSol;
  return {
    alertsOn: typeof record.alertsOn === "boolean" ? record.alertsOn : base.alertsOn,
    quietHours: typeof record.quietHours === "boolean" ? record.quietHours : base.quietHours,
    quietStart: clock(record.quietStart, base.quietStart),
    quietEnd: clock(record.quietEnd, base.quietEnd),
    lowBalanceSol,
    events,
  };
}

export function prefsFromRow(row: Record<string, unknown>): PushPrefs {
  const start = typeof row.quiet_start === "string" ? row.quiet_start.slice(0, 5) : "22:00";
  const end = typeof row.quiet_end === "string" ? row.quiet_end.slice(0, 5) : "07:00";
  return readPushPrefs({
    alertsOn: row.alerts_on === true,
    quietHours: row.quiet_hours === true,
    quietStart: start,
    quietEnd: end,
    lowBalanceSol: row.low_balance_sol,
    events: row.events,
  });
}

export function prefsToColumns(prefs: PushPrefs): Record<string, unknown> {
  return {
    alerts_on: prefs.alertsOn,
    quiet_hours: prefs.quietHours,
    quiet_start: prefs.quietStart,
    quiet_end: prefs.quietEnd,
    low_balance_sol: prefs.lowBalanceSol,
    events: prefs.events,
    updated_at: new Date().toISOString(),
  };
}
