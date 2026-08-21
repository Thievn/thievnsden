import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const action = body.action || "cancel";
    const supabase = createServiceClient();

    if (action === "cancel") {
      const { data: job } = await supabase
        .from("seed_jobs")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      const log = [
        ...(Array.isArray(job.log) ? job.log : []),
        { at: new Date().toISOString(), msg: "Cancelled by admin" },
      ].slice(-40);

      const { data, error } = await supabase
        .from("seed_jobs")
        .update({
          status: "cancelled",
          log,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await writeAudit({
        action: "seed_queue_cancel",
        details: id,
      });

      return NextResponse.json({ success: true, job: data });
    }

    if (action === "resume") {
      const { data: job } = await supabase
        .from("seed_jobs")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      const finished = (job.completed || 0) + (job.failed || 0);
      if (finished >= job.total) {
        return NextResponse.json({ error: "Job already finished" }, { status: 400 });
      }

      const log = [
        ...(Array.isArray(job.log) ? job.log : []),
        { at: new Date().toISOString(), msg: "Resumed by admin" },
      ].slice(-40);

      const { data, error } = await supabase
        .from("seed_jobs")
        .update({
          status: "pending",
          log,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

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
        body: JSON.stringify({ jobId: id }),
      }).catch(() => {});

      return NextResponse.json({ success: true, job: data });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
