"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_GAMING_CONFIG,
  SEED_GAMING_ITEMS,
  slugify,
  type GamingConfig,
  type GamingItem,
} from "@/lib/gaming-data";
import { GamingCoverField } from "@/app/admin/GamingCoverField";

export function GamingCards() {
  const [config, setConfig] = useState<GamingConfig>(DEFAULT_GAMING_CONFIG);
  const [items, setItems] = useState<GamingItem[]>(SEED_GAMING_ITEMS);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/gaming");
      if (!res.ok) return;
      const data = await res.json();
      setConfig({ ...DEFAULT_GAMING_CONFIG, ...(data.config || {}) });
      if (Array.isArray(data.items)) setItems(data.items);
    })();
  }, []);

  const save = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/gaming", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          items: items.map((i) => ({ ...i, slug: i.slug || slugify(i.title) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMsg("Saved.");
      if (Array.isArray(data.items)) setItems(data.items);
    } catch (e: any) {
      setMsg(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {msg ? <p className="text-sm text-neutral-300">{msg}</p> : null}
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-neutral-800/80 bg-[#111] p-4 space-y-2">
          <input
            value={item.title}
            onChange={(e) =>
              setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, title: e.target.value } : i)))
            }
            className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
          />
          <textarea
            value={item.note}
            onChange={(e) =>
              setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, note: e.target.value } : i)))
            }
            rows={2}
            className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200"
          />
          <GamingCoverField
            item={item}
            onCover={(cover) =>
              setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, cover } : i)))
            }
          />
        </div>
      ))}
      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="w-full py-3 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white text-sm font-medium disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save gaming"}
      </button>
    </div>
  );
}
