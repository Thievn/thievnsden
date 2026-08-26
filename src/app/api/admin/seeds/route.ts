import { NextRequest, NextResponse } from "next/server";
import { writeAudit } from "@/lib/audit";
import {
  buildImagePrompt,
  createHouseAccount,
  filtersFromBody,
  generateSelfieImage,
  insertCastJudgment,
  removeStorageUrl,
  resolveRecipe,
  uploadJudgmentImage,
  visionJudge,
  type CastFilters,
} from "@/lib/demo-cast";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

async function createOneCast(makePublic: boolean, filters: CastFilters = {}) {
  const recipe = resolveRecipe(filters);
  const { supabase, userId, username } = await createHouseAccount(recipe);

  try {
    const prompt = buildImagePrompt(recipe);
    const { b64, dataUrl } = await generateSelfieImage(prompt);
    const imageUrl = await uploadJudgmentImage(userId, b64);
    const { verdict, score } = await visionJudge({
      style: recipe.style,
      focus: recipe.focus,
      filthyMode: recipe.filthyMode,
      imageDataUrl: dataUrl,
    });
    const judgment = await insertCastJudgment({
      userId,
      recipe,
      imageUrl,
      verdict,
      score,
      makePublic,
    });

    return {
      username,
      userId,
      judgment,
      imageUrl,
      meta: recipe,
    };
  } catch (err) {
    try {
      await supabase.from("judgments").delete().eq("user_id", userId);
    } catch {
      // ignore
    }
    try {
      await supabase.from("profiles").delete().eq("id", userId);
    } catch {
      // ignore
    }
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch {
      // ignore
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.XAI_API_KEY) {
      return NextResponse.json(
        { error: "FAILED: XAI_API_KEY is not set on Vercel" },
        { status: 500 }
      );
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: "FAILED: Supabase service env vars missing" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const count = Math.min(Math.max(Number(body.count) || 1, 1), 2);
    const makePublic = body.makePublic !== false;
    const custom = filtersFromBody(body.custom || undefined);

    const results = [];
    const errors: string[] = [];
    const runs = body.custom ? 1 : count;

    for (let i = 0; i < runs; i++) {
      try {
        results.push(await createOneCast(makePublic, custom));
      } catch (err: any) {
        console.error("cast error", err);
        errors.push(err.message || "failed");
      }
    }

    await writeAudit({
      action: "seed_demos",
      details: `cast ${results.length}, errors ${errors.length}, public=${makePublic}, heat=${custom.heat || "mix"}`,
    });

    if (results.length === 0) {
      return NextResponse.json(
        {
          success: false,
          created: 0,
          results: [],
          errors,
          error: errors[0] || "Cast failed",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      created: results.length,
      results,
      errors,
      custom: !!body.custom,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Cast failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("judgments")
      .select(
        "id, user_id, style, focus, score, rarity, verdict, image_url, is_public, is_demo, likes, dislikes, filthy_mode, heat, cast_recipe, created_at"
      )
      .eq("is_demo", true)
      .order("created_at", { ascending: false })
      .limit(80);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userIds = [...new Set((data || []).map((j) => j.user_id).filter(Boolean))];
    let nameMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds as string[]);
      (profiles || []).forEach((p) => {
        nameMap[p.id] = p.username;
      });
    }

    const demos = (data || []).map((j) => ({
      ...j,
      username: j.user_id ? nameMap[j.user_id] || "anon" : "anon",
    }));

    return NextResponse.json({ demos });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = createServiceClient();

    const { data: demos } = await supabase
      .from("judgments")
      .select("id, user_id, image_url")
      .eq("is_demo", true);

    const userIds = [...new Set((demos || []).map((d) => d.user_id).filter(Boolean))] as string[];

    for (const d of demos || []) {
      await removeStorageUrl(supabase, d.image_url);
    }

    await supabase.from("judgments").delete().eq("is_demo", true);

    for (const uid of userIds) {
      try {
        await supabase.from("profiles").delete().eq("id", uid);
      } catch {
        // continue — used_usernames keeps the handle reserved
      }
      try {
        await supabase.auth.admin.deleteUser(uid);
      } catch {
        // continue
      }
    }

    await writeAudit({
      action: "purge_demos",
      details: `cleared ${demos?.length || 0} house cards, ${userIds.length} accounts`,
    });

    return NextResponse.json({
      success: true,
      purgedJudgments: demos?.length || 0,
      purgedUsers: userIds.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Clear failed" }, { status: 500 });
  }
}
