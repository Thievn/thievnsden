import { previewFeatures } from "../vault/env";
import { recordRows, serviceRest, supabaseConfigured } from "../vault/supabase";
import { clampSettings } from "./clamp";
import { exampleTables } from "./example";
import { isChain, isDeskId, type DeskId } from "./ids";
import {
  buildDesks,
  emptyTables,
  type DeskDetail,
  type DeskSource,
  type HubCard,
  type RawTables,
  type Row,
  type WalletView,
} from "./model";
import { walletProblem } from "./secrets";
import { minimalSettingsRow, settingsToRow, type ColumnInfo } from "./write";

if (typeof window !== "undefined") {
  throw new Error("Desk reads stay on the server.");
}

export type DeskBundle = {
  source: DeskSource;
  error: string | null;
  cards: HubCard[];
  details: Record<DeskId, DeskDetail>;
};

export type DeskResult = { status: number; body: Record<string, unknown> };

const TABLES: { key: keyof RawTables; table: string; limit: number }[] = [
  { key: "status", table: "desk_status", limit: 20 },
  { key: "equity", table: "desk_equity", limit: 1200 },
  { key: "prices", table: "desk_prices", limit: 2000 },
  { key: "settings", table: "desk_settings", limit: 20 },
  { key: "wallets", table: "desk_wallets", limit: 80 },
  { key: "positions", table: "desk_positions", limit: 80 },
  { key: "trades", table: "desk_trades", limit: 400 },
  { key: "venueTrades", table: "desk_venue_trades", limit: 400 },
  { key: "checks", table: "desk_checks", limit: 500 },
];

const ORDER_KEYS = ["time", "at", "ts", "created_at", "updated_at", "recorded_at", "opened", "ran_at"];

let schemaCache: Map<string, ColumnInfo> | null = null;

type OpenApi = {
  definitions?: Record<string, { properties?: Record<string, { type?: string; format?: string }>; required?: string[] }>;
  components?: { schemas?: OpenApi["definitions"] };
};

async function warmSchema(): Promise<Map<string, ColumnInfo>> {
  if (schemaCache) return schemaCache;
  const next = new Map<string, ColumnInfo>();
  try {
    const spec = await serviceRest("", { headers: { Accept: "application/openapi+json" } }) as OpenApi;
    const defs = spec.definitions ?? spec.components?.schemas ?? {};
    for (const [name, def] of Object.entries(defs)) {
      const columns = new Map<string, { type?: string }>();
      for (const [column, meta] of Object.entries(def.properties ?? {})) {
        columns.set(column, { type: meta.format || meta.type });
      }
      next.set(name, { columns, required: new Set(def.required ?? []) });
    }
    schemaCache = next;
  } catch (error) {
    console.error("desk schema", error instanceof Error ? error.message : "error");
  }
  return schemaCache ?? next;
}

function orderQuery(info: ColumnInfo | undefined): string {
  const column = ORDER_KEYS.find((name) => info?.columns.has(name));
  return column ? `&order=${column}.desc` : "";
}

async function readTable(table: string, limit: number, info: ColumnInfo | undefined): Promise<Row[]> {
  const order = orderQuery(info);
  try {
    return recordRows(await serviceRest(`${table}?select=*&limit=${limit}${order}`));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "BOOK_404" || message === "BOOK_406") return [];
    if (order && message.startsWith("BOOK_400")) {
      return recordRows(await serviceRest(`${table}?select=*&limit=${limit}`));
    }
    throw error;
  }
}

async function readAll(): Promise<RawTables> {
  const schema = await warmSchema();
  const lists = await Promise.all(TABLES.map((item) => readTable(item.table, item.limit, schema.get(item.table))));
  const tables = emptyTables();
  TABLES.forEach((item, index) => {
    tables[item.key] = lists[index] ?? [];
  });
  return tables;
}

function isEmpty(tables: RawTables): boolean {
  return TABLES.every((item) => tables[item.key].length === 0);
}

export async function loadDesks(): Promise<DeskBundle> {
  const now = new Date();
  if (!supabaseConfigured()) {
    if (previewFeatures()) return { source: "example", error: null, ...buildDesks(exampleTables(now), now) };
    return { source: "empty", error: "Vault isn't connected.", ...buildDesks(emptyTables(), now) };
  }
  try {
    const tables = await readAll();
    if (isEmpty(tables) && previewFeatures()) {
      return { source: "example", error: null, ...buildDesks(exampleTables(now), now) };
    }
    return {
      source: isEmpty(tables) ? "empty" : "live",
      error: null,
      ...buildDesks(tables, now),
    };
  } catch (error) {
    console.error("desk load", error instanceof Error ? error.message : "error");
    return { source: "empty", error: "Couldn't load the data.", ...buildDesks(emptyTables(), now) };
  }
}

function deskIdOf(value: unknown): DeskId | null {
  return typeof value === "string" && isDeskId(value) ? value : null;
}

