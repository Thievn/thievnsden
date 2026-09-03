import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { userFromRequest } from "@/lib/auth-request";
import { normalizePost } from "@/lib/x-posts";
import { xThoughtHits } from "@/lib/x-thoughts";
import { hasRawUrl, upcomingSlots, wallParts, wantsArt, zernioScheduleStamp, type StudioKind } from "@/lib/x-studio";
import { loadCadence, studioStatus, zernioAccountFrom, zernioKeyFrom } from "@/lib/x-studio-server";
import { zernioPublish } from "@/lib/zernio";
import { postUrl } from "@/lib/x-posts";
import { xHandle } from "@/lib/x-api";

export const runtime = "nodejs";
export const maxDuration = 180;

function cronOk(req: NextRequest) {
  const secret = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  if (secret && auth === `Bearer ${secret}`) return true;
  if (req.headers.get("x-vercel-cron") === "1") return true;
  return false;
}

async function allowed(req: NextRequest) {
  if (cronOk(req)) return true;
  const user = await userFromRequest(req);
  return Boolean(user && isAdmin(user));
}

function originOf(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function generateDraft(req: NextRequest, recipe: Record<string, unknown>, kind: StudioKind) {
  const res = await fetch(`${originOf(req)}/api/admin/x-thoughts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...recipe, tweak: "fresh", post_type: kind === "mixed" ? "thought" : kind }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Draft failed");
  return data as { post: string; draft_id: string; hits?: { score: number }[] };
}

async function makeArt(req: NextRequest, post: string, recipe: Record<string, unknown>) {
  const res = await fetch(`${originOf(req)}/api/admin/x-thoughts/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      post,
      seed: recipe.seed,
      topic: recipe.topic,
      aspect: "16:9",
      look: "still",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { image: "", error: data.error || "Image failed" };
  return { image: String(data.image || ""), error: "" };
}

export async function POST(req: NextRequest) {
  if (!(await allowed(req))) return NextResponse.json({ error: "admin" }, { status: 401 });
  const { supabase, row, cadence } = await loadCadence();
  if (cadence.paused) return NextResponse.json({ ok: true, paused: true, ran: 0 });

  const now = new Date();
  const today = upcomingSlots(cadence, new Date(now.getTime() - 2 * 3600000), 16);
  const { data: existing } = await supabase.from("x_posts").select("*").limit(160);
  const posts = existing || [];
  const todayStamp = wallParts(now, cadence.timezone).stamp;
  const sentCount = posts.filter((p: any) => {
    if (p.status !== "sent" || !p.posted_at) return false;
    return wallParts(new Date(p.posted_at), cadence.timezone).stamp === todayStamp;
  }).length;

  const { data: thoughts } = await supabase.from("den_thoughts").select("id, title, excerpt").limit(40);
  const key = zernioKeyFrom(row);
  const z = await studioStatus(row);
  const accountId = z.account_id || zernioAccountFrom(row);
  const logs: string[] = [];
  let ran = 0;

  const takeQueued = (iso: string) =>
    posts.find((p: any) => {
      if (p.status !== "queued" || p.approved !== true) return false;
      if (!p.scheduled_for) return false;
      return Math.abs(new Date(p.scheduled_for).getTime() - new Date(iso).getTime()) < 3 * 60000;
    });

  for (const slot of today) {
    const due = new Date(slot.at).getTime() <= now.getTime() + 90000;
    const future = new Date(slot.at).getTime() > now.getTime() + 90000;
    const already = takeQueued(slot.at) || posts.find((p: any) => p.status === "sent" && p.scheduled_for && Math.abs(new Date(p.scheduled_for).getTime() - new Date(slot.at).getTime()) < 3 * 60000);
    if (already && already.status === "sent") continue;

    if (cadence.mode === "review") {
      if (!due) continue;
      const rowQ = takeQueued(slot.at);
      if (!rowQ) continue;
      if (sentCount + ran >= cadence.per_day) {
        logs.push("cap");
        break;
      }
      if (!key || !accountId) {
        logs.push("connect");
        continue;
      }
      try {
        const sent = await zernioPublish({
          key,
          accountId,
          content: rowQ.body,
          mediaUrls: rowQ.media_urls || [],
          publishNow: true,
        });
        await supabase
          .from("x_posts")
          .update({
            status: "sent",
            source: "zernio",
            posted_at: new Date().toISOString(),
            post_id: sent.post_id,
            url: sent.url || (sent.post_id ? postUrl(xHandle(), sent.post_id) : null),
            zernio_post_id: sent.zernio_post_id,
            fail_reason: null,
          })
          .eq("id", rowQ.id);
        ran += 1;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "failed";
        await supabase.from("x_posts").update({ status: "failed", fail_reason: message.slice(0, 280) }).eq("id", rowQ.id);
        logs.push(message.slice(0, 80));
      }
      continue;
    }

    // auto
    if (sentCount + ran >= cadence.per_day && due) {
      continue;
    }
    if (already) {
      if (due && already.status === "queued" && already.approved && key && accountId) {
        try {
          const sent = await zernioPublish({
            key,
            accountId,
            content: already.body,
            mediaUrls: already.media_urls || [],
            publishNow: true,
          });
          await supabase
            .from("x_posts")
            .update({
              status: "sent",
              source: "zernio",
              posted_at: new Date().toISOString(),
              post_id: sent.post_id,
              url: sent.url || null,
              zernio_post_id: sent.zernio_post_id,
              fail_reason: null,
            })
            .eq("id", already.id);
          ran += 1;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "failed";
          await supabase.from("x_posts").update({ status: "failed", fail_reason: message.slice(0, 280) }).eq("id", already.id);
        }
      }
      continue;
    }

    if (!due && !future) continue;
    const enabled = cadence.types;
    const kind = (enabled.includes("mixed") ? "mixed" : enabled[slot.index % enabled.length] || "thought") as StudioKind;
    const art = wantsArt(kind, enabled, slot.index);
    let draft: { post: string; draft_id: string; hits?: { score: number }[] };
    try {
      draft = await generateDraft(req, cadence.recipe as unknown as Record<string, unknown>, kind === "mixed" ? (art ? "art" : "thought") : kind);
    } catch (err: unknown) {
      logs.push(err instanceof Error ? err.message : "draft");
      continue;
    }
    const hits = xThoughtHits(draft.post, posts, thoughts || [], draft.draft_id);
    if (hits[0] && hits[0].score >= 0.58) {
      await supabase.from("x_posts").update({ status: "skipped", fail_reason: "near-duplicate" }).eq("id", draft.draft_id);
      logs.push("skip dup");
      continue;
    }
    if (posts.some((p: any) => normalizePost(p.body || "") === normalizePost(draft.post) && p.status === "sent")) {
      await supabase.from("x_posts").update({ status: "skipped", fail_reason: "same body" }).eq("id", draft.draft_id);
      continue;
    }
    if (hasRawUrl(draft.post)) {
      await supabase.from("x_posts").update({ status: "skipped", fail_reason: "url" }).eq("id", draft.draft_id);
      continue;
    }
    let media: string[] = [];
    if (art) {
      const pic = await makeArt(req, draft.post, cadence.recipe as unknown as Record<string, unknown>);
      if (pic.image) media = [pic.image];
      else logs.push(pic.error || "image");
    }
    const patch: Record<string, unknown> = {
      media_urls: media,
      scheduled_for: slot.at,
      post_type: art ? "art" : "thought",
      approved: true,
      status: "queued",
    };
    if (due && key && accountId) {
      try {
        const sent = await zernioPublish({ key, accountId, content: draft.post, mediaUrls: media, publishNow: true });
        Object.assign(patch, {
          status: "sent",
          source: "zernio",
          posted_at: new Date().toISOString(),
          post_id: sent.post_id,
          url: sent.url || (sent.post_id ? postUrl(xHandle(), sent.post_id) : null),
          zernio_post_id: sent.zernio_post_id,
        });
        ran += 1;
      } catch (err: unknown) {
        patch.status = "failed";
        patch.fail_reason = err instanceof Error ? err.message.slice(0, 280) : "failed";
      }
    } else if (future && key && accountId) {
      try {
        const scheduled = await zernioPublish({
          key,
          accountId,
          content: draft.post,
          mediaUrls: media,
          scheduledFor: zernioScheduleStamp(slot.at, cadence.timezone),
          timezone: cadence.timezone,
        });
        patch.zernio_post_id = scheduled.zernio_post_id;
      } catch (err: unknown) {
        patch.fail_reason = err instanceof Error ? err.message.slice(0, 280) : "schedule failed";
      }
    }
    await supabase.from("x_posts").update(patch).eq("id", draft.draft_id);
    posts.push({ id: draft.draft_id, body: draft.post, status: patch.status, scheduled_for: slot.at } as any);
  }

  return NextResponse.json({ ok: true, ran, logs, ready: z.ready });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
