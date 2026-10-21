"use client";

import { useEffect, useState } from "react";
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
import { shortDay, signedMoney } from "./format";
import { useReducedMotion } from "./motion";

function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div className="chart-frame" role="img" aria-label={label}>
      {ready ? children : <div className="skel skel-chart" />}
    </div>
  );
}

function Tip({
  active,
  label,
  text,
}: {
  active?: boolean;
  label?: string;
  text?: string;
}) {
  if (!active || !text) return null;
  return (
    <div className="tip">
      <span>{label}</span>
      <strong>{text}</strong>
    </div>
  );
}

export function DailyBars({ rows }: { rows: { day: string; usd: number }[] }) {
  const reduced = useReducedMotion();
  if (!rows.some((row) => row.usd !== 0)) {
    return <p className="quiet">No results yet.</p>;
  }
  return (
    <Frame label="Daily result, last two weeks">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={rows} margin={{ top: 12, right: 4, left: 0, bottom: 0 }}>
          <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fill: "#F2E6C9", fontSize: 11 }} axisLine={false} tickLine={false} interval={1} />
          <Tooltip cursor={{ fill: "rgba(242,230,201,0.04)" }} content={({ active, payload, label }) => (
            <Tip active={active} label={typeof label === "string" ? shortDay(label) : ""} text={signedMoney(Number(payload?.[0]?.value))} />
          )} />
          <Bar dataKey="usd" radius={[7, 7, 0, 0]} isAnimationActive={!reduced} maxBarSize={22}>
            {rows.map((row) => (
              <Cell key={row.day} fill={row.usd >= 0 ? "#7EBEAE" : "#C46B76"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Frame>
  );
}

export function EquityArea({ rows }: { rows: { time: string; usd: number }[] }) {
  const reduced = useReducedMotion();
  if (rows.length < 2) return <p className="quiet">Equity shows up after two closes.</p>;
  const data = rows.map((row) => ({
    ...row,
    label: new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "numeric", day: "numeric" }).format(new Date(row.time)),
  }));
  return (
    <Frame label="Equity">
      <ResponsiveContainer width="100%" height={230}>
        <AreaChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="equityGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4A24C" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#D4A24C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fill: "#F2E6C9", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis width={42} tick={{ fill: "#F2E6C9", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={({ active, payload, label }) => (
            <Tip active={active} label={String(label ?? "")} text={signedMoney(Number(payload?.[0]?.value))} />
          )} />
          <Area type="monotone" dataKey="usd" stroke="#D4A24C" fill="url(#equityGold)" strokeWidth={2.2} isAnimationActive={!reduced} />
        </AreaChart>
      </ResponsiveContainer>
    </Frame>
  );
}

export function FunnelBars({
  rows,
}: {
  rows: { name: string; value: number }[];
}) {
  if (!rows.some((row) => row.value > 0)) return <p className="quiet">No checks yet</p>;
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="funnel-list" role="img" aria-label="Checks by stage">
      {rows.map((row) => (
        <div key={row.name} className="funnel-row">
          <span>{row.name}</span>
          <div className="funnel-track" aria-hidden="true">
            <i style={{ width: `${Math.max(row.value === 0 ? 0 : 8, (row.value / max) * 100)}%` }} />
          </div>
          <b>{row.value}</b>
        </div>
      ))}
    </div>
  );
}

export function WinDonut({
  wins,
  losses,
  flat,
  rate,
}: {
  wins: number;
  losses: number;
  flat: number;
  rate: number | null;
}) {
  const reduced = useReducedMotion();
  const data = [
    { name: "Wins", value: wins, fill: "#7EBEAE" },
    { name: "Losses", value: losses, fill: "#C46B76" },
    { name: "Flat", value: flat, fill: "#3E4A5C" },
  ].filter((slice) => slice.value > 0);
  if (data.length === 0) return <p className="quiet">No closed trades yet</p>;
  return (
    <Frame label="Win rate">
      <div className="donut-wrap">
        <ResponsiveContainer width="100%" height={210}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={84} paddingAngle={3} stroke="none" isAnimationActive={!reduced}>
              {data.map((slice) => <Cell key={slice.name} fill={slice.fill} />)}
            </Pie>
            <Tooltip content={({ active, payload }) => (
              <Tip active={active} label={String(payload?.[0]?.name ?? "")} text={String(payload?.[0]?.value ?? "")} />
            )} />
          </PieChart>
        </ResponsiveContainer>
        <p className="donut-center">{rate === null ? "—" : `${Math.round(rate * 100)}%`}</p>
      </div>
    </Frame>
  );
}

export function BalanceArea({ rows }: { rows: { label: string; usd: number }[] }) {
  const reduced = useReducedMotion();
  if (rows.length < 2) return <p className="quiet">Check back after one more visit.</p>;
  return (
    <Frame label="Balance">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={rows} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8FCBB8" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#8FCBB8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fill: "#F2E6C9", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis width={42} tick={{ fill: "#F2E6C9", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={({ active, payload, label }) => (
            <Tip active={active} label={String(label ?? "")} text={signedMoney(Number(payload?.[0]?.value))} />
          )} />
          <Area type="monotone" dataKey="usd" stroke="#8FCBB8" fill="url(#balanceGold)" strokeWidth={2.2} isAnimationActive={!reduced} />
        </AreaChart>
      </ResponsiveContainer>
    </Frame>
  );
}
