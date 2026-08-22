import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { WYR_PAIRS } from "@/lib/wyr-data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pairId = String(body.pairId || "");
    const side = body.side === "b" ? "b" : "a";
    if (!WYR_PAIRS.some((p) => p.id === pairId)) {
      return NextResponse.json({ error: "Unknown pair" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from("wyr_votes")
      .select("pair_id, picks_a, picks_b")
      .eq("pair_id", pairId)
      .maybeSingle();

    let picksA = existing?.picks_a || 0;
    let picksB = existing?.picks_b || 0;
    if (side === "a") picksA += 1;
    else picksB += 1;

    const { error } = await supabase.from("wyr_votes").upsert({
      pair_id: pairId,
      picks_a: picksA,
      picks_b: picksB,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({
        picksA: side === "a" ? 1 : 0,
        picksB: side === "b" ? 1 : 0,
        source: "local",
      });
    }

    return NextResponse.json({ picksA, picksB, source: "db" });
  } catch (err: any) {
    return NextResponse.json({
      picksA: 1,
      picksB: 0,
      source: "fallback",
      error: err?.message,
    });
  }
}
