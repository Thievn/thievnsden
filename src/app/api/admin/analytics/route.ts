import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function lastNDays(n: number) {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(dayKey(d));
  }
  return days;
}

function hostFromReferrer(ref: string | null) {
  if (!ref) return "Direct";
  try {
    const u = new URL(ref);
    return u.hostname.replace(/^www\./, "") || "Direct";
  } catch {
    return "Other";
  }
}

export async function GET(req: NextRequest) {
  try {
    const daysParam = Number(new URL(req.url).searchParams.get("days") || 14);
    const range = Math.min(Math.max(daysParam, 7), 90);
    const supabase = createServiceClient();

    const since = new Date();
    since.setDate(since.getDate() - range);

    const { data: views, error } = await supabase
      .from("page_views")
      .select("path, referrer, country, created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = views || [];
    const days = lastNDays(range);

    const byDay: Record<string, number> = {};
    days.forEach((d) => {
      byDay[d] = 0;
    });

    const pathCounts: Record<string, number> = {};
    const countryCounts: Record<string, number> = {};
    const referrerCounts: Record<string, number> = {};

    const today = dayKey(new Date());
    let todayViews = 0;

    rows.forEach((r) => {
      const d = dayKey(new Date(r.created_at));
      if (d in byDay) byDay[d]++;
      if (d === today) todayViews++;

      const path = r.path || "/";
      pathCounts[path] = (pathCounts[path] || 0) + 1;

      const country = r.country || "Unknown";
      countryCounts[country] = (countryCounts[country] || 0) + 1;

      const ref = hostFromReferrer(r.referrer);
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
    });

    const activity = days.map((d) => ({
      label: d.slice(5),
      date: d,
      views: byDay[d] || 0,
    }));

    const topPaths = Object.entries(pathCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const topCountries = Object.entries(countryCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const topReferrers = Object.entries(referrerCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Events (optional)
    const { data: events } = await supabase
      .from("analytics_events")
      .select("name")
      .gte("created_at", since.toISOString())
      .limit(2000);

    const eventCounts: Record<string, number> = {};
    (events || []).forEach((e) => {
      eventCounts[e.name] = (eventCounts[e.name] || 0) + 1;
    });

    return NextResponse.json({
      totalViews: rows.length,
      todayViews,
      activity,
      topPaths,
      topCountries,
      topReferrers,
      eventCounts,
      range,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}
