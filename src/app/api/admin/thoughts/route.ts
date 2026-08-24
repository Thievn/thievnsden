import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.from("den_thoughts").select("*").order("created_at", { ascending: false }).limit(80);
    if (error) return NextResponse.json({ rows: [], error: error.message });
    return NextResponse.json({ rows: data || [] });
  } catch (err: any) {
    return NextResponse.json({ rows: [], error: err.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServiceClient();
    const slug = String(body.slug || "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!slug || !body.title) {
      return NextResponse.json({ error: "Need slug and title" }, { status: 400 });
    }
    const row = {
      slug,
      title: String(body.title).slice(0, 160),
      excerpt: String(body.excerpt || "").slice(0, 400),
      body: String(body.body || "Classic essay."),
      cover_url: body.cover_url || null,
      outlook: body.outlook || null,
      topic: body.topic || null,
      heat: body.heat || null,
      published: body.published !== false,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from("den_thoughts").upsert(row, { onConflict: "slug" }).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ row: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServiceClient();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.published === "boolean") patch.published = body.published;
    if (body.cover_url) patch.cover_url = body.cover_url;
    if (body.title) patch.title = body.title;
    if (body.excerpt !== undefined) patch.excerpt = body.excerpt;
    if (body.body) patch.body = body.body;
    if (body.topic) patch.topic = body.topic;
    let q = supabase.from("den_thoughts").update(patch);
    if (body.id) q = q.eq("id", body.id);
    else if (body.slug) q = q.eq("slug", body.slug);
    else return NextResponse.json({ error: "id or slug" }, { status: 400 });
    const { error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const supabase = createServiceClient();
    const { error } = await supabase.from("den_thoughts").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
