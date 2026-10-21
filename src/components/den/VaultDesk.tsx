"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { Cluster, VaultPayload } from "@/lib/vault/types";
import {
  AlertsScreen,
  ChecksScreen,
  OverviewScreen,
  PositionsScreen,
  ReportsScreen,
  RunsScreen,
  TradesScreen,
} from "./DeskScreens";
import { ago } from "./vault/format";
import { useReducedMotion } from "./vault/motion";
import "./vault.css";

const WalletPanel = dynamic(() => import("./WalletPanel").then((mod) => mod.WalletPanel), {
  ssr: false,
  loading: () => <div className="glass skel-block" aria-hidden="true" />,
});

const SCREENS = [
  ["overview", "Overview"],
  ["alerts", "Alerts"],
  ["positions", "Positions"],
  ["checks", "Checks"],
  ["trades", "Trades"],
  ["reports", "Reports"],
  ["runs", "Runs"],
  ["wallet", "Wallet"],
] as const;

type Screen = (typeof SCREENS)[number][0];

export function VaultDesk() {
  const reduced = useReducedMotion();
  const [screen, setScreen] = useState<Screen>("overview");
  const [cluster, setCluster] = useState<Cluster>("mainnet-beta");
  const [data, setData] = useState<VaultPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acked, setAcked] = useState<Record<string, true>>({});
  const [pending, setPending] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async (silent: boolean) => {
    if (!silent) setLoading(true);
    try {
      const query = cluster === "devnet" ? "?cluster=devnet" : "";
      const response = await fetch(`/api/vault${query}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const body = await response.json() as VaultPayload | { ok: false; error?: string };
      if (!response.ok || !("source" in body)) {
        setError("error" in body && body.error ? body.error : "The vault did not answer.");
        return;
      }
      setData(body);
      setError(null);
      if (!body.allowDevnet && cluster !== "mainnet-beta") setCluster("mainnet-beta");
    } catch {
      setError("The vault did not answer.");
    } finally {
      setLoading(false);
      setNow(Date.now());
    }
  }, [cluster]);

  useEffect(() => {
    let stop = false;
    const run = (silent: boolean) => {
      if (!stop) void load(silent);
    };
    run(false);
    const timer = window.setInterval(() => {
      if (!document.hidden) run(true);
    }, 30_000);
    const onVisible = () => {
      if (!document.hidden) run(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stop = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  async function acknowledge(id: string) {
    if (id.startsWith("ex-")) {
      setAcked((current) => ({ ...current, [id]: true }));
      return;
    }
    setPending(id);
    try {
      const response = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action: "acknowledge", id }),
      });
      if (!response.ok) {
        setError("The mark did not take.");
        return;
      }
      setAcked((current) => ({ ...current, [id]: true }));
      void load(true);
    } catch {
      setError("The mark did not take.");
    } finally {
      setPending(null);
    }
  }

  const alerts = data?.alerts.map((alert) => acked[alert.id] ? { ...alert, acknowledged: true } : alert) ?? [];
  const urgent = alerts.filter((alert) => !alert.acknowledged && (alert.kind === "APPROVAL_NEEDED" || alert.kind === "SELL_NOW")).length;

  return (
    <div className={`vault-room ${reduced ? "is-still" : ""}`} data-vault>
      <header className="vault-head">
        <p className="eyebrow">The desk</p>
        <div className="row-between">
          <h1>The Vault</h1>
          {data?.overview.mode ? (
            <span className={data.overview.mode === "LIVE" ? "mode mode-live" : "mode mode-paper"}>{data.overview.mode}</span>
          ) : null}
        </div>
        {data?.source === "example" ? (
          <p className="example-banner">Preview sample. These desk rows were drawn for the preview and are not in the book.</p>
        ) : null}
        {data?.deskError ? <p className="desk-error" role="alert">{data.deskError}</p> : null}
        {error ? <p className="desk-error" role="alert">{error}</p> : null}
      </header>

      <div className="desk-nav" role="tablist" aria-label="Vault screens">
        {SCREENS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`desk-${id}`}
            aria-selected={screen === id}
            aria-controls={`desk-panel-${id}`}
            className={screen === id ? "is-on" : ""}
            data-screen={id}
            onClick={() => setScreen(id)}
          >
            {label}
            {id === "alerts" && urgent > 0 ? <span className="badge">{urgent}</span> : null}
          </button>
        ))}
      </div>

      <div className="desk-pane" id={`desk-panel-${screen}`} role="tabpanel" aria-labelledby={`desk-${screen}`} data-desk-screen={screen}>
        {loading && !data ? <Skeleton /> : null}
        {data && !data.deskError && screen === "overview" ? <OverviewScreen data={data} now={now} /> : null}
        {data && !data.deskError && screen === "alerts" ? (
          <AlertsScreen alerts={alerts} pending={pending} onAck={acknowledge} now={now} />
        ) : null}
        {data && !data.deskError && screen === "positions" ? <PositionsScreen data={data} now={now} /> : null}
        {data && !data.deskError && screen === "checks" ? <ChecksScreen data={data} /> : null}
        {data && !data.deskError && screen === "trades" ? <TradesScreen data={data} /> : null}
        {data && !data.deskError && screen === "reports" ? <ReportsScreen data={data} /> : null}
        {data && !data.deskError && screen === "runs" ? <RunsScreen data={data} now={now} /> : null}
        {data && screen === "wallet" ? (
          <WalletPanel data={data} cluster={cluster} onCluster={setCluster} onRefresh={() => void load(true)} />
        ) : null}
        {data?.deskError && screen !== "wallet" ? (
          <p className="empty glass">The book is not on the table, so these figures stay hidden.</p>
        ) : null}
      </div>

      <p className="fresh">
        {data ? `Updated ${ago(data.refreshedAt, now)} · ${data.cluster === "devnet" ? "Devnet" : "Mainnet"}` : "Opening the book"}
        <button type="button" className="text-btn" onClick={() => void load(true)}>Refresh</button>
      </p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="stat-grid" aria-hidden="true">
      <div className="glass skel-block" />
      <div className="glass skel-block" />
      <div className="glass skel-block" />
      <div className="glass skel-block" />
    </div>
  );
}
