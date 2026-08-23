import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { compilePrompt, phoneById, type PrintDraft } from "@/lib/afterimage";
import { generateWallpaper } from "@/lib/afterimage-gen";
import { cropTo916 } from "@/lib/afterimage-crop";

export const runtime = "nodejs";
export const maxDuration = 60;

async function upload(userId: string, b64: string) {
  const supabase = createServiceClient();
  let bytes: Buffer;
  try {
    bytes = await cropTo916(b64);
  } catch {
    bytes = Buffer.from(b64, "base64");
  }
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.jpg`;
  const { error } = await supabase.storage.from("afterimage").upload(path, bytes, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(`STORAGE: ${error.message}`);
  const { data } = supabase.storage.from("afterimage").getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jobId = String(body.jobId || "");
    if (!jobId) return NextResponse.json({ error: "Missing job" }, { status: 400 });
    const supabase = createServiceClient();
    const { data: job, error: jobErr } = await supabase.from("afterimage_jobs").select("*").eq("id", jobId).maybeSingle();
    if (jobErr) throw new Error(jobErr.message);
    if (!job) return NextResponse.json({ error: "No job" }, { status: 404 });
    if (job.status === "done" && job.image_url) {
      return NextResponse.json({ success: true, image_url: job.image_url, print_id: job.print_id });
    }

    await supabase.from("afterimage_jobs").update({ status: "running", updated_at: new Date().toISOString() }).eq("id", jobId);

    const payload = job.payload || {};
    const draft: PrintDraft = payload.draft;
    const prompt = compilePrompt(draft);
    const phone = phoneById(draft.phoneId);
    const admin = !!payload.admin;
    const hq = !!payload.hq && admin;

    let gen;
    try {
      gen = await generateWallpaper({
        prompt,
        aspect: "9:16",
        kind: hq ? "phone" : "preview",
        n: 1,
      });
    } catch (err: any) {
      const rejected = err.rejected || String(err.message) === "REJECTED";
      const message = rejected ? "Couldn't print that. Nothing spent." : err.message || "Print failed";
      await supabase.from("afterimage_jobs").update({ status: "error", error: message, updated_at: new Date().toISOString() }).eq("id", jobId);
      return NextResponse.json({ error: message, rejected }, { status: rejected ? 422 : 500 });
    }

    const image_url = await upload(job.user_id, gen.images[0]);
    const { data: row, error } = await supabase
      .from("afterimage_prints")
      .insert({
        user_id: job.user_id,
        username: job.username,
        image_url,
        want: draft.want,
        compiled_prompt: prompt,
        phone_id: phone.id,
        style_id: draft.styleId,
        heat: draft.heat,
        finish: hq ? "phone" : "print",
        model: gen.model,
        resolution: gen.resolution,
        aspect: "9:16",
        is_public: false,
        is_admin: admin,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("afterimage_jobs").update({
      status: "done",
      image_url,
      print_id: row.id,
      error: null,
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);

    return NextResponse.json({ success: true, prints: [row], image_url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Run failed" }, { status: 500 });
  }
}
