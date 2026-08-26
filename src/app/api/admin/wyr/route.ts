import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { WYR_BANK } from "@/lib/wyr-bank";
import { pairToRow, rowToPair, DEFAULT_LEAN } from "@/lib/wyr-map";
import { writeAudit } from "@/lib/audit";
import { generateAndInsert } from "@/lib/wyr-generate";

export const maxDuration = 120;

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error, count } = await supabase
      .from("wyr_pairs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });
    if (error) {
      return NextResponse.json({
        pairs: [],
        error: error.message,
        hint: "Run the wyr_pairs SQL in docs/wyr-sql.md",
      });
    }
    const topics: Record<string, number> = {};
    for (const row of data || []) {
      const t = row.topic || "untagged";
      topics[t] = (topics[t] || 0) + 1;
    }
    return NextResponse.json({
      pairs: (data || []).map(rowToPair).filter(Boolean),
      raw: data || [],
      count: count || (data || []).length,
      topics,
    });
  } catch (err: any) {
    return NextResponse.json({ pairs: [], error: err.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const supabase = createServiceClient();

    if (body.action === "generate") {
      const count = Math.min(40, Math.max(8, Number(body.count) || 16));
      const result = await generateAndInsert(supabase, { count, replace: false });
      await writeAudit({
        action: "wyr_generate",
        details: `inserted ${result.inserted}`,
      });
      return NextResponse.json({ success: true, ...result });
    }

    if (body.action === "replace") {
      return NextResponse.json(
        {
          error: "Replace of the full pool runs from the generate script, not this route.",
          hint: "Use generate for a 16–40 refill. The 500-swap is a one-shot pool rebuild.",
        },
        { status: 400 }
      );
    }

    if (body.action === "seed") {
      const rows = WYR_BANK.map((p) => pairToRow(p, "bank"));
      const { error } = await supabase.from("wyr_pairs").upsert(rows, { onConflict: "id" });
      if (error) {
        return NextResponse.json(
          { error: error.message, hint: "Create wyr_pairs first" },
          { status: 500 }
        );
      }
      await writeAudit({
        action: "wyr_seed",
        details: `seeded ${rows.length} fallback pairs`,
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
      `floor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const row = {
      id,
      a,
      b,
      heat: body.heat || "spicy",
      packs: Array.isArray(body.packs) && body.packs.length ? body.packs : ["people"],
      a_lean: body.aLean || DEFAULT_LEAN,
      b_lean: body.bLean || DEFAULT_LEAN,
      topic: body.topic || null,
      topic_b: body.topicB || body.topic_b || null,
      a_sting: body.aSting || body.a_sting || null,
      b_sting: body.bSting || body.b_sting || null,
      source: "admin",
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
