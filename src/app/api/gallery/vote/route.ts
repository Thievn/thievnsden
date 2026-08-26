import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth-request";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const user = await userFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Log in to Mark or Cut." }, { status: 401 });
    }

    const body = await req.json();
    const judgmentId = body.judgmentId as string;
    const value = body.value as number;

    if (!judgmentId || (value !== 1 && value !== -1)) {
      return NextResponse.json({ error: "Invalid vote" }, { status: 400 });
    }

    const voterKey = user.id;
    const supabase = createServiceClient();

    const { data: judgment } = await supabase
      .from("judgments")
      .select("id, is_public, likes, dislikes, user_id")
      .eq("id", judgmentId)
      .maybeSingle();

    if (!judgment || !judgment.is_public) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (judgment.user_id && judgment.user_id === user.id) {
      return NextResponse.json({ error: "You cannot vote on your own card." }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("gallery_votes")
      .select("id, value")
      .eq("judgment_id", judgmentId)
      .eq("voter_key", voterKey)
      .maybeSingle();

    let likes = judgment.likes || 0;
    let dislikes = judgment.dislikes || 0;

    if (existing) {
      if (existing.value === value) {
        return NextResponse.json({ likes, dislikes, already: true });
      }
      if (existing.value === 1) likes = Math.max(0, likes - 1);
      if (existing.value === -1) dislikes = Math.max(0, dislikes - 1);
      if (value === 1) likes += 1;
      if (value === -1) dislikes += 1;

      await supabase.from("gallery_votes").update({ value }).eq("id", existing.id);
    } else {
      if (value === 1) likes += 1;
      else dislikes += 1;

      await supabase.from("gallery_votes").insert({
        judgment_id: judgmentId,
        voter_key: voterKey,
        value,
      });
    }

    await supabase.from("judgments").update({ likes, dislikes }).eq("id", judgmentId);

    return NextResponse.json({ likes, dislikes, success: true });
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Vote failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
