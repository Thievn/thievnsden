import { NextRequest, NextResponse } from "next/server";
import { writeAudit } from "@/lib/audit";
import {
  buildImagePrompt,
  generateSelfieImage,
  removeStorageUrl,
  resolveRecipe,
  rollVotes,
  uploadJudgmentImage,
  visionJudge,
  type CastRecipe,
} from "@/lib/demo-cast";
import { getRarity } from "@/lib/rarity";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

async function loadDemo(id: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("judgments")
    .select(
      "id, user_id, style, focus, filthy_mode, score, rarity, verdict, image_url, is_public, is_demo, likes, dislikes, cast_recipe, heat"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Card not found");
  if (!data.is_demo) throw new Error("Not a house card");
  return { supabase, data };
}

function recipeFromRow(data: {
  style: string;
  focus: string;
  filthy_mode: string | null;
  heat: string | null;
  cast_recipe: CastRecipe | null;
}): CastRecipe {
  if (data.cast_recipe && typeof data.cast_recipe === "object") {
    return {
      ...data.cast_recipe,
      uniq: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    };
  }
  const heat =
    data.heat === "tame" ? "clean" : data.heat === "filthy" ? "filthy" : "spicy";
  return resolveRecipe({
    heat,
    style: data.style,
    focus: data.focus,
    filthyMode: data.filthy_mode,
  });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (!["image", "verdict", "visibility", "votes"].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "image", "verdict", "visibility", or "votes"' },
        { status: 400 }
      );
    }

    const { supabase, data: demo } = await loadDemo(id);

    if (action === "visibility") {
      if (typeof body.is_public !== "boolean") {
        return NextResponse.json({ error: "is_public required" }, { status: 400 });
      }
      const { data: updated, error } = await supabase
        .from("judgments")
        .update({ is_public: body.is_public })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      await writeAudit({
        action: body.is_public ? "cast_publish" : "cast_hide",
        details: `judgment ${id}`,
      });
      return NextResponse.json({ success: true, judgment: updated });
    }

    if (action === "votes") {
      const votes = rollVotes();
      const { data: updated, error } = await supabase
        .from("judgments")
        .update({ likes: votes.likes, dislikes: votes.dislikes })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      await writeAudit({ action: "cast_reroll_votes", details: `judgment ${id}` });
      return NextResponse.json({ success: true, judgment: updated });
    }

    if (!process.env.XAI_API_KEY) {
      return NextResponse.json({ error: "XAI_API_KEY missing" }, { status: 500 });
    }

    if (action === "image") {
      const keepLook = body.keepLook !== false;
      const recipe = keepLook
        ? recipeFromRow(demo)
        : resolveRecipe({
            style: demo.style,
            focus: demo.focus,
            filthyMode: demo.filthy_mode,
          });

      const prompt = buildImagePrompt(recipe);
      const { b64, dataUrl } = await generateSelfieImage(prompt);
      if (!demo.user_id) throw new Error("House card has no user_id");

      const imageUrl = await uploadJudgmentImage(demo.user_id, b64);
      await removeStorageUrl(supabase, demo.image_url);

      const { verdict, score } = await visionJudge({
        style: demo.style,
        focus: demo.focus,
        filthyMode: demo.filthy_mode,
        imageDataUrl: dataUrl,
      });
      const rarity = getRarity(score).name;

      const { data: updated, error } = await supabase
        .from("judgments")
        .update({
          image_url: imageUrl,
          verdict,
          score,
          rarity,
          cast_recipe: recipe,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      await writeAudit({ action: "seed_regen_image", details: `judgment ${id}` });
      return NextResponse.json({ success: true, judgment: updated });
    }

    if (!demo.image_url) {
      return NextResponse.json(
        { error: "No image on this card — regen pic first" },
        { status: 400 }
      );
    }

    const { verdict, score } = await visionJudge({
      style: demo.style,
      focus: demo.focus,
      filthyMode: demo.filthy_mode,
      imageDataUrl: demo.image_url,
    });
    const rarity = getRarity(score).name;

    const { data: updated, error } = await supabase
      .from("judgments")
      .update({ verdict, score, rarity })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    await writeAudit({ action: "seed_regen_verdict", details: `judgment ${id}` });
    return NextResponse.json({ success: true, judgment: updated });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const { supabase, data: demo } = await loadDemo(id);

    await removeStorageUrl(supabase, demo.image_url);

    const { error: delErr } = await supabase.from("judgments").delete().eq("id", id);
    if (delErr) throw new Error(delErr.message);

    if (demo.user_id) {
      const { count } = await supabase
        .from("judgments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", demo.user_id);

      if (!count || count === 0) {
        try {
          await supabase.from("profiles").delete().eq("id", demo.user_id);
        } catch {
          // username stays reserved
        }
        try {
          await supabase.auth.admin.deleteUser(demo.user_id);
        } catch {
          // ignore
        }
      }
    }

    await writeAudit({ action: "seed_delete_one", details: `judgment ${id}` });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Delete failed" }, { status: 500 });
  }
}
