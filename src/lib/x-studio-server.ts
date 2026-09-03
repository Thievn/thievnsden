import { createServiceClient } from "@/lib/supabase/server";
import { twitterAccount, zernioAccounts } from "@/lib/zernio";
import { defaultCadence, maskKey, parseCadence, type Cadence } from "@/lib/x-studio";

export type CadenceRow = Cadence & {
  zernio_key: string | null;
  zernio_account_id: string | null;
  spend_cap: number | null;
};

export function zernioKeyFrom(row?: { zernio_key?: string | null } | null) {
  return (process.env.ZERNIO_API_KEY || row?.zernio_key || "").trim();
}

export function zernioAccountFrom(row?: { zernio_account_id?: string | null } | null) {
  return (process.env.ZERNIO_X_ACCOUNT_ID || row?.zernio_account_id || "").trim();
}

export async function loadCadence() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("x_cadence").select("*").eq("id", 1).maybeSingle();
  const cadence = parseCadence({
    types: data?.types,
    per_day: data?.per_day,
    days: data?.days,
    times: data?.times,
    timezone: data?.timezone,
    mode: data?.mode,
    paused: data?.paused,
    recipe: data?.recipe,
  });
  const row: CadenceRow = {
    ...cadence,
    zernio_key: data?.zernio_key || null,
    zernio_account_id: data?.zernio_account_id || null,
    spend_cap: data?.spend_cap ?? null,
  };
  return { supabase, row, cadence };
}

export async function studioStatus(row: CadenceRow) {
  const envKey = Boolean(process.env.ZERNIO_API_KEY);
  const key = zernioKeyFrom(row);
  const accountId = zernioAccountFrom(row);
  let handle = "";
  let ready: "ready" | "missing key" | "missing account" = !key ? "missing key" : !accountId ? "missing account" : "ready";
  if (key) {
    try {
      const accounts = await zernioAccounts(key);
      const tw = twitterAccount(accounts, accountId);
      if (tw) {
        handle = tw.username || tw.handle || "";
        if (!accountId) ready = "missing account";
        else ready = "ready";
      } else if (key) {
        ready = accountId ? "missing account" : "missing account";
      }
    } catch {
      if (!key) ready = "missing key";
    }
  }
  return {
    ready,
    handle,
    has_key: Boolean(key),
    key_from_env: envKey,
    key_hint: envKey ? "env" : maskKey(row.zernio_key || ""),
    account_id: accountId,
    timezone: row.timezone,
    spend_cap: row.spend_cap,
  };
}
