import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  DEFAULT_GAMING_CONFIG,
  SEED_GAMING_ITEMS,
  type GamingConfig,
  type GamingItem,
} from "@/lib/gaming-data";
import { runDailyPull } from "@/lib/gaming-pull";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  if (secret && auth === `Bearer ${secret}`) return true;
  if (req.headers.get("x-vercel-cron") === "1") return true;
  return false;
}

async function run() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("site_settings")
    .select("gaming_config, gaming_items")
    .eq("id", 1)
    .maybeSingle();

  const config: GamingConfig = { ...DEFAULT_GAMING_CONFIG, ...(data?.gaming_config || {}) };
  const items: GamingItem[] =
    Array.isArray(data?.gaming_items) && data.gaming_items.length
      ? (data.gaming_items as GamingItem[])
      : SEED_GAMING_ITEMS;

  const result = await runDailyPull(config, items, false);
  await supabase.from("site_settings").upsert({
    id: 1,
    gaming_config: result.config,
    gaming_items: result.items,
    updated_at: new Date().toISOString(),
  });
  return result;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await run();
    return NextResponse.json({
      ok: true,
      count: result.added.length,
      added: result.added.map((i) => i.title),
      skipped: result.skipped,
    });
  } catch (err: any) {
    console.error("gaming cron", err);
    return NextResponse.json({ error: err.message || "Cron failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
