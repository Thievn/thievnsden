"use client";

import { useState, type FormEvent } from "react";
import { plainMoney } from "@/components/den/vault/format";
import type { Settings } from "@/lib/desks/clamp";
import { CHAINS, DESKS, PAIRS, type ChainId, type DeskId, type PairId } from "@/lib/desks/ids";
import type { SettingsUsing, WalletView } from "@/lib/desks/model";
import { looksLikeSecret } from "@/lib/desks/secrets";

function moneyHint(actual: number | undefined, entered: number): string | null {
  if (actual == null || !Number.isFinite(entered) || Math.abs(actual - entered) < 0.001) return null;
  return `Using ${plainMoney(actual)}`;
}

function boolHint(actual: boolean | undefined, entered: boolean): string | null {
  if (actual == null || actual === entered) return null;
  return actual ? "Using on" : "Using off";
}

function samePairs(actual: PairId[] | undefined, entered: PairId[]): boolean {
  if (!actual) return true;
  return [...actual].sort().join() === [...entered].sort().join();
}

function PaperLock() {
  return (
    <label className="paper-lock">
      <input type="checkbox" defaultChecked disabled />
      <span>🔒 Paper only. Live trading is not built.</span>
    </label>
  );
}

function LaterKeys() {
  return (
    <section className="glass pad stack">
      <h2>Exchange API keys</h2>
      <form onSubmit={(event) => event.preventDefault()}>
        <fieldset disabled>
          <p>Coming later.</p>
          <p>When this exists, use a trade-only key, leave withdrawals off, lock it to an IP allowlist, and rotate it every 90 days.</p>
          <label className="field">Key<input autoComplete="off" placeholder="Coming later" /></label>
          <label className="field">Secret<input type="password" autoComplete="off" placeholder="Coming later" /></label>
          <button type="button">Coming later</button>
        </fieldset>
      </form>
    </section>
  );
}

