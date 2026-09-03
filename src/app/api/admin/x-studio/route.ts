import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { userFromRequest } from "@/lib/auth-request";
import { parseCadence } from "@/lib/x-studio";
import { loadCadence, studioStatus } from "@/lib/x-studio-server";

export const runtime = "nodejs";

async function admin(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user || !isAdmin(user)) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await admin(req);
  if (!user) return NextResponse.json({ error: "admin" }, { status: 401 });
  const { row, cadence } = await loadCadence();
  const zernio = await studioStatus(row);
  return NextResponse.json({ cadence, zernio, spend_cap: row.spend_cap });
}

export async function POST(req: NextRequest) {
  const user = await admin(req);
  if (!user) return NextResponse.json({ error: "admin" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const { supabase, row } = await loadCadence();
  const cadence = parseCadence({ ...row, ...(body.cadence || body) });
  const patch: Record<string, unknown> = {
    types: cadence.types,
    per_day: cadence.per_day,
    days: cadence.days,
    times: cadence.times,
    timezone: cadence.timezone,
    mode: cadence.mode,
    paused: cadence.paused,
    recipe: cadence.recipe,
    updated_at: new Date().toISOString(),
  };
  if (typeof body.zernio_account_id === "string") {
    patch.zernio_account_id = body.zernio_account_id.trim();
  }
  if (typeof body.spend_cap === "number" || body.spend_cap === null) {
    patch.spend_cap = body.spend_cap;
  }
  if (typeof body.zernio_key === "string") {
    const next = body.zernio_key.trim();
    if (next && !next.startsWith("••••")) patch.zernio_key = next;
    if (next === "") patch.zernio_key = null;
  }
  await supabase.from("x_cadence").upsert({ id: 1, ...patch });
  const loaded = await loadCadence();
  const zernio = await studioStatus(loaded.row);
  return NextResponse.json({ cadence: loaded.cadence, zernio, spend_cap: loaded.row.spend_cap });
}
