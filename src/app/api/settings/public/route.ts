import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const DEFAULTS = {
  maintenance_mode: false,
  maintenance_message: "The Den is closed for a bit. Come back soon.",
  announcement_enabled: false,
  announcement_text: "",
  age_gate_enabled: true,
  signup_enabled: true,
  roast_enabled: true,
};

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("site_settings")
      .select(
        "maintenance_mode, maintenance_message, announcement_enabled, announcement_text, age_gate_enabled, signup_enabled, roast_enabled"
      )
      .eq("id", 1)
      .maybeSingle();

    return NextResponse.json({ settings: { ...DEFAULTS, ...(data || {}) } });
  } catch {
    return NextResponse.json({ settings: DEFAULTS });
  }
}
