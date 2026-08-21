import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";

const PRESETS: Record<
  string,
  { total: number; filters: Record<string, unknown>; label: string }
> = {
  varied_women: {
    total: 5,
    label: "5 varied women",
    filters: { gender: "woman" },
  },
  men_casual: {
    total: 5,
    label: "5 men",
    filters: { gender: "man" },
  },
  mirror_mix: {
    total: 5,
    label: "5 mirror selfies",
    filters: { camera: "mirror_selfie" },
  },
  mixed_10: {
    total: 10,
    label: "Mixed 10 (full random)",
    filters: {},
  },
};

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("seed_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json(
        {
          jobs: [],
          error: error.message,
          hint: "Create seed_jobs table — see docs/seed-queue-sql.md",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ jobs: data || [], presets: PRESETS });
  } catch (err: any) {
    return NextResponse.json({ jobs: [], error: err.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const preset = typeof body.preset === "string" ? body.preset : null;
    const presetDef = preset && PRESETS[preset] ? PRESETS[preset] : null;

    let total = Math.min(Math.max(Number(body.count) || 1, 1), 25);
    let filters: Record<string, unknown> = body.filters || {};
    let mode = body.mode === "filter" || body.mode === "preset" ? body.mode : "random";

    if (presetDef) {
      total = presetDef.total;
      filters = { ...presetDef.filters };
      mode = "preset";
    }

    // Strip empty filter values
    const cleanFilters: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== "" && v !== "random") {
        cleanFilters[k] = v;
      }
    }

    const makePublic = body.makePublic !== false;

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("seed_jobs")
      .insert({
        status: "pending",
        total,
        completed: 0,
        failed: 0,
        make_public: makePublic,
        mode,
        preset: preset || null,
        filters: cleanFilters,
        log: [
          {
            at: new Date().toISOString(),
            msg: `Queued ${total} demo(s) · mode=${mode}${preset ? ` · ${preset}` : ""}`,
          },
        ],
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint: "Run docs/seed-queue-sql.md in Supabase SQL editor",
        },
        { status: 500 }
      );
    }

    await writeAudit({
      action: "seed_queue_create",
      details: JSON.stringify({ id: data.id, total, mode, preset }),
    });

    // Kick the worker (fire-and-forget). Safe if it fails — client/cron can retry.
    const origin = req.nextUrl.origin;
    const secret =
      process.env.SEED_QUEUE_SECRET ||
      process.env.CRON_SECRET ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      "";
    fetch(`${origin}/api/admin/seeds/queue/process`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-seed-queue-secret": secret,
      },
      body: JSON.stringify({ jobId: data.id }),
    }).catch(() => {});

    return NextResponse.json({ success: true, job: data, presets: PRESETS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Queue failed" }, { status: 500 });
  }
}
