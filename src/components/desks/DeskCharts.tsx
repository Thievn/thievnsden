"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { deskWhen, plainMoney, shortDay, signedMoney } from "@/components/den/vault/format";
import { useReducedMotion } from "@/components/den/vault/motion";
import { filterEquity, type Point } from "@/lib/desks/model";

const RANGES = ["1D", "1W", "All"] as const;
const SLICE = ["#D4A24C", "#7EBEAE", "#C46B76", "#9ECAE8", "#E6D8B8"];

function Tip({ active, label, text }: { active?: boolean; label?: string; text?: string }) {
  if (!active || !text) return null;
  return (
    <div className="tip">
      <span>{label}</span>
      <strong>{text}</strong>
    </div>
  );
}

function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="chart-frame draw-in" role="img" aria-label={label}>
      {children}
    </div>
  );
}

export function EquityChart({ points }: { points: Point[] }) {
  const reduced = useReducedMotion();
  const [range, setRange] = useState<(typeof RANGES)[number]>("1W");
  const shown = filterEquity(points, range, Date.now()).map((point) => ({
    ...point,
    label: deskWhen(point.t),
  }));
  return (
    <section className="stack">
      <div className="row-between">
        <h2>Equity</h2>
        <div className="range" role="tablist" aria-label="Equity range">
          {RANGES.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={range === item}
              onClick={() => setRange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      {shown.length < 2 ? <p className="quiet">Not enough marks in this range yet.</p> : (
        <Frame label={`Equity, ${range}`}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={shown} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="deskEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4A24C" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#D4A24C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fill: "#F2E6C9", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis width={52} tick={{ fill: "#F2E6C9", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip trigger="click" content={({ active, payload, label }) => (
                <Tip active={active} label={String(label ?? "")} text={plainMoney(Number(payload?.[0]?.value)) ?? ""} />
              )} />
              <Area type="monotone" dataKey="usd" stroke="#D4A24C" fill="url(#deskEquity)" strokeWidth={2.2} isAnimationActive={!reduced} />
            </AreaChart>
          </ResponsiveContainer>
        </Frame>
      )}
      <details className="chart-data">
        <summary>Equity numbers</summary>
        <ul>
          {shown.map((point) => <li key={point.t}>{point.label}: {plainMoney(point.usd)}</li>)}
        </ul>
      </details>
    </section>
  );
}

