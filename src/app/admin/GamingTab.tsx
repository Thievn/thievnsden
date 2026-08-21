"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_GAMING_CONFIG,
  SEED_GAMING_ITEMS,
  type GamingConfig,
  type GamingItem,
  type GamingKind,
  type GamingStatus,
} from "@/lib/gaming-data";

const KINDS: GamingKind[] = [
  "playing",
  "radar",
  "drama",
  "season",
  "watchlist",
  "library",
];

const STATUSES: GamingStatus[] = [
  "playing",
  "hype",
  "dropped",
  "avoid",
  "season",
  "watch",
  "library",
];

function emptyItem(): GamingItem {
  return {
    id: `item-${Date.now()}`,
    kind: "playing",
    title: "",
    note: "",
    status: "playing",
    meta: "",
    cover: "",
    sort: 100,
    published: true,
  };
}

export function GamingTab() {
  const [config, setConfig] = useState<GamingConfig>(DEFAULT_GAMING_CONFIG);
  const [items, setItems] = useState<GamingItem[]>(SEED_GAMING_ITEMS);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/gaming");
    if (res.ok) {
      const data = await res.json();
      setConfig({ ...DEFAULT_GAMING_CONFIG, ...(data.config || {}) });
      setItems(Array.isArray(data.items) ? data.items : SEED_GAMING_ITEMS);
    }
    setLoaded(true);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/gaming", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, items }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.hint || "Save failed");
      }
      setMsg("Gaming settings saved.");
      if (data.config) setConfig({ ...DEFAULT_GAMING_CONFIG, ...data.config });
      if (Array.isArray(data.items)) setItems(data.items);
    } catch (err: any) {
      setMsg(err.message || "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  const updateItem = (id: string, patch: Partial<GamingItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const removeItem = (id: string) => {
    if (!confirm("Remove this card?")) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  if (!loaded) {
    return <p className="text-sm text-neutral-500">Loading gaming…</p>;
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div
          className={`px-3 py-2.5 rounded-lg text-sm border ${
            msg.includes("saved")
              ? "bg-green-950/30 border-green-900/40 text-green-400"
              : "bg-red-950/40 border-red-900/50 text-red-300"
          }`}
        >
          {msg}
        </div>
      )}

      <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-4">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Page copy</p>
        <label className="block space-y-1">
          <span className="text-xs text-neutral-500">Hero line</span>
          <input
            type="text"
            value={config.hero_line}
            onChange={(e) => setConfig((c) => ({ ...c, hero_line: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-neutral-500">Currently line (override auto)</span>
          <input
            type="text"
            value={config.currently_line}
            onChange={(e) =>
              setConfig((c) => ({ ...c, currently_line: e.target.value }))
            }
            className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-5 space-y-4">
        <p className="text-xs uppercase tracking-wide text-neutral-500">Release radar (RAWG)</p>
        <p className="text-xs text-neutral-600">
          Get a free key at rawg.io/apidocs. Stored in site settings. Never shown to visitors.
        </p>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm text-neutral-300">Enable radar</span>
          <input
            type="checkbox"
            checked={config.radar_enabled}
            onChange={(e) =>
              setConfig((c) => ({ ...c, radar_enabled: e.target.checked }))
            }
            className="w-4 h-4 accent-red-600"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-neutral-500">RAWG API key</span>
          <input
            type="password"
            value={config.rawg_api_key}
            onChange={(e) =>
              setConfig((c) => ({ ...c, rawg_api_key: e.target.value }))
            }
            placeholder="Paste key or leave blank"
            className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600 font-mono"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs text-neutral-500">Platforms (RAWG ids)</span>
            <input
              type="text"
              value={config.radar_platforms}
              onChange={(e) =>
                setConfig((c) => ({ ...c, radar_platforms: e.target.value }))
              }
              placeholder="4 = PC"
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-neutral-500">Page size</span>
            <input
              type="number"
              min={1}
              max={20}
              value={config.radar_page_size}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  radar_page_size: Number(e.target.value) || 8,
                }))
              }
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
            />
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Cards</p>
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, emptyItem()])}
            className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-300 hover:text-white"
          >
            Add card
          </button>
        </div>

        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-neutral-800/80 bg-[#111] p-4 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateItem(item.id, { title: e.target.value })}
                placeholder="Title"
                className="px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
              />
              <input
                type="text"
                value={item.meta || ""}
                onChange={(e) => updateItem(item.id, { meta: e.target.value })}
                placeholder="Meta (season, date…)"
                className="px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600"
              />
            </div>
            <textarea
              value={item.note}
              onChange={(e) => updateItem(item.id, { note: e.target.value })}
              rows={2}
              placeholder="Den note"
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 focus:outline-none focus:border-neutral-600 resize-none"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select
                value={item.kind}
                onChange={(e) =>
                  updateItem(item.id, { kind: e.target.value as GamingKind })
                }
                className="px-2 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-xs text-neutral-300"
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <select
                value={item.status}
                onChange={(e) =>
                  updateItem(item.id, { status: e.target.value as GamingStatus })
                }
                className="px-2 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-xs text-neutral-300"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={item.sort}
                onChange={(e) =>
                  updateItem(item.id, { sort: Number(e.target.value) || 0 })
                }
                className="px-2 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-xs text-neutral-300"
                title="Sort"
              />
              <label className="flex items-center gap-2 text-xs text-neutral-400 px-1">
                <input
                  type="checkbox"
                  checked={item.published !== false}
                  onChange={(e) =>
                    updateItem(item.id, { published: e.target.checked })
                  }
                  className="accent-red-600"
                />
                Published
              </label>
            </div>
            <input
              type="url"
              value={item.cover || ""}
              onChange={(e) => updateItem(item.id, { cover: e.target.value })}
              placeholder="Cover image URL (optional)"
              className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
            />
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="text-xs text-red-400/90 hover:text-red-300"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="w-full py-3 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white text-sm font-medium disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save gaming"}
      </button>

      <p className="text-[11px] text-neutral-600 leading-relaxed">
        Requires <code className="text-neutral-500">gaming_config</code> and{" "}
        <code className="text-neutral-500">gaming_items</code> JSON columns on{" "}
        <code className="text-neutral-500">site_settings</code>. See docs/gaming-sql.md.
        Until then the public page uses seed cards.
      </p>
    </div>
  );
}
