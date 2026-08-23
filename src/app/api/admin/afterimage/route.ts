import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get("q") || "";
    const supabase = createServiceClient();
    let query = supabase
      .from("afterimage_prints")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);
    if (q) query = query.or(`username.ilike.%${q}%,want.ilike.%${q}%`);
    const { data, error } = await query;
    if (error) return NextResponse.json({ prints: [], error: error.message });
    return NextResponse.json({ prints: data || [] });
  } catch (err: any) {
    return NextResponse.json({ prints: [], error: err.message });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServiceClient();
    if (body.action === "credits") {
      const userId = String(body.userId || "");
      const add = Number(body.add) || 0;
      if (!userId) return NextResponse.json({ error: "userId" }, { status: 400 });
      const { data: w } = await supabase.from("afterimage_wallets").select("*").eq("user_id", userId).maybeSingle();
      const next = Math.max(0, (w?.credits || 0) + add);
      await supabase.from("afterimage_wallets").upsert({
        user_id: userId,
        credits: next,
        preview_used: w?.preview_used || false,
        updated_at: new Date().toISOString(),
      });
      await writeAudit({ action: "afterimage_credits", details: `${userId} +${add} = ${next}` });
      return NextResponse.json({ success: true, credits: next });
    }
    if (body.id && typeof body.is_public === "boolean") {
      await supabase.from("afterimage_prints").update({ is_public: body.is_public }).eq("id", body.id);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Nothing to patch" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const supabase = createServiceClient();
    const { error } = await supabase.from("afterimage_prints").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAudit({ action: "afterimage_delete", details: id });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
