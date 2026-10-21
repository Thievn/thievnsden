"use client";

import { useMemo, useState } from "react";
import type { AlertRow, CheckRow, Stage, VaultPayload, Verdict } from "@/lib/vault/types";
import { DailyBars, EquityArea, FunnelBars, WinDonut } from "./vault/Charts";
import { ago, kindLabel, liq, nyClock, openFor, plainMoney, qty, shortAddress, shortDay, signedMoney, tinyPrice } from "./vault/format";
import { CountUp, Spark } from "./vault/motion";

const STAGES: Array<Stage | "all"> = ["all", "limits", "facts", "pool", "grok"];
const VERDICTS: Array<Verdict | "all"> = ["all", "BUY", "SKIP"];

function tone(value: number) {
  if (value > 0) return "pnl-up";
  if (value < 0) return "pnl-down";
  return "";
}

export function OverviewScreen({ data, now }: { data: VaultPayload; now: number }) {
  const { overview } = data;
  const lossPct = Math.min(100, data.haltUsd === 0 ? 0 : (overview.dailyLossUsd / data.haltUsd) * 100);
  return (
    <div className="stack">
      <div className="stat-grid">
        <article className="glass stat">
          <p className="stat-kicker">Today</p>
          <p className={`stat-value ${tone(overview.todayPnl)}`}>
            <CountUp value={overview.todayPnl} format={signedMoney} />
          </p>
          <Spark values={data.dailyPnl.map((row) => row.usd)} up={overview.todayPnl >= 0} />
          <p className="stat-note">New York day</p>
        </article>
        <article className="glass stat">
          <p className="stat-kicker">Open</p>
          <p className="stat-value">{overview.openCount}<span> / {data.maxOpen}</span></p>
          <p className="stat-note">Room for {Math.max(0, data.maxOpen - overview.openCount)} more</p>
        </article>
        <article className="glass stat">
          <p className="stat-kicker">Entries</p>
          <p className="stat-value">{overview.entriesToday}</p>
          <p className="stat-note">Opens since midnight</p>
        </article>
        <article className="glass stat">
          <p className="stat-kicker">Daily loss</p>
          <p className={`stat-value ${overview.dailyLossUsd > 0 ? "pnl-down" : ""}`}>
            <CountUp value={overview.dailyLossUsd} format={(value) => plainMoney(value)} />
          </p>
          <div className="meter" aria-hidden="true"><span style={{ width: `${lossPct}%` }} /></div>
          <p className="stat-note">Halt at {plainMoney(data.haltUsd, 0)}</p>
        </article>
      </div>

      <article className="glass pad">
        <div className="row-between">
          <h2>Daily result</h2>
          <p className="quiet">{overview.lastRun ? `${overview.lastRun.kind} ${overview.lastRun.status} · ${ago(overview.lastRun.ranAt, now)}` : "No run yet"}</p>
        </div>
        <DailyBars rows={data.dailyPnl} />
      </article>
    </div>
  );
}

