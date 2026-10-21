"use client";

import { CountUp } from "@/components/den/vault/motion";
import { plainMoney, signedMoney } from "@/components/den/vault/format";
import type { DeskStatusName } from "@/lib/desks/model";

const STATUS_LABEL: Record<DeskStatusName, string> = {
  running: "Running",
  paused: "Paused",
  halted: "Halted",
  error: "Error",
};

export function statusLabel(status: DeskStatusName): string {
  return STATUS_LABEL[status];
}

export function StatusPill({ status, fresh }: { status: DeskStatusName; fresh: boolean }) {
  return (
    <span className="status-row">
      <span className={`status-pill is-${status}`}>
        <i className={fresh ? "dot is-fresh" : "dot is-stale"} aria-hidden="true" />
        {statusLabel(status)}
      </span>
      {fresh ? null : <span className="stale">stale</span>}
    </span>
  );
}

export function Money({ value, count = false }: { value: number; count?: boolean }) {
  if (!Number.isFinite(value)) return <>—</>;
  if (!count) return <>{plainMoney(value)}</>;
  return <CountUp value={value} format={(next) => plainMoney(next) ?? "—"} />;
}

export function Pnl({ value, count = false }: { value: number | null; count?: boolean }) {
  if (value == null || !Number.isFinite(value)) return <span className="pnl flat">—</span>;
  const tone = value > 0 ? "up" : value < 0 ? "down" : "flat";
  return (
    <span className={`pnl ${tone}`}>
      {count ? <CountUp value={value} format={(next) => signedMoney(next)} /> : signedMoney(value)}
    </span>
  );
}