export function DailyChart({ rows }: { rows: { day: string; usd: number }[] }) {
  const reduced = useReducedMotion();
  if (!rows.some((row) => row.usd !== 0)) return <section><h2>Daily result</h2><p className="quiet">No results yet.</p></section>;
  return (
    <section className="stack">
      <h2>Daily result</h2>
      <Frame label="Daily result">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={rows} margin={{ top: 12, right: 4, left: 0, bottom: 0 }}>
            <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fill: "#F2E6C9", fontSize: 11 }} axisLine={false} tickLine={false} interval={1} />
            <Tooltip trigger="click" cursor={{ fill: "rgba(242,230,201,0.08)" }} content={({ active, payload, label }) => (
              <Tip active={active} label={typeof label === "string" ? shortDay(label) : ""} text={signedMoney(Number(payload?.[0]?.value))} />
            )} />
            <Bar dataKey="usd" radius={[7, 7, 0, 0]} isAnimationActive={!reduced} maxBarSize={28}>
              {rows.map((row) => <Cell key={row.day} fill={row.usd >= 0 ? "#7EBEAE" : "#C46B76"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Frame>
      <details className="chart-data">
        <summary>Daily numbers</summary>
        <ul>
          {rows.map((row) => <li key={row.day}>{shortDay(row.day)}: {signedMoney(row.usd)}</li>)}
        </ul>
      </details>
    </section>
  );
}

export function KillDonut({ slices }: { slices: { label: string; count: number }[] }) {
  const reduced = useReducedMotion();
  const data = slices.filter((slice) => slice.count > 0).map((slice, index) => ({
    ...slice,
    fill: SLICE[index % SLICE.length],
  }));
  const total = data.reduce((sum, slice) => sum + slice.count, 0);
  if (data.length === 0) return <section><h2>Kills by stage</h2><p className="quiet">No kills yet.</p></section>;
  return (
    <section className="stack">
      <h2>Kills by stage</h2>
      <Frame label="Kills by stage">
        <div className="donut-wrap">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="label" innerRadius={62} outerRadius={84} paddingAngle={3} stroke="none" isAnimationActive={!reduced}>
                {data.map((slice) => <Cell key={slice.label} fill={slice.fill} />)}
              </Pie>
              <Tooltip trigger="click" content={({ active, payload }) => (
                <Tip active={active} label={String(payload?.[0]?.name ?? "")} text={String(payload?.[0]?.value ?? "")} />
              )} />
            </PieChart>
          </ResponsiveContainer>
          <p className="donut-center">{total}</p>
        </div>
      </Frame>
      <ul className="kill-legend">
        {data.map((slice) => (
          <li key={slice.label}><i style={{ background: slice.fill }} />{slice.label}<b>{slice.count}</b></li>
        ))}
      </ul>
    </section>
  );
}

export function PriceSpark({
  prices,
  entry,
  stop,
  target,
  grids,
}: {
  prices: Point[];
  entry: number | null;
  stop: number | null;
  target: number | null;
  grids: number[];
}) {
  const [open, setOpen] = useState(false);
  const guides = [entry, stop, target, ...grids].filter((value): value is number => value != null && Number.isFinite(value));
  if (prices.length < 2 && guides.length === 0) return <p className="quiet">No price marks yet.</p>;
  const values = prices.map((point) => point.usd);
  const min = Math.min(...(values.length ? values : guides), ...guides);
  const max = Math.max(...(values.length ? values : guides), ...guides);
  const span = max - min || 1;
  const width = 280;
  const height = 88;
  const xAt = (index: number) => (prices.length <= 1 ? width / 2 : (index / (prices.length - 1)) * width);
  const yAt = (value: number) => 8 + (1 - (value - min) / span) * (height - 16);
  const path = prices.map((point, index) => `${index === 0 ? "M" : "L"}${xAt(index).toFixed(1)} ${yAt(point.usd).toFixed(1)}`).join(" ");
  const latest = prices.length > 0 ? prices[prices.length - 1] : null;
  return (
    <div className="spark-block">
      <button type="button" className="spark-hit" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span className="spark-draw">
          <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Price">
            {grids.map((level, index) => (
              <line key={`${level}-${index}`} x1="0" x2={width} y1={yAt(level)} y2={yAt(level)} stroke="rgba(242,230,201,0.28)" strokeWidth="1" />
            ))}
            {entry != null ? <line x1="0" x2={width} y1={yAt(entry)} y2={yAt(entry)} stroke="#E6D8B8" strokeDasharray="4 3" /> : null}
            {stop != null ? <line x1="0" x2={width} y1={yAt(stop)} y2={yAt(stop)} stroke="#F0B7BE" strokeDasharray="4 3" /> : null}
            {target != null ? <line x1="0" x2={width} y1={yAt(target)} y2={yAt(target)} stroke="#7EBEAE" strokeDasharray="4 3" /> : null}
            {path ? <path d={path} fill="none" stroke="#D4A24C" strokeWidth="2" strokeLinecap="round" /> : null}
          </svg>
        </span>
      </button>
      <p className="spark-legend">
        {entry != null ? <span>Entry {plainMoney(entry)}</span> : null}
        {stop != null ? <span>Stop {plainMoney(stop)}</span> : null}
        {target != null ? <span>Target {plainMoney(target)}</span> : null}
      </p>
      {open && latest ? <p className="spark-tip">Latest {plainMoney(latest.usd)} · {deskWhen(latest.t)}</p> : null}
    </div>
  );
}
