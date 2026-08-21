import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 120;

function appendLog(log: any[], msg: string, extra?: Record<string, unknown>) {
  const entry = { at: new Date().toISOString(), msg, ...extra };
  const next = [...(Array.isArray(log) ? log : []), entry];
  return next.slice(-40);
}

function buildCustomFromFilters(filters: Record<string, unknown>) {
  if (!filters || Object.keys(filters).length === 0) return undefined;
  const custom: Record<string, unknown> = {};
  for (const key of [
    "gender",
    "ageBand",
    "ethnicity",
    "bodyType",
    "height",
    "expression",
    "hair",
    "camera",
    "pose",
    "setting",
    "outfit",
    "chest",
    "style",
    "focus",
    "filthyMode",
  ]) {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "") {
      custom[key] = filters[key];
    }
  }
  return Object.keys(custom).length ? custom : undefined;
}

async function runOneSeed(opts: {
  origin: string;
  makePublic: boolean;
  filters: Record<string, unknown>;
}) {
  const custom = buildCustomFromFilters(opts.filters);
  const res = await fetch(`${opts.origin}/api/admin/seeds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      count: 1,
      makePublic: opts.makePublic,
      custom,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || data.errors?.[0] || `Seed HTTP ${res.status}`);
  }
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const jobId = body.jobId as string | undefined;
    const supabase = createServiceClient();

    // Pick a job: explicit id, else oldest pending/running
    let job: any = null;
    if (jobId) {
      const { data } = await supabase.from("seed_jobs").select("*").eq("id", jobId).maybeSingle();
      job = data;
    } else {
      const { data } = await supabase
        .from("seed_jobs")
        .select("*")
        .in("status", ["pending", "running"])
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      job = data;
    }

    if (!job) {
      return NextResponse.json({ ok: true, done: true, reason: "no_jobs" });
    }

    if (job.status === "cancelled" || job.status === "completed") {
      return NextResponse.json({ ok: true, done: true, job });
    }

    const finished = (job.completed || 0) + (job.failed || 0);
    if (finished >= job.total) {
      const { data: updated } = await supabase
        .from("seed_jobs")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
          log: appendLog(job.log, "Job completed"),
        })
        .eq("id", job.id)
        .select("*")
        .single();
      return NextResponse.json({ ok: true, done: true, job: updated });
    }

    // Mark running
    await supabase
      .from("seed_jobs")
      .update({ status: "running", updated_at: new Date().toISOString() })
      .eq("id", job.id);

    const origin = req.nextUrl.origin;
    const makePublic = job.make_public !== false;
    const filters = (job.filters || {}) as Record<string, unknown>;

    let success = false;
    let lastError = "";
    let username = "";

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const result = await runOneSeed({ origin, makePublic, filters });
        username = result.results?.[0]?.username || "demo";
        success = true;
        break;
      } catch (err: any) {
        lastError = err.message || "failed";
        if (attempt === 1) {
          // brief pause then retry once
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }

    // Re-read in case cancelled mid-run
    const { data: fresh } = await supabase
      .from("seed_jobs")
      .select("*")
      .eq("id", job.id)
      .maybeSingle();

    if (!fresh || fresh.status === "cancelled") {
      return NextResponse.json({ ok: true, done: true, cancelled: true });
    }

    let completed = fresh.completed || 0;
    let failed = fresh.failed || 0;
    let log = fresh.log || [];

    if (success) {
      completed += 1;
      log = appendLog(log, `OK · ${username}`, { username });
    } else {
      failed += 1;
      log = appendLog(log, `FAIL · ${lastError}`, { error: lastError });
    }

    const allDone = completed + failed >= fresh.total;
    const { data: updated } = await supabase
      .from("seed_jobs")
      .update({
        completed,
        failed,
        log,
        status: allDone ? "completed" : "running",
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .select("*")
      .single();

    // Chain next item if more remain (works after tab close)
    if (!allDone && updated?.status !== "cancelled") {
      const secret =
        process.env.SEED_QUEUE_SECRET ||
        process.env.CRON_SECRET ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        "";
      // Small delay between seeds for API stability
      setTimeout(() => {
        fetch(`${origin}/api/admin/seeds/queue/process`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-seed-queue-secret": secret,
          },
          body: JSON.stringify({ jobId: job.id }),
        }).catch(() => {});
      }, 2000);
    }

    return NextResponse.json({
      ok: true,
      done: allDone,
      success,
      job: updated,
      error: success ? null : lastError,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Process failed" }, { status: 500 });
  }
}
