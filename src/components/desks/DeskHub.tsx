"use client";

import { CoinMark } from "./CoinMark";
import { Money, Pnl, StatusPill } from "./bits";
import type { DeskSource, HubCard } from "@/lib/desks/model";

function CardSpark({ values, up }: { values: number[]; up: boolean }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const path = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 120;
    const y = 36 - ((value - min) / span) * 28;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  return (
    <span className="spark-draw" aria-hidden="true">
      <svg className="mini-spark" viewBox="0 0 120 40">
        <path d={path} fill="none" stroke={up ? "#7EBEAE" : "#F0B7BE"} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function DeskHub({
  cards,
  source,
  error,
}: {
  cards: HubCard[];
  source: DeskSource;
  error: string | null;
}) {
  return (
    <div className="desk-page">
      <header className="desk-head">
        <p className="eyebrow"><i className="verd-dot" /> Desks</p>
        <h1>Desks</h1>
      </header>
      {source === "example" ? <p className="note-banner">Sample numbers, until a desk is connected.</p> : null}
      {error ? <p className="warn-banner" role="alert">{error}</p> : null}
      <div className="desk-grid">
        {cards.map((card) => (
          <article key={card.id} className="desk-card glass">
            <span className="paper-badge">PAPER</span>
            <div className="card-id">
              <CoinMark symbol={card.mark} iconUrl={card.iconUrl} size={48} />
              <div>
                <h2>{card.name}</h2>
                <StatusPill status={card.status} fresh={card.fresh} />
              </div>
            </div>
            <dl className="card-stats">
              <div>
                <dt>Equity</dt>
                <dd><Money value={card.equity} count /></dd>
              </div>
              <div>
                <dt>Today</dt>
                <dd><Pnl value={card.todayPnl} count /></dd>
              </div>
            </dl>
            <p className="open-count">
              <span>{card.openCount} open</span>
              <span className="mark-row">
                {card.marks.map((mark) => (
                  <CoinMark key={mark.symbol} symbol={mark.symbol} iconUrl={mark.iconUrl} size={20} />
                ))}
              </span>
            </p>
            <CardSpark values={card.spark.map((point) => point.usd)} up={card.todayPnl >= 0} />
            <a className="open-desk" href={`/desk/${card.id}`}>Open desk</a>
          </article>
        ))}
      </div>
    </div>
  );
}
