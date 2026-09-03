import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchOwnPosts, xApiReady, xHandle } from "@/lib/x-api";
import { findDuplicates, normalizePost, parseStatusId, postUrl, type XPostRow } from "@/lib/x-posts";

export const runtime = "nodejs";

function asRows(data: any[] | null): XPostRow[] {
  return (data || []) as XPostRow[];
}

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("x_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) return NextResponse.json({ rows: [], error: error.message, connected: xApiReady() });
    return NextResponse.json({
      rows: data || [],
      connected: xApiReady(),
      handle: xHandle(),
    });
  } catch (err: any) {
    return NextResponse.json({ rows: [], error: err.message, connected: xApiReady() });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || "log");
    const supabase = createServiceClient();

    if (action === "check") {
      const draft = String(body.body || "").trim();
      const skipId = String(body.skip_id || body.id || "").trim() || undefined;
      if (!draft) return NextResponse.json({ hits: [] });
      const { data, error } = await supabase.from("x_posts").select("*").limit(120);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ hits: findDuplicates(draft, asRows(data), 5, skipId) });
    }

    if (action === "sync") {
      if (!xApiReady()) {
        return NextResponse.json(
          { error: "Add X_BEARER_TOKEN on Vercel to pull your live posts." },
          { status: 501 }
        );
      }
      const remote = await fetchOwnPosts(10);
      let added = 0;
      for (const post of remote) {
        const { error } = await supabase.from("x_posts").upsert(
          {
            post_id: post.post_id,
            url: post.url,
            body: post.body,
            body_norm: normalizePost(post.body),
            source: "sync",
            posted_at: post.posted_at,
            metrics: post.metrics,
          },
          { onConflict: "post_id" }
        );
        if (!error) added += 1;
      }
      const { data } = await supabase
        .from("x_posts")
        .select("*")
        .order("posted_at", { ascending: false, nullsFirst: false })
        .limit(80);
      return NextResponse.json({
        rows: data || [],
        synced: remote.length,
        added,
        connected: true,
        handle: xHandle(),
      });
    }

    const currentId = String(body.id || "").trim();
    const text = String(body.body || "").trim();
    const rawUrl = String(body.url || "").trim();

    if (action === "save") {
      if (!currentId) return NextResponse.json({ error: "No draft." }, { status: 400 });
      const patch: Record<string, unknown> = {};
      if (text) {
        patch.body = text;
        patch.body_norm = normalizePost(text);
      }
      if (Array.isArray(body.media_urls)) patch.media_urls = body.media_urls;
      if (typeof body.aspect === "string") patch.aspect = body.aspect;
      if (typeof body.post_type === "string") patch.post_type = body.post_type;
      if (typeof body.approved === "boolean") patch.approved = body.approved;
      if (typeof body.status === "string") patch.status = body.status;
      if (body.scheduled_for === null || typeof body.scheduled_for === "string") patch.scheduled_for = body.scheduled_for;
      const { data, error } = await supabase.from("x_posts").update(patch).eq("id", currentId).select("*").maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ row: data });
    }

    if (action === "skip") {
      const skipId = String(body.id || "").trim();
      if (!skipId) return NextResponse.json({ error: "No row." }, { status: 400 });
      const { data, error } = await supabase
        .from("x_posts")
        .update({ status: "skipped", fail_reason: "skipped" })
        .eq("id", skipId)
        .select("*")
        .maybeSingle();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ row: data });
    }

    const postId = parseStatusId(rawUrl) || parseStatusId(text);
    if (!text && !postId && !currentId) {
      return NextResponse.json({ error: "Paste the post text or an X status link." }, { status: 400 });
    }
    const url = rawUrl || (postId ? postUrl(xHandle(), postId) : null);
    const row = {
      post_id: postId || null,
      url,
      body: text || `(posted ${postId})`,
      body_norm: normalizePost(text || postId || ""),
      source: "manual",
      posted_at: body.posted_at || new Date().toISOString(),
    };
    if (currentId) {
      const patch: Record<string, unknown> = {
        source: "manual",
        posted_at: row.posted_at,
      };
      if (text) {
        patch.body = row.body;
        patch.body_norm = row.body_norm;
      }
      if (url) patch.url = url;
      if (postId) patch.post_id = postId;
      const { data, error } = await supabase.from("x_posts").update(patch).eq("id", currentId).select("*").single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ row: data });
    }
    const write = postId
      ? supabase.from("x_posts").upsert(row, { onConflict: "post_id" }).select("*").single()
      : supabase.from("x_posts").insert({ ...row, post_id: null }).select("*").single();
    const { data, error } = await write;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ row: data });
  } catch (err: any) {
    const status = Number(err.status) || 500;
    return NextResponse.json({ error: err.message || "X posts failed" }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const supabase = createServiceClient();
    const { error } = await supabase.from("x_posts").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
