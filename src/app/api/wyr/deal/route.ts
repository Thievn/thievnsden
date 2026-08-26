import { after, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { WYR_BANK } from "@/lib/wyr-bank";
import { rowToPair } from "@/lib/wyr-map";
import { dealFromPool, floorTitle } from "@/lib/wyr-deal";
import { maybeRefillPool } from "@/lib/wyr-generate";
import type { WyrPair } from "@/lib/wyr-data";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function GET() {
  let pool: WyrPair[] = [];
  let source: "db" | "code" = "code";
  let supabase: ReturnType<typeof createServiceClient> | null = null;
  try {
    supabase = createServiceClient();
    const { data, error } = await supabase.rpc("wyr_random_pairs", { n: 36 });

    if (!error && data?.length) {
      pool = data.map(rowToPair).filter(Boolean) as WyrPair[];
      source = "db";
    } else {
      const fallback = await supabase
        .from("wyr_pairs")
        .select(
          "id, a, b, heat, packs, a_lean, b_lean, topic, topic_b, a_sting, b_sting, active"
        )
        .eq("active", true)
        .limit(36);
      if (fallback.data?.length) {
        pool = fallback.data.map(rowToPair).filter(Boolean) as WyrPair[];
        source = "db";
      }
    }

    if (supabase) {
      try {
        after(() => {
          maybeRefillPool(supabase!).catch(() => {});
        });
      } catch {
        // refill is optional; never block the deal
      }
    }
  } catch {
    pool = [];
  }

  if (pool.length < 10) pool = [...pool, ...WYR_BANK];
  const pairs = dealFromPool(pool, 10);
  return NextResponse.json({
    pairs,
    source,
    pool: source === "db" ? pool.length : WYR_BANK.length,
    floor: { title: floorTitle(pairs) },
  });
}
