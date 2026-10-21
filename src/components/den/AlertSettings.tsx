"use client";

import { useEffect, useState } from "react";
import { PUSH_EVENTS, TEST_NOTICE, type PushEvent, type PushPrefs, defaultPushPrefs } from "@/lib/vault/push";

const LABELS: Record<PushEvent, string> = {
  paper_trade: "Paper trades",
  stop_loss: "Stop-loss",
  take_profit: "Take-profit",
  daily_loss: "Daily loss stop",
  grok_budget: "Grok budget",
  xai_error: "xAI trouble",
  desk_stopped: "Desk gone quiet",
  nightly_report: "Nightly report",
  approval_needed: "Approval needed",
  low_balance: "Low wallet",
};

type Notice = { title: string; body: string; url: string };

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) out[index] = raw.charCodeAt(index);
  return out;
}

async function post(body: unknown) {
  const response = await fetch("/api/vault", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({})) as { ok?: boolean; error?: string; preview?: Notice; stored?: boolean };
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || "Couldn't save that.");
  }
  return payload;
}

export function AlertSettings() {
  const [prefs, setPrefs] = useState<PushPrefs>(defaultPushPrefs);
  const [vapid, setVapid] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [sample, setSample] = useState<Notice | null>(null);

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.ready : null;
        const current = registration ? await registration.pushManager.getSubscription() : null;
        const state = await post({ action: "push-state", endpoint: current?.endpoint ?? null });
        if (stop) return;
        const next = state as { prefs?: PushPrefs; vapidPublicKey?: string | null; configured?: boolean };
        if (next.prefs) setPrefs(next.prefs);
        setVapid(next.vapidPublicKey ?? null);
        setConfigured(next.configured !== false);
      } catch (error) {
        if (!stop) setNote(error instanceof Error ? error.message : "Couldn't load alerts.");
      } finally {
        if (!stop) setReady(true);
      }
    })();
    return () => {
      stop = true;
    };
  }, []);

  async function persist(next: PushPrefs, action: "subscribe" | "push-prefs", subscription?: PushSubscription | null) {
    if (action === "subscribe" && subscription) {
      const json = subscription.toJSON();
      await post({ action, subscription: json, prefs: { ...next, alertsOn: true } });
      return;
    }
    const saved = await post({ action: "push-prefs", prefs: next });
    if (saved.stored === false) setNote("Turn on alerts to keep these on this phone.");
  }

  async function enable(next: PushPrefs) {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setNote("This browser can't do alerts.");
      return;
    }
    if (!vapid) {
      setNote("Alerts aren't set up on the server yet.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setNote("Alerts are blocked in the browser.");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid),
    });
    const enabled = { ...next, alertsOn: true };
    await persist(enabled, "subscribe", subscription);
    setPrefs(enabled);
    setNote("Alerts are on.");
  }

  async function disable() {
    const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.ready : null;
    const current = registration ? await registration.pushManager.getSubscription() : null;
    if (current) {
      const endpoint = current.endpoint;
      await current.unsubscribe();
      await post({ action: "unsubscribe", endpoint });
    }
    setPrefs((current) => ({ ...current, alertsOn: false }));
    setNote("Alerts are off.");
  }

  async function onMaster(on: boolean) {
    setBusy(true);
    setNote(null);
    try {
      if (on) await enable(prefs);
      else await disable();
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Couldn't save that.");
    } finally {
      setBusy(false);
    }
  }

  async function update(next: PushPrefs) {
    setPrefs(next);
    if (!prefs.alertsOn) return;
    setBusy(true);
    try {
      await persist(next, "push-prefs");
      setNote("Saved.");
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Couldn't save that.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setNote(null);
    try {
      const result = await post({ action: "push-test" });
      setSample(result.preview ?? TEST_NOTICE);
      setNote("Queued. The desk sends it on the next pass.");
    } catch (error) {
      setSample(TEST_NOTICE);
      setNote(error instanceof Error ? error.message : "Couldn't save that.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="alert-settings">
      <p className="eyebrow">Settings</p>
      <h1>Alerts</h1>
      <p className="alert-lead">Pings from the desk, on this phone.</p>
      {!configured ? <p className="desk-error">Alerts aren't saved yet.</p> : null}
      <div className="switch-row">
        <div>
          <b>Turn on alerts</b>
          <span>{ready ? "Paper fills, stops, and the quiet alarms." : "Loading…"}</span>
        </div>
        <button
          type="button"
          className="switch"
          role="switch"
          aria-checked={prefs.alertsOn}
          aria-label="Turn on alerts"
          disabled={!ready || busy}
          onClick={() => void onMaster(!prefs.alertsOn)}
        >
          <i />
        </button>
      </div>

      <div className={prefs.alertsOn ? "event-list" : "event-list is-dim"}>
        {PUSH_EVENTS.map((event) => (
          <div className="switch-row" key={event}>
            <b>{LABELS[event]}</b>
            <button
              type="button"
              className="switch"
              role="switch"
              aria-checked={prefs.events[event]}
              aria-label={LABELS[event]}
              disabled={!ready || busy}
              onClick={() => void update({
                ...prefs,
                events: { ...prefs.events, [event]: !prefs.events[event] },
              })}
            >
              <i />
            </button>
          </div>
        ))}
      </div>

      <div className="switch-row">
        <div>
          <b>Quiet hours</b>
          <span>Off by default. No pings from 10pm to 7am, New York time.</span>
        </div>
        <button
          type="button"
          className="switch"
          role="switch"
          aria-checked={prefs.quietHours}
          aria-label="Quiet hours"
          disabled={!ready || busy}
          onClick={() => void update({ ...prefs, quietHours: !prefs.quietHours })}
        >
          <i />
        </button>
      </div>

      <label className="balance-line">
        <span>Low wallet ping under</span>
        <input
          type="number"
          min={0}
          max={1000}
          step={0.01}
          inputMode="decimal"
          value={prefs.lowBalanceSol}
          aria-label="Low wallet threshold in SOL"
          disabled={!ready || busy}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (!Number.isFinite(value)) return;
            void update({ ...prefs, lowBalanceSol: value });
          }}
        />
        <span>SOL</span>
      </label>

      <button type="button" className="alert-test" disabled={!ready || busy} onClick={() => void sendTest()}>
        Send test notification
      </button>
      {note ? <p className="alert-note" role="status">{note}</p> : null}
      {sample ? (
        <article className="note-sample" aria-label="Sample notification">
          <img src="/icons/icon-192.png" alt="" width={44} height={44} />
          <div>
            <p className="note-app">{sample.title}</p>
            <p>{sample.body}</p>
          </div>
        </article>
      ) : null}
    </div>
  );
}
