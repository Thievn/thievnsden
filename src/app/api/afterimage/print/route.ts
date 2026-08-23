import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { compilePrompt, phoneById, type PrintDraft } from "@/lib/afterimage";
import { generateWallpaper } from "@/lib/afterimage-gen";

export const runtime = "nodejs";
export const maxDuration = 120;

async function upload(userId: string, b64: string) {
  const supabase = createServiceClient();
  const bytes = Buffer.from(b64, "base64");
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.jpg`;
  const { error } = await supabase.storage.from("afterimage").upload(path, bytes, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(`STORAGE: ${error.message}. Create public bucket afterimage.`);
  const { data } = supabase.storage.from("afterimage").getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("STORAGE: no url");
  return data.publicUrl;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = String(body.userId || "");
    if (!userId) {
      return NextResponse.json({ error: "Log in to print." }, { status: 401 });
    }
    const supabase = createServiceClient();
    const { data: auth } = await supabase.auth.admin.getUserById(userId);
    if (!auth?.user) return NextResponse.json({ error: "Invalid account" }, { status: 401 });
    const admin = isAdmin(auth.user);
    const username =
      auth.user.user_metadata?.username || auth.user.email?.split("@")[0] || "anon";

    const draft: PrintDraft = {
      want: String(body.want || ""),
      styleId: String(body.styleId || "photo"),
      styleSearch: String(body.styleSearch || ""),
      heat: String(body.heat || "flirty"),
      phoneId: String(body.phoneId || "iphone-16"),
      subject: body.subject,
      clothes: body.clothes,
      lighting: body.lighting,
      place: body.place,
      overlay: body.overlay,
      safeZone: !!body.safeZone,
      extra: body.extra,
      rawPrompt: admin ? body.rawPrompt : undefined,
    };
    const prompt = compilePrompt(draft);
    const phone = phoneById(draft.phoneId);
    const finish: "preview" | "phone" = body.finish === "phone" ? "phone" : "preview";
    const threeUp = !!body.threeUp && (admin || finish === "phone");
    const n = threeUp ? 3 : 1;

    const { data: wallet } = await supabase
      .from("afterimage_wallets")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    const credits = wallet?.credits || 0;
    const previewUsed = !!wallet?.preview_used;

    if (!admin) {
      if (finish === "preview") {
        if (previewUsed) {
          return NextResponse.json(
            { error: "Preview already used. Phone-ready takes a credit." },
            { status: 402 }
          );
        }
      } else {
        const need = n;
        if (credits < need) {
          return NextResponse.json(
            { error: `Need ${need} credit${need > 1 ? "s" : ""} for phone-ready.` },
            { status: 402 }
          );
        }
      }
    }

    let gen;
    try {
      gen = await generateWallpaper({
        prompt,
        aspect: phone.aspect,
        kind: finish,
        n,
      });
    } catch (err: any) {
      if (err.rejected || String(err.message) === "REJECTED") {
        return NextResponse.json(
          { error: "Couldn't print that. Nothing spent." , rejected: true },
          { status: 422 }
        );
      }
      throw err;
    }

    const rows = [];
    for (const b64 of gen.images) {
      const image_url = await upload(userId, b64);
      const { data, error } = await supabase
        .from("afterimage_prints")
        .insert({
          user_id: userId,
          username,
          image_url,
          want: draft.want,
          compiled_prompt: prompt,
          phone_id: phone.id,
          style_id: draft.styleId,
          heat: draft.heat,
          finish,
          model: gen.model,
          resolution: gen.resolution,
          aspect: phone.aspect,
          is_public: admin ? body.publish !== false : false,
          is_admin: admin,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      rows.push(data);
    }

    if (!admin) {
      if (finish === "preview") {
        await supabase.from("afterimage_wallets").upsert({
          user_id: userId,
          credits,
          preview_used: true,
          updated_at: new Date().toISOString(),
        });
      } else {
        await supabase.from("afterimage_wallets").upsert({
          user_id: userId,
          credits: credits - n,
          preview_used: previewUsed,
          updated_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      prints: rows,
      threeUp,
      finish,
    });
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
