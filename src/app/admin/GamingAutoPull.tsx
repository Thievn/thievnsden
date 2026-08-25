"use client";

import { useState } from "react";
import type { GamingConfig, GamingItem } from "@/lib/gaming-data";

export function GamingAutoPull({
  config,
  onConfig,
  onItems,
}: {
  config: GamingConfig;
  onConfig: (patch: Partial<GamingConfig>) => void;
  onItems: (items: GamingItem[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const pullNow = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/gaming/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          era: config.auto_pull_era,
          count: config.auto_pull_per_day,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pull failed");
      if (Array.isArray(data.items)) onItems(data.items);
      if (data.config) onConfig(data.config);
      setMsg(
        data.count
          ? `Added ${data.count}: ${data.added.join(", ")}`
          : "Nothing new to add."
      );
    } catch (e: any) {
      setMsg(e.message || "Pull failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">Daily auto pull</p>
      <label className="flex items-center justify-between gap-3">
        <span className="text-sm text-neutral-300">Add games automatically</span>
        <input
          type="checkbox"
          checked={!!config.auto_pull_enabled}
          onChange={(e) => onConfig({ auto_pull_enabled: e.target.checked })}
          className="w-4 h-4 accent-red-600"
        />
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="text-xs text-neutral-500">Pool</span>
          <select
            value={config.auto_pull_era || "current"}
            onChange={(e) =>
              onConfig({ auto_pull_era: e.target.value as GamingConfig["auto_pull_era"] })
            }
            className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
          >
            <option value="coming">Coming soon</option>
            <option value="current">Current / just out</option>
            <option value="classic">Older / classics</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-neutral-500">Games per day</span>
          <input
            type="number"
            min={1}
            max={8}
            value={config.auto_pull_per_day || 3}
            onChange={(e) => onConfig({ auto_pull_per_day: Number(e.target.value) || 3 })}
            className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
          />
        </label>
      </div>
      <p className="text-[11px] text-neutral-600 leading-relaxed">
        Coming soon goes to Watchlist. Current goes to Radar. Classics go to Library.
        First visitor of the day triggers the pull. Covers get saved to your storage so the public page can show them.
      </p>
      <button
        type="button"
        onClick={pullNow}
        disabled={busy}
        className="w-full py-2.5 rounded-xl text-sm border border-neutral-700 text-neutral-200 hover:bg-neutral-900 disabled:opacity-40"
      >
        {busy ? "Pulling…" : "Pull now"}
      </button>
      {config.auto_last_date ? (
        <p className="text-[11px] text-neutral-600">Last pull {config.auto_last_date}</p>
      ) : null}
      {msg ? <p className="text-xs text-neutral-300">{msg}</p> : null}
    </div>
  );
}
