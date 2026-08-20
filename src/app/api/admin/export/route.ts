import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ];
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const type = new URL(req.url).searchParams.get("type") || "judgments";
    const supabase = createServiceClient();

    if (type === "users") {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, created_at")
        .order("created_at", { ascending: false });

      const rows = await Promise.all(
        (profiles || []).map(async (p) => {
          let email = "";
          try {
            const { data } = await supabase.auth.admin.getUserById(p.id);
            email = data?.user?.email || "";
          } catch {
            // ignore
          }
          return {
            id: p.id,
            username: p.username,
            email,
            created_at: p.created_at,
          };
        })
      );

      await writeAudit({ action: "export_users", details: `${rows.length} rows` });

      return new NextResponse(toCsv(rows), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="thievnsden-users.csv"',
        },
      });
    }

    // judgments default
    const { data: judgments } = await supabase
      .from("judgments")
      .select("id, user_id, style, focus, filthy_mode, score, rarity, verdict, is_public, created_at")
      .order("created_at", { ascending: false });

    await writeAudit({
      action: "export_judgments",
      details: `${judgments?.length || 0} rows`,
    });

    return new NextResponse(toCsv(judgments || []), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="thievnsden-judgments.csv"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Export failed" }, { status: 500 });
  }
}
