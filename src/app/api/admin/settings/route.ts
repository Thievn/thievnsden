import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const DEFAULTS = {
  maintenance_mode: false,
  maintenance_message: "The Den is closed for a bit. Come back soon.",
  announcement_enabled: false,
  announcement_text: "",
  age_gate_enabled: true,
  signup_enabled: true,
  roast_enabled: true,
  public_judgments_enabled: false,
};

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ settings: DEFAULTS, source: "defaults" });
    }

    return NextResponse.json({
      settings: { ...DEFAULTS, ...data },
      source: "db",
    });
  } catch {
    return NextResponse.json({ settings: DEFAULTS, source: "defaults" });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createServiceClient();

    const payload = {
      id: 1,
      maintenance_mode: !!body.maintenance_mode,
      maintenance_message:
        body.maintenance_message || DEFAULTS.maintenance_message,
      announcement_enabled: !!body.announcement_enabled,
      announcement_text: body.announcement_text || "",
      age_gate_enabled: body.age_gate_enabled !== false,
      signup_enabled: body.signup_enabled !== false,
      roast_enabled: body.roast_enabled !== false,
      public_judgments_enabled: !!body.public_judgments_enabled,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("site_settings")
      .upsert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: data, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
