import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const supabase = createServiceClient();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.a === "string") patch.a = body.a.trim();
    if (typeof body.b === "string") patch.b = body.b.trim();
    if (typeof body.heat === "string") patch.heat = body.heat;
    if (Array.isArray(body.packs)) patch.packs = body.packs;
    if (typeof body.active === "boolean") patch.active = body.active;
    if (body.aLean) patch.a_lean = body.aLean;
    if (body.bLean) patch.b_lean = body.bLean;
    if (typeof body.topic === "string") patch.topic = body.topic.trim();
    if (typeof body.topicB === "string") patch.topic_b = body.topicB.trim();
    if (typeof body.aSting === "string") patch.a_sting = body.aSting.trim();
    if (typeof body.bSting === "string") patch.b_sting = body.bSting.trim();

    const { error } = await supabase.from("wyr_pairs").update(patch).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAudit({ action: "wyr_update", details: id });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = createServiceClient();
    const { error } = await supabase.from("wyr_pairs").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAudit({ action: "wyr_delete", details: id });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
