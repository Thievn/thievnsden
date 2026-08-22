import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { WYR_BANK } from "@/lib/wyr-bank";
import { pairToRow, rowToPair, DEFAULT_LEAN } from "@/lib/wyr-map";
import { writeAudit } from "@/lib/audit";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("wyr_pairs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({
        pairs: [],
        error: error.message,
        hint: "Run the wyr_pairs SQL in docs/wyr-sql.md",
      });
    }
    return NextResponse.json({
      pairs: (data || []).map(rowToPair).filter(Boolean),
      raw: data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ pairs: [], error: err.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createServiceClient();

    if (body.action === "seed") {
      const rows = WYR_BANK.map(pairToRow);
      const { error } = await supabase.from("wyr_pairs").upsert(rows, { onConflict: "id" });
      if (error) {
        return NextResponse.json(
          { error: error.message, hint: "Create wyr_pairs first" },
          { status: 500 }
        );
      }
      await writeAudit({
        action: "wyr_seed",
        details: `seeded ${rows.length} pairs`,
      });
      return NextResponse.json({ success: true, seeded: rows.length });
    }

    const a = String(body.a || "").trim();
    const b = String(body.b || "").trim();
    if (!a || !b) {
      return NextResponse.json({ error: "Need both sides" }, { status: 400 });
    }
    const id =
      String(body.id || "").trim() ||
      `wyr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const row = {
      id,
      a,
      b,
      heat: body.heat || "spicy",
      packs: Array.isArray(body.packs) && body.packs.length ? body.packs : ["people"],
      a_lean: body.aLean || DEFAULT_LEAN,
      b_lean: body.bLean || DEFAULT_LEAN,
      active: body.active !== false,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("wyr_pairs").upsert(row, { onConflict: "id" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAudit({ action: "wyr_upsert", details: id });
    return NextResponse.json({ success: true, pair: rowToPair(row) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