export function DeskSettings({
  deskId,
  venue,
  settings,
  settingsSaved,
  using,
  wallets,
  error,
}: {
  deskId: DeskId;
  venue: boolean;
  settings: Settings;
  settingsSaved: boolean;
  using: SettingsUsing;
  wallets: WalletView[];
  error: string | null;
}) {
  const meta = DESKS[deskId];
  const locked = !venue;
  const [form, setForm] = useState(settings);
  const [applied, setApplied] = useState(using);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [savedWallets, setSavedWallets] = useState(wallets);
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState<ChainId>("solana");
  const [label, setLabel] = useState("");
  const [walletMessage, setWalletMessage] = useState("");

  function patch(next: Partial<Settings>) {
    setForm((current) => ({ ...current, ...next }));
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (locked) return;
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action: "desk-settings", deskId, settings: form }),
      });
      const body = await response.json() as {
        ok?: boolean;
        error?: string;
        settings?: Settings;
        using?: SettingsUsing | null;
        notice?: string;
      };
      if (!body.ok || !body.settings) {
        setMessage(body.error ?? "Couldn't save that.");
        return;
      }
      setForm(body.settings);
      setApplied(body.using ?? {});
      setMessage(body.notice ?? "Saved.");
    } catch {
      setMessage("Couldn't save that.");
    } finally {
      setPending(false);
    }
  }

  async function onWallet(event: FormEvent) {
    event.preventDefault();
    if (looksLikeSecret(address)) {
      setAddress("");
      setWalletMessage("That looks like a private key or seed. Paste a public address.");
      return;
    }
    setPending(true);
    setWalletMessage("");
    try {
      const response = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action: "desk-wallet", deskId, address, chain, label }),
      });
      const body = await response.json() as {
        ok?: boolean;
        error?: string;
        clear?: boolean;
        notice?: string;
        wallets?: WalletView[] | null;
      };
      if (body.clear) setAddress("");
      if (!body.ok) {
        setWalletMessage(body.error ?? "Couldn't save that.");
        return;
      }
      if (body.wallets) {
        setSavedWallets(body.wallets);
        setAddress("");
        setLabel("");
      }
      setWalletMessage(body.notice ?? "Address saved.");
    } catch {
      setWalletMessage("Couldn't save that.");
    } finally {
      setPending(false);
    }
  }

  async function onRemove(id: string) {
    setWalletMessage("");
    const response = await fetch("/api/vault", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ action: "desk-wallet-remove", deskId, id }),
    });
    const body = await response.json() as { ok?: boolean; error?: string; wallets?: WalletView[] };
    if (!body.ok) {
      setWalletMessage(body.error ?? "Couldn't save that.");
      return;
    }
    if (body.wallets) setSavedWallets(body.wallets);
  }

  const pairNote = samePairs(applied.pairs, form.pairs) ? null : `Using ${applied.pairs?.join(", ") || "none"}`;

  return (
    <div className="desk-page">
      <header className="desk-head">
        <a className="text-link" href={`/desk/${deskId}`}>{meta.name}</a>
        <h1>{meta.name} settings</h1>
        <span className="paper-badge">PAPER</span>
      </header>
      {error ? <p className="warn-banner" role="alert">{error}</p> : null}
      {locked ? <p className="note-banner">Solana&apos;s rules live on the desk box. You can look, not edit.</p> : null}
      {!settingsSaved && !locked ? <p className="quiet">Nothing saved for this desk yet.</p> : null}

      <form className="stack" onSubmit={onSave}>
        {message ? <p className="note-banner" role="status">{message}</p> : null}
        <section className="glass pad stack">
          <label className="check-row">
            <input
              type="checkbox"
              checked={form.enabled}
              disabled={locked}
              onChange={(event) => patch({ enabled: event.target.checked })}
            />
            <span>Desk enabled</span>
          </label>
          {boolHint(applied.enabled, form.enabled) ? <small className="using">{boolHint(applied.enabled, form.enabled)}</small> : null}
          <label className="field">
            <span>Starting balance</span>
            <input inputMode="decimal" min={10} max={10000} step="0.01" disabled={locked} value={form.starting_balance_usd} onChange={(event) => patch({ starting_balance_usd: Number(event.target.value) })} />
            {moneyHint(applied.starting_balance_usd, form.starting_balance_usd) ? <small className="using">{moneyHint(applied.starting_balance_usd, form.starting_balance_usd)}</small> : null}
          </label>
          <label className="field">
            <span>Per trade</span>
            <input inputMode="decimal" min={1} max={500} step="0.01" disabled={locked} value={form.per_trade_usd} onChange={(event) => patch({ per_trade_usd: Number(event.target.value) })} />
            {moneyHint(applied.per_trade_usd, form.per_trade_usd) ? <small className="using">{moneyHint(applied.per_trade_usd, form.per_trade_usd)}</small> : null}
          </label>
          <label className="field">
            <span>Daily loss halt</span>
            <input inputMode="decimal" min={1} max={1000} step="0.01" disabled={locked} value={form.daily_loss_halt_usd} onChange={(event) => patch({ daily_loss_halt_usd: Number(event.target.value) })} />
            {moneyHint(applied.daily_loss_halt_usd, form.daily_loss_halt_usd) ? <small className="using">{moneyHint(applied.daily_loss_halt_usd, form.daily_loss_halt_usd)}</small> : null}
          </label>
          <label className="field">
            <span>Max exposure</span>
            <input inputMode="decimal" min={1} max={10000} step="0.01" disabled={locked} value={form.max_exposure_usd} onChange={(event) => patch({ max_exposure_usd: Number(event.target.value) })} />
            {moneyHint(applied.max_exposure_usd, form.max_exposure_usd) ? <small className="using">{moneyHint(applied.max_exposure_usd, form.max_exposure_usd)}</small> : null}
          </label>
          <fieldset className="pair-set">
            <legend>Pairs</legend>
            <div className="pair-picks">
              {PAIRS.map((pair) => (
                <button
                  key={pair}
                  type="button"
                  aria-pressed={form.pairs.includes(pair)}
                  disabled={locked}
                  onClick={() => patch({
                    pairs: form.pairs.includes(pair) ? form.pairs.filter((item) => item !== pair) : [...form.pairs, pair],
                  })}
                >
                  {pair}
                </button>
              ))}
            </div>
            {pairNote ? <small className="using">{pairNote}</small> : null}
          </fieldset>
          <PaperLock />
          {locked ? null : <button className="turn" type="submit" disabled={pending}>Save settings</button>}
        </section>

        <section className="glass pad stack">
          <h2>DCA</h2>
          <label className="check-row">
            <input type="checkbox" checked={form.dca.enabled} disabled={locked} onChange={(event) => patch({ dca: { ...form.dca, enabled: event.target.checked } })} />
            <span>DCA on</span>
          </label>
          {boolHint(applied.dca?.enabled, form.dca.enabled) ? <small className="using">{boolHint(applied.dca?.enabled, form.dca.enabled)}</small> : null}
          <label className="field">
            <span>Hours between buys</span>
            <input inputMode="numeric" min={1} max={168} step={1} disabled={locked} value={form.dca.interval_hours} onChange={(event) => patch({ dca: { ...form.dca, interval_hours: Number(event.target.value) } })} />
            {moneyHint(applied.dca?.interval_hours, form.dca.interval_hours) ? <small className="using">Using {applied.dca?.interval_hours}</small> : null}
          </label>
          <label className="field">
            <span>Take profit %</span>
            <input inputMode="decimal" min={0.5} max={100} step="0.1" disabled={locked} value={form.dca.take_profit_pct} onChange={(event) => patch({ dca: { ...form.dca, take_profit_pct: Number(event.target.value) } })} />
            {moneyHint(applied.dca?.take_profit_pct, form.dca.take_profit_pct) ? <small className="using">Using {applied.dca?.take_profit_pct}%</small> : null}
          </label>
          <label className="field">
            <span>Max buys per pair</span>
            <input inputMode="numeric" min={1} max={50} step={1} disabled={locked} value={form.dca.max_buys_per_pair} onChange={(event) => patch({ dca: { ...form.dca, max_buys_per_pair: Number(event.target.value) } })} />
            {moneyHint(applied.dca?.max_buys_per_pair, form.dca.max_buys_per_pair) ? <small className="using">Using {applied.dca?.max_buys_per_pair}</small> : null}
          </label>
        </section>

        <section className="glass pad stack">
          <h2>Grid</h2>
          <label className="check-row">
            <input type="checkbox" checked={form.grid.enabled} disabled={locked} onChange={(event) => patch({ grid: { ...form.grid, enabled: event.target.checked } })} />
            <span>Grid on</span>
          </label>
          {boolHint(applied.grid?.enabled, form.grid.enabled) ? <small className="using">{boolHint(applied.grid?.enabled, form.grid.enabled)}</small> : null}
          <label className="field">
            <span>Width %</span>
            <input inputMode="decimal" min={2} max={50} step="0.1" disabled={locked} value={form.grid.width_pct} onChange={(event) => patch({ grid: { ...form.grid, width_pct: Number(event.target.value) } })} />
            {moneyHint(applied.grid?.width_pct, form.grid.width_pct) ? <small className="using">Using {applied.grid?.width_pct}%</small> : null}
          </label>
          <label className="field">
            <span>Levels</span>
            <input inputMode="numeric" min={2} max={40} step={1} disabled={locked} value={form.grid.levels} onChange={(event) => patch({ grid: { ...form.grid, levels: Number(event.target.value) } })} />
            {moneyHint(applied.grid?.levels, form.grid.levels) ? <small className="using">Using {applied.grid?.levels}</small> : null}
          </label>
          <label className="field">
            <span>Max lots per pair</span>
            <input inputMode="numeric" min={1} max={40} step={1} disabled={locked} value={form.grid.max_lots_per_pair} onChange={(event) => patch({ grid: { ...form.grid, max_lots_per_pair: Number(event.target.value) } })} />
            {moneyHint(applied.grid?.max_lots_per_pair, form.grid.max_lots_per_pair) ? <small className="using">Using {applied.grid?.max_lots_per_pair}</small> : null}
          </label>
        </section>
      </form>

      {meta.fees ? (
        <section className="glass pad stack">
          <h2>Fees</h2>
          <p>{meta.fees.maker} maker / {meta.fees.taker} taker.{meta.fees.assumption ? " Assumption, until the fee schedule is confirmed." : ""}</p>
        </section>
      ) : null}

      <section className="glass pad stack">
        <h2>Wallets</h2>
        <p>Watch only. Paste a public address.</p>
        {savedWallets.length === 0 ? <p className="quiet">No wallets yet.</p> : (
          <ul className="wallet-list">
            {savedWallets.map((wallet) => (
              <li key={wallet.id}>
                <span><strong>{wallet.label}</strong> · {wallet.chain}</span>
                <code>{wallet.address}</code>
                <button type="button" onClick={() => onRemove(wallet.id)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
        <form className="stack" onSubmit={onWallet}>
          <label className="field">
            <span>Public address</span>
            <input
              value={address}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => {
                const next = event.target.value;
                if (looksLikeSecret(next)) {
                  setAddress("");
                  setWalletMessage("That looks like a private key or seed. Paste a public address.");
                  return;
                }
                setAddress(next);
              }}
            />
          </label>
          <label className="field">
            <span>Chain</span>
            <select value={chain} onChange={(event) => setChain(event.target.value as ChainId)}>
              {CHAINS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Label</span>
            <input value={label} maxLength={40} onChange={(event) => setLabel(event.target.value)} />
          </label>
          <button className="turn" type="submit" disabled={pending}>Save address</button>
          <p role="status">{walletMessage}</p>
        </form>
      </section>

      {venue ? <LaterKeys /> : null}
    </div>
  );
}