export function AlertsScreen({
  alerts,
  pending,
  onAck,
  now,
}: {
  alerts: AlertRow[];
  pending: string | null;
  onAck: (id: string) => void;
  now: number;
}) {
  if (alerts.length === 0) return <p className="empty glass">No alerts waiting.</p>;
  const open = alerts.filter((alert) => !alert.acknowledged).length;
  return (
    <div className="stack">
      <p className="quiet">{open === 0 ? "All marked." : `${open} still open.`}</p>
      {alerts.map((alert) => {
        const urgent = !alert.acknowledged && (alert.kind === "APPROVAL_NEEDED" || alert.kind === "SELL_NOW");
        return (
          <article key={alert.id} className={`glass alert-card ${alert.kind === "SELL_NOW" ? "is-sell" : ""} ${urgent ? "is-urgent" : ""} ${alert.acknowledged ? "is-done" : ""}`}>
            <div className="row-between">
              <p className="kind">{kindLabel(alert.kind)}</p>
              <p className="quiet">{ago(alert.createdAt, now)}</p>
            </div>
            <h2>{alert.symbol ?? "Desk"}</h2>
            <p>{alert.text}</p>
            {alert.acknowledged ? (
              <p className="quiet">Marked.</p>
            ) : (
              <button className="ghost-btn" type="button" disabled={pending === alert.id} onClick={() => onAck(alert.id)}>
                {pending === alert.id ? "Marking" : "Acknowledge"}
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}

export function PositionsScreen({ data, now }: { data: VaultPayload; now: number }) {
  if (data.positions.length === 0) return <p className="empty glass">No open positions.</p>;
  return (
    <div className="stack">
      {data.positions.map((position) => (
        <article key={position.mint} className="glass pad">
          <div className="row-between">
            <h2>{position.symbol ?? shortAddress(position.mint)}</h2>
            <p className="quiet">{openFor(position.opened, now)}</p>
          </div>
          <dl className="facts">
            <div><dt>Entry</dt><dd>{tinyPrice(position.entry)}</dd></div>
            <div><dt>Peak</dt><dd>{tinyPrice(position.peak)}</dd></div>
            <div><dt>Qty</dt><dd>{qty(position.qty)}</dd></div>
            <div><dt>Started</dt><dd>{qty(position.qty0)}</dd></div>
            <div><dt>Steps</dt><dd>{position.steps}</dd></div>
            <div><dt>Liquidity</dt><dd>{liq(position.liq0)}</dd></div>
          </dl>
        </article>
      ))}
    </div>
  );
}

export function ChecksScreen({ data }: { data: VaultPayload }) {
  const [stage, setStage] = useState<(typeof STAGES)[number]>("all");
  const [verdict, setVerdict] = useState<(typeof VERDICTS)[number]>("all");
  const [query, setQuery] = useState("");
  const rows = useMemo(() => data.checks.filter((check) => {
    if (stage !== "all" && check.stage !== stage) return false;
    if (verdict !== "all" && check.verdict !== verdict) return false;
    if (!query.trim()) return true;
    const hay = `${check.symbol ?? ""} ${check.reason ?? ""} ${check.mint}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  }), [data.checks, query, stage, verdict]);
  const funnel = [
    { name: "Checked", value: data.funnel.checked },
    { name: "Limits", value: data.funnel.passedLimits },
    { name: "Facts", value: data.funnel.passedFacts },
    { name: "Pool", value: data.funnel.passedPool },
    { name: "Bought", value: data.funnel.bought },
  ];
  return (
    <div className="stack">
      <article className="glass pad">
        <div className="row-between">
          <h2>Gates</h2>
          <p className="quiet">Rows, not unique names</p>
        </div>
        <FunnelBars rows={funnel} />
      </article>
      <div className="filters">
        <div className="seg" role="group" aria-label="Stage">
          {STAGES.map((item) => (
            <button key={item} type="button" className={stage === item ? "is-on" : ""} onClick={() => setStage(item)}>{item}</button>
          ))}
        </div>
        <div className="seg" role="group" aria-label="Verdict">
          {VERDICTS.map((item) => (
            <button key={item} type="button" className={verdict === item ? "is-on" : ""} onClick={() => setVerdict(item)}>{item}</button>
          ))}
        </div>
        <label className="field">
          <span className="sr-only">Reason</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Reason or symbol" />
        </label>
      </div>
      {rows.length === 0 ? <p className="empty glass">Nothing matches.</p> : (
        <div className="stack">
          {rows.slice(0, 80).map((check) => <CheckCard key={check.id} check={check} />)}
          {rows.length > 80 ? <p className="quiet">Showing the latest 80 of {rows.length}.</p> : null}
        </div>
      )}
    </div>
  );
}

function CheckCard({ check }: { check: CheckRow }) {
  return (
    <article className="glass check-card">
      <div className="row-between">
        <p className="kind">{check.symbol ?? shortAddress(check.mint)}</p>
        <p className={check.verdict === "BUY" ? "pnl-up" : "quiet"}>{check.verdict}</p>
      </div>
      <p>{check.reason ?? "No reason written."}</p>
      <p className="quiet">{check.stage}{check.confidence !== null ? ` · ${Math.round(check.confidence * 100)}%` : ""} · {nyClock(check.time)} NY</p>
    </article>
  );
}

export function TradesScreen({ data }: { data: VaultPayload }) {
  const { winRate } = data;
  return (
    <div className="stack">
      <div className="split">
        <article className="glass pad">
          <h2>Equity</h2>
          <EquityArea rows={data.equity} />
        </article>
        <article className="glass pad donut-card">
          <h2>Closes</h2>
          <WinDonut wins={winRate.wins} losses={winRate.losses} flat={winRate.flat} rate={winRate.rate} />
          <p className="quiet">{winRate.wins} won · {winRate.losses} lost · {winRate.flat} flat</p>
        </article>
      </div>
      {data.trades.length === 0 ? <p className="empty glass">No trades yet.</p> : (
        <div className="stack">
          {data.trades.map((trade) => (
            <article key={trade.id} className="glass trade-card">
              <div>
                <p className="kind">{trade.action}</p>
                <h2>{trade.symbol ?? shortAddress(trade.mint)}</h2>
                <p className="quiet">{trade.reason ?? "—"} · {nyClock(trade.time)} NY</p>
              </div>
              <div className="trade-nums">
                <p>{plainMoney(trade.usd)}</p>
                <p className={tone(trade.pnl ?? 0)}>{signedMoney(trade.pnl ?? 0)}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReportsScreen({ data }: { data: VaultPayload }) {
  if (data.reports.length === 0) return <p className="empty glass">No daily report yet.</p>;
  return (
    <div className="stack">
      {data.reports.map((report) => (
        <article key={report.day} className="glass pad report">
          <div className="row-between">
            <h2>{shortDay(report.day)}</h2>
            {report.mode ? <span className={report.mode === "LIVE" ? "mode mode-live" : "mode mode-paper"}>{report.mode}</span> : null}
          </div>
          <p>{report.body}</p>
        </article>
      ))}
    </div>
  );
}

export function RunsScreen({ data, now }: { data: VaultPayload; now: number }) {
  if (data.runs.length === 0) return <p className="empty glass">No runs yet.</p>;
  return (
    <div className="stack">
      {data.runs.map((run) => (
        <article key={run.id} className="glass run-card">
          <span className={run.status === "ok" ? "run-dot ok" : "run-dot bad"} aria-hidden="true" />
          <div>
            <div className="row-between">
              <h2>{run.kind}</h2>
              <p className="quiet">{ago(run.ranAt, now)}</p>
            </div>
            <p className="quiet">{run.status}{run.error ? ` · ${run.error}` : ""}</p>
            {run.counts ? (
              <p className="chips">
                {Object.entries(run.counts).map(([key, value]) => <span key={key}>{key} {value}</span>)}
              </p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
