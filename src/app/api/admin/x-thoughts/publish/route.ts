import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { userFromRequest } from "@/lib/auth-request";
import { createServiceClient } from "@/lib/supabase/server";
import { hasRawUrl, zernioScheduleStamp } from "@/lib/x-studio";
import { loadCadence, studioStatus, zernioAccountFrom, zernioKeyFrom } from "@/lib/x-studio-server";
import { zernioPublish } from "@/lib/zernio";
import { findDuplicates, normalizePost, postUrl } from "@/lib/x-posts";
import { xHandle } from "@/lib/x-api";
import { xThoughtHits } from "@/lib/x-thoughts";

export const runtime = "nodejs";
export const maxDuration = 60;

async function admin(req: NextRequest) {
  const user = await userFromRequest(req);
  if (!user || !isAdmin(user)) return null;
  return user;
}

export async function POST(req: NextRequest) {
  const user = await admin(req);
  if (!user) return NextResponse.json({ error: "admin" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "now");
  const id = String(body.id || "").trim();
  const text = String(body.body || "").trim();
  const media = Array.isArray(body.media_urls) ? body.media_urls.map(String).filter(Boolean) : [];
  if (!id && !text) return NextResponse.json({ error: "Nothing to send." }, { status: 400 });

  const { supabase, row, cadence } = await loadCadence();
  const status = await studioStatus(row);
  const key = zernioKeyFrom(row);
  const accountId = status.account_id || zernioAccountFrom(row);
  if (!key) {
    return NextResponse.json(
      { error: "Add ZERNIO_API_KEY on Vercel Production, then Redeploy. X_BEARER_TOKEN is only the read sync." },
      { status: 400 }
    );
  }
  if (!accountId || status.ready !== "ready") {
    const why =
      status.ready === "key rejected"
        ? "Zernio rejected the key."
        : status.ready === "zernio down"
          ? "Zernio did not answer."
          : "Connect the X account in Zernio, or paste the account id.";
    return NextResponse.json({ error: why }, { status: 400 });
  }

  let draft: any = null;
  if (id) {
    const { data } = await supabase.from("x_posts").select("*").eq("id", id).maybeSingle();
    draft = data;
  }
  const content = text || String(draft?.body || "");
  const mediaUrls = media.length ? media : (draft?.media_urls || []);
  if (!content.trim()) return NextResponse.json({ error: "Empty post." }, { status: 400 });
  if (hasRawUrl(content) && !body.allow_url) {
    return NextResponse.json({ error: "Raw link in the body. Site stays in the bio." }, { status: 400 });
  }

  const [{ data: posts }, { data: thoughts }] = await Promise.all([
    supabase.from("x_posts").select("*").limit(120),
    supabase.from("den_thoughts").select("id, title, excerpt").limit(40),
  ]);
  const hits = xThoughtHits(content, posts || [], thoughts || [], id);
  const bodyHits = findDuplicates(content, (posts || []) as any, 5, id);
  const close = [...hits, ...bodyHits].filter((h) => h.score >= 0.58);
  const sameNorm = (posts || []).some(
    (p: any) => p.id !== id && normalizePost(p.body || "") && normalizePost(p.body) === normalizePost(content) && (p.status === "sent" || p.posted_at)
  );
  if (sameNorm || close[0]) {
    return NextResponse.json({ error: "Too close to something already stored.", hits: close, blocked: true }, { status: 409 });
  }

  try {
    if (action === "queue") {
      const when = String(body.scheduled_for || "").trim();
      if (!when) return NextResponse.json({ error: "Pick a time." }, { status: 400 });
      const approved = cadence.mode === "auto" || body.approved === true;
      let zernio_post_id = draft?.zernio_post_id || null;
      if (approved) {
        const sent = await zernioPublish({
          key,
          accountId,
          content,
          mediaUrls,
          scheduledFor: zernioScheduleStamp(when, cadence.timezone),
          timezone: cadence.timezone,
        });
        zernio_post_id = sent.zernio_post_id;
      }
      const patch = {
        body: content,
        body_norm: normalizePost(content),
        media_urls: mediaUrls,
        scheduled_for: when,
        status: "queued",
        approved,
        source: "draft",
        zernio_post_id,
        fail_reason: null,
      };
      const q = id
        ? supabase.from("x_posts").update(patch).eq("id", id).select("*").maybeSingle()
        : supabase.from("x_posts").insert({ ...patch, posted_at: null, post_id: null }).select("*").maybeSingle();
      const { data, error } = await q;
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ row: data, queued: true, scheduled: approved });
    }

    const sent = await zernioPublish({
      key,
      accountId,
      content,
      mediaUrls,
      publishNow: true,
    });
    const liveId = sent.post_id;
    const url = sent.url || (liveId ? postUrl(xHandle(), liveId) : null);
    const patch = {
      body: content,
      body_norm: normalizePost(content),
      media_urls: mediaUrls,
      status: "sent",
      approved: true,
      source: "zernio",
      posted_at: new Date().toISOString(),
      post_id: liveId,
      url,
      zernio_post_id: sent.zernio_post_id,
      scheduled_for: null,
      fail_reason: null,
    };
    const q = id
      ? supabase.from("x_posts").update(patch).eq("id", id).select("*").maybeSingle()
      : supabase.from("x_posts").insert(patch).select("*").maybeSingle();
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ row: data, sent: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Send failed";
    if (id) {
      await supabase.from("x_posts").update({ status: "failed", fail_reason: message.slice(0, 280) }).eq("id", id);
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
