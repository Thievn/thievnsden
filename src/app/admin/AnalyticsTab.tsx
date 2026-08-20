"use client";

import { useEffect, useState } from "react";
import { BarList } from "@/components/admin/Charts";
import { ViewsActivity } from "@/components/admin/TrafficCharts";

type TrafficData = {
  totalViews: number;
  todayViews: number;
  activity: { label: string; views: number }[];
  topPaths: { label: string; value: number }[];
  topCountries: { label: string; value: number }[];
  topReferrers: { label: string; value: number }[];
  eventCounts: Record<string, number>;
  range: number;
};

export function AnalyticsTab() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/analytics?days=14");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed");
        setData(json);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Could not load analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading traffic…</p>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-5 text-sm text-red-300">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-4 sm:p-5">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-neutral-500 mb-1">
            Page views
          </p>
          <p className="text-xl sm:text-2xl font-semibold text-neutral-100 tabular-nums">
            {data.totalViews}
          </p>
          <p className="text-[10px] text-neutral-600 mt-1">Last {data.range} days</p>
        </div>
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-4 sm:p-5">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-neutral-500 mb-1">
            Today
          </p>
          <p className="text-xl sm:text-2xl font-semibold text-neutral-100 tabular-nums">
            {data.todayViews}
          </p>
          <p className="text-[10px] text-neutral-600 mt-1">Page views</p>
        </div>
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-4 sm:p-5 col-span-2 sm:col-span-1">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-neutral-500 mb-1">
            Top country
          </p>
          <p className="text-xl sm:text-2xl font-semibold text-neutral-100 truncate">
            {data.topCountries[0]?.label || "—"}
          </p>
          <p className="text-[10px] text-neutral-600 mt-1">
            {data.topCountries[0]?.value ?? 0} views
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5">
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-4">
          Views · last {data.range} days
        </p>
        {data.activity.some((d) => d.views > 0) ? (
          <ViewsActivity data={data.activity} />
        ) : (
          <p className="text-sm text-neutral-600">
            No page views yet. Browse the site (not /admin) after deploy to start collecting.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5">
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-4">Top pages</p>
          <BarList data={data.topPaths} color="from-red-600 to-red-400" />
        </div>
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5">
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-4">Countries</p>
          <BarList data={data.topCountries} color="from-purple-600 to-purple-400" />
        </div>
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5">
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-4">Referrers</p>
          <BarList data={data.topReferrers} color="from-rose-600 to-amber-400" />
        </div>
      </div>

      {Object.keys(data.eventCounts).length > 0 && (
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5">
          <p className="text-xs uppercase tracking-wide text-neutral-500 mb-4">Events</p>
          <BarList
            data={Object.entries(data.eventCounts).map(([label, value]) => ({
              label,
              value,
            }))}
            color="from-red-500 to-purple-500"
          />
        </div>
      )}
    </div>
  );
}
