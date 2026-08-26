import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { compilePrompt, type PrintDraft } from "@/lib/afterimage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = String(body.userId || "");
    if (!userId) return NextResponse.json({ error: "Log in to print." }, { status: 401 });

    const supabase = createServiceClient();
    const { data: auth } = await supabase.auth.admin.getUserById(userId);
    if (!auth?.user) return NextResponse.json({ error: "Invalid account" }, { status: 401 });
    const admin = isAdmin(auth.user);
    if (!admin) {
      return NextResponse.json({ error: "Coming soon." }, { status: 403 });
    }
    const username =
      auth.user.user_metadata?.username || auth.user.email?.split("@")[0] || "anon";

    const draft: PrintDraft = {
      want: String(body.want || ""),
      styleId: String(body.styleId || "photo"),
      styleSearch: String(body.styleSearch || ""),
      heat: String(body.heat || "flirty"),
      phoneId: String(body.phoneId || "classic"),
      subject: body.subject,
      clothes: body.clothes,
      lighting: body.lighting,
      place: body.place,
      overlay: body.overlay,
      extra: body.extra,
      series: body.series,
      pose: body.pose,
      rawPrompt: body.rawPrompt,
      who: body.who,
      age: body.age,
      ethnicity: body.ethnicity,
      body: body.body,
      height: body.height,
      hair: body.hair,
      hairColor: body.hairColor,
      hairStyle: body.hairStyle,
      eyes: body.eyes,
      world: body.world,
      expression: body.expression,
      accessory: body.accessory,
      weather: body.weather,
      makeup: body.makeup,
      camera: body.camera,
      vibe: body.vibe,
    };

    const { data: job, error } = await supabase
      .from("afterimage_jobs")
      .insert({
        user_id: userId,
        username,
        status: "queued",
        payload: {
          draft,
          admin,
          hq: body.finish === "phone",
          compiled: compilePrompt(draft),
        },
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message, hint: "Run the afterimage_jobs SQL." }, { status: 500 });
    }

    return NextResponse.json({ success: true, jobId: job.id, status: "queued" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Print failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId, is_public } = body;
    if (!id || !userId) return NextResponse.json({ error: "Missing" }, { status: 400 });
    const supabase = createServiceClient();
    const { data: row } = await supabase.from("afterimage_prints").select("user_id").eq("id", id).maybeSingle();
    if (!row || row.user_id !== userId) return NextResponse.json({ error: "No" }, { status: 403 });
    const { error } = await supabase.from("afterimage_prints").update({ is_public }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, userId } = body;
    if (!id || !userId) return NextResponse.json({ error: "Missing" }, { status: 400 });
    const supabase = createServiceClient();
    const { data: row } = await supabase.from("afterimage_prints").select("user_id, image_url").eq("id", id).maybeSingle();
    if (!row || row.user_id !== userId) return NextResponse.json({ error: "No" }, { status: 403 });
    const marker = "/afterimage/";
    const idx = String(row.image_url || "").indexOf(marker);
    if (idx >= 0) {
      const path = String(row.image_url).slice(idx + marker.length).split("?")[0];
      if (path) await supabase.storage.from("afterimage").remove([path]);
    }
    await supabase.from("afterimage_prints").delete().eq("id", id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