async function writeRow(table: string, deskId: string, row: Record<string, unknown>): Promise<void> {
  const payload = { ...row, desk_id: deskId };
  const headers = { "Content-Type": "application/json", Prefer: "return=representation" };
  try {
    const patched = recordRows(await serviceRest(`${table}?desk_id=eq.${encodeURIComponent(deskId)}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    }));
    if (patched.length > 0) return;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.startsWith("BOOK_400") && message !== "BOOK_404") throw error;
  }
  try {
    await serviceRest(table, {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(payload),
    });
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.startsWith("BOOK_409") && !message.startsWith("BOOK_400")) throw error;
  }
  await serviceRest(`${table}?on_conflict=desk_id`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(payload),
  });
}

function walletsOf(bundle: DeskBundle, deskId: DeskId): WalletView[] {
  return bundle.details[deskId].wallets;
}

export async function saveDeskSettings(deskIdRaw: unknown, input: unknown): Promise<DeskResult> {
  const deskId = deskIdOf(deskIdRaw);
  if (!deskId) return { status: 404, body: { ok: false, error: "That desk isn't here." } };
  if (deskId === "solana") return { status: 403, body: { ok: false, error: "Solana settings are read-only." } };
  const clamped = clampSettings(input);
  if (!clamped.ok) return { status: 400, body: { ok: false, error: clamped.error } };
  if (!supabaseConfigured()) {
    return {
      status: 200,
      body: {
        ok: true,
        wrote: false,
        adjusted: clamped.adjusted,
        settings: clamped.settings,
        using: null,
        notice: clamped.adjusted
          ? "Those values were pulled into range. Vault isn't connected, so nothing was saved."
          : "Vault isn't connected, so nothing was saved.",
      },
    };
  }
  try {
    const schema = await warmSchema();
    const cols = schema.get("desk_settings") ?? null;
    try {
      await writeRow("desk_settings", deskId, settingsToRow(clamped.settings, cols));
    } catch (error) {
      if (cols) throw error;
      await writeRow("desk_settings", deskId, minimalSettingsRow(clamped.settings));
    }
    const bundle = await loadDesks();
    const detail = bundle.details[deskId];
    return {
      status: 200,
      body: {
        ok: true,
        wrote: true,
        adjusted: clamped.adjusted,
        settings: detail.settings,
        using: detail.using,
        notice: clamped.adjusted ? "Those values were pulled into range." : "Saved.",
      },
    };
  } catch (error) {
    console.error("desk settings", error instanceof Error ? error.message : "error");
    return { status: 502, body: { ok: false, error: "Couldn't save that." } };
  }
}

function cleanLabel(value: unknown): string {
  const label = typeof value === "string" ? value.replace(/[\u0000-\u001f]/g, "").trim() : "";
  return (label || "Watch").slice(0, 40);
}

export async function saveDeskWallet(body: Record<string, unknown>): Promise<DeskResult> {
  const deskId = deskIdOf(body.deskId);
  if (!deskId) return { status: 404, body: { ok: false, error: "That desk isn't here." } };
  const address = typeof body.address === "string" ? body.address.trim() : "";
  const problem = walletProblem(address);
  if (problem) return { status: 400, body: { ok: false, error: problem.message, clear: problem.clear } };
  const chain = typeof body.chain === "string" ? body.chain : "";
  if (!isChain(chain)) return { status: 400, body: { ok: false, error: "Pick a chain." } };
  if (!supabaseConfigured()) {
    return { status: 200, body: { ok: true, wrote: false, notice: "Vault isn't connected, so nothing was saved.", wallets: null } };
  }
  try {
    const schema = await warmSchema();
    const info = schema.get("desk_wallets") ?? null;
    const column = (names: string[]) => (info ? names.find((name) => info.columns.has(name)) ?? null : names[0]);
    const payload: Record<string, unknown> = {};
    const addressCol = column(["address", "pubkey", "public_address"]);
    const chainCol = column(["chain", "network"]);
    const labelCol = column(["label", "name"]);
    if (addressCol) payload[addressCol] = address;
    if (chainCol) payload[chainCol] = chain;
    if (labelCol) payload[labelCol] = cleanLabel(body.label);
    if (info?.required.has("id")) payload.id = crypto.randomUUID();
    if (info?.columns.has("created_at")) payload.created_at = new Date().toISOString();
    await serviceRest("desk_wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ ...payload, desk_id: deskId }),
    });
    const bundle = await loadDesks();
    return { status: 200, body: { ok: true, wrote: true, wallets: walletsOf(bundle, deskId), notice: "Address saved." } };
  } catch (error) {
    console.error("desk wallet", error instanceof Error ? error.message : "error");
    return { status: 502, body: { ok: false, error: "Couldn't save that." } };
  }
}

export async function removeDeskWallet(body: Record<string, unknown>): Promise<DeskResult> {
  const deskId = deskIdOf(body.deskId);
  const id = typeof body.id === "string" ? body.id : "";
  if (!deskId) return { status: 404, body: { ok: false, error: "That desk isn't here." } };
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) return { status: 400, body: { ok: false, error: "Nothing to update." } };
  if (!supabaseConfigured()) {
    return { status: 200, body: { ok: true, wrote: false, notice: "Vault isn't connected, so nothing was saved." } };
  }
  try {
    await serviceRest(`desk_wallets?id=eq.${encodeURIComponent(id)}&desk_id=eq.${encodeURIComponent(deskId)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
    const bundle = await loadDesks();
    return { status: 200, body: { ok: true, wrote: true, wallets: walletsOf(bundle, deskId) } };
  } catch (error) {
    console.error("desk wallet", error instanceof Error ? error.message : "error");
    return { status: 502, body: { ok: false, error: "Couldn't save that." } };
  }
}
