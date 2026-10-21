"use client";

import { useState } from "react";
import { deskWhen, plainMoney, qty, tinyPrice } from "@/components/den/vault/format";
import type { DeskDetail, DeskSource } from "@/lib/desks/model";
import { Money, Pnl, StatusPill } from "./bits";
import { CoinMark } from "./CoinMark";
import { DailyChart, EquityChart, KillDonut, PriceSpark } from "./DeskCharts";

function nice(value: string): string {
  if (!value || value === "—") return "—";
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function slip(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

export function DeskBoard({
  detail,
  source,
  error,
}: {
  detail: DeskDetail;
  source: DeskSource;
  error: string | null;
}) {
  const [strategy, setStrategy] = useState("all");
  const [side, setSide] = useState("all");
  const trades = detail.trades.filter((trade) => {
    return (strategy === "all" || trade.strategy === strategy) && (side === "all" || trade.side === side);
  });
  const max = detail.maxExposure > 0 ? detail.maxExposure : 0;
  const pct = max > 0 ? Math.min(100, (detail.exposure / max) * 100) : 0;
  const over = max > 0 && detail.exposure > max;

  return (
    <div className="desk-page">
      <header className="desk-head">
        <a className="text-link" href="/desk">All desks</a>
        <div className="title-row">
          <CoinMark symbol={detail.mark} iconUrl={detail.iconUrl} size={48} />
          <div>
            <h1>{detail.name}</h1>
            <StatusPill status={detail.status} fresh={detail.fresh} />
          </div>
          <span className="paper-badge">PAPER</span>
        </div>
        {detail.venue ? <a className="text-link" href={`/desk/${detail.id}/settings`}>Settings</a> : null}
      </header>
      {source === "example" ? <p className="note-banner">Sample numbers, until a desk is connected.</p> : null}
      {detail.waiting ? <p className="note-banner">Venue data starts flowing shortly.</p> : null}
      {error ? <p className="warn-banner" role="alert">{error}</p> : null}

      <div className="stat-grid">
        <div className="stat"><span>Equity</span><strong><Money value={detail.equity} count /></strong></div>
        <div className="stat"><span>Cash</span><strong><Money value={detail.cash} count /></strong></div>
        <div className="stat"><span>In market</span><strong><Money value={detail.inMarket} count /></strong></div>
        <div className="stat"><span>Today</span><strong><Pnl value={detail.todayPnl} count /></strong></div>
        <div className="stat stat-wide">
          <span>Exposure</span>
          <strong>{plainMoney(detail.exposure)} of {plainMoney(detail.maxExposure)}</strong>
          <div
            className="meter"
            role="meter"
            aria-label="Exposure"
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={max > 0 ? Math.min(detail.exposure, max) : 0}
          >
            <span style={{ width: `${pct}%` }} />
          </div>
          {over ? <small className="using">Over the max.</small> : null}
        </div>
      </div>

      <EquityChart points={detail.equityCurve} />
      <DailyChart rows={detail.daily} />

      <section className="stack">
        <h2>Open positions</h2>
        {detail.positions.length === 0 ? <p className="quiet">No positions open.</p> : (
          <div className="pos-grid">
            {detail.positions.map((position) => (
              <article key={position.id} className="glass pad row-in">
                <div className="card-id">
                  <CoinMark symbol={position.symbol} iconUrl={position.iconUrl} size={32} />
                  <h3>{position.pair}</h3>
                  <Pnl value={position.pnl} />
                </div>
                <dl className="pos-stats">
                  <div><dt>Qty</dt><dd>{qty(position.qty)}</dd></div>
                  <div><dt>Cost</dt><dd>{plainMoney(position.cost)}</dd></div>
                  <div><dt>Price</dt><dd>{tinyPrice(position.price)}</dd></div>
                </dl>
                <PriceSpark
                  prices={position.prices}
                  entry={position.entry}
                  stop={position.stop}
                  target={position.target}
                  grids={position.grids}
                />
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="stack">
        <div className="row-between">
          <h2>Trades</h2>
          <div className="filters">
            <label>
              <span className="sr-only">Strategy</span>
              <select value={strategy} onChange={(event) => setStrategy(event.target.value)}>
                <option value="all">All strategies</option>
                {detail.strategies.map((item) => <option key={item} value={item}>{nice(item)}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Side</span>
              <select value={side} onChange={(event) => setSide(event.target.value)}>
                <option value="all">All sides</option>
                {detail.sides.map((item) => <option key={item} value={item}>{nice(item)}</option>)}
              </select>
            </label>
          </div>
        </div>
        {trades.length === 0 ? <p className="quiet">{detail.trades.length === 0 ? "No trades yet." : "Nothing matches that filter."}</p> : (
          <div className="table-wrap">
            <table className="as-cards">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Pair</th>
                  <th>Strategy</th>
                  <th>Side</th>
                  <th>$</th>
                  <th>Fee</th>
                  <th>Slippage</th>
                  <th>P&L</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} className="row-in">
                    <td data-label="Time">{deskWhen(trade.time)}</td>
                    <td data-label="Pair">
                      <span className="pair-cell">
                        <CoinMark symbol={trade.symbol} iconUrl={trade.iconUrl} size={20} />
                        {trade.pair}
                      </span>
                    </td>
                    <td data-label="Strategy">{nice(trade.strategy)}</td>
                    <td data-label="Side">{nice(trade.side)}</td>
                    <td data-label="$">{plainMoney(trade.usd)}</td>
                    <td data-label="Fee">{plainMoney(trade.fee)}</td>
                    <td data-label="Slippage">{slip(trade.slippage)}</td>
                    <td data-label="P&L"><Pnl value={trade.pnl} /></td>
                    <td data-label="Reason">{trade.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detail.id === "solana" ? (
        <>
          <KillDonut slices={detail.kills} />
          <section className="stack">
            <h2>Recent checks</h2>
            {detail.checks.length === 0 ? <p className="quiet">No checks yet.</p> : (
              <ul className="check-feed">
                {detail.checks.map((check) => (
                  <li key={check.id} className="row-in">
                    <span>{deskWhen(check.time)}</span>
                    <strong>{check.symbol || "—"}</strong>
                    <em>{check.stageLabel}</em>
                    <p>{check.reasonLabel}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
