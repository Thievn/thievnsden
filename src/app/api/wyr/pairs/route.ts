import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { WYR_BANK } from "@/lib/wyr-bank";
import { rowToPair } from "@/lib/wyr-map";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("wyr_pairs")
      .select("id, a, b, heat, packs, a_lean, b_lean, active")
      .eq("active", true)
      .order("id", { ascending: true });

    if (error || !data?.length) {
      return NextResponse.json({
        pairs: WYR_BANK,
        source: "code",
        count: WYR_BANK.length,
      });
    }

    const pairs = data.map(rowToPair).filter(Boolean);
    return NextResponse.json({ pairs, source: "db", count: pairs.length });
  } catch (err: any) {
    return NextResponse.json({
      pairs: WYR_BANK,
      source: "code",
      count: WYR_BANK.length,
      error: err.message,
    });
  }
}
