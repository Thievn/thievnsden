"use client";

import { useEffect, useState } from "react";

/* Animated horizontal bar */
export function BarList({
  data,
  color = "from-red-500 to-purple-500",
}: {
  data: { label: string; value: number }[];
  color?: string;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, [data]);

  const max = Math.max(...data.map((d) => d.value), 1);

  if (data.length === 0) {
    return <p className="text-sm text-neutral-600">No data yet</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-400 capitalize">{d.label}</span>
            <span className="text-neutral-300 tabular-nums">{d.value}</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-900 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`}
              style={{ width: ready ? `${(d.value / max) * 100}%` : "0%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* Vertical bar chart for activity */
export function ActivityBars({
  data,
}: {
  data: { label: string; judgments: number; users: number }[];
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, [data]);

  const max = Math.max(...data.map((d) => Math.max(d.judgments, d.users)), 1);

  return (
    <div>
      <div className="flex items-end gap-1 h-36">
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <div className="w-full flex items-end justify-center gap-0.5 h-full">
              <div
                className="w-[40%] max-w-[10px] rounded-t bg-gradient-to-t from-red-700 to-red-400 transition-all duration-700 ease-out"
                style={{ height: ready ? `${(d.judgments / max) * 100}%` : "0%" }}
                title={`${d.judgments} judgments`}
              />
              <div
                className="w-[40%] max-w-[10px] rounded-t bg-gradient-to-t from-purple-700 to-purple-400 transition-all duration-700 ease-out delay-75"
                style={{ height: ready ? `${(d.users / max) * 100}%` : "0%" }}
                title={`${d.users} users`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-2">
        {data.map((d, i) => (
          <div key={d.label} className="flex-1 text-center">
            {(i === 0 || i === data.length - 1 || i % 3 === 0) && (
              <span className="text-[9px] text-neutral-600">{d.label}</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-[10px] text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-red-500" /> Judgments
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-purple-500" /> New users
        </span>
      </div>
    </div>
  );
}

/* Donut / ring for rarity */
export function RarityRing({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, [data]);

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const size = 140;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#171717"
          strokeWidth={stroke}
        />
        {data.map((d) => {
          const pct = d.value / total;
          const dash = pct * circumference;
          const currentOffset = offset;
          offset += dash;
          return (
            <circle
              key={d.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={stroke}
              strokeDasharray={`${ready ? dash : 0} ${circumference}`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ opacity: d.value > 0 ? 1 : 0.15 }}
            />
          );
        })}
      </svg>
      <div className="space-y-1.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
            <span className="text-neutral-400 w-20">{d.label}</span>
            <span className="text-neutral-200 tabular-nums">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Score distribution bars */
export function ScoreBars({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).map(([label, value]) => ({ label, value }));
  return (
    <BarList
      data={entries}
      color="from-purple-600 via-red-500 to-amber-400"
    />
  );
}
