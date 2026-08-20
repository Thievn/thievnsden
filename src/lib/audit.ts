import { createServiceClient } from "@/lib/supabase/server";

export async function writeAudit(params: {
  action: string;
  actor?: string | null;
  target?: string | null;
  details?: string | null;
}) {
  try {
    const supabase = createServiceClient();
    await supabase.from("audit_log").insert({
      action: params.action,
      actor: params.actor || "admin",
      target: params.target || null,
      details: params.details || null,
    });
  } catch (err) {
    console.error("Audit write failed:", err);
  }
}
