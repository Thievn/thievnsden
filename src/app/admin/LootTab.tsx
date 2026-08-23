"use client";

import { useEffect, useMemo, useState } from "react";
import { LOOT_ITEMS } from "@/lib/loot-data";

export function LootTab() {
  const [covers, setCovers] = useState<Record<string, { image_url?: string }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  const groups = useMemo(() => {
    const map: Record<string, typeof LOOT_ITEMS> = {};
    LOOT_ITEMS.forEach((item) => {
      (map[item.category] ||= []).push(item);
    });
    return map;
  }, []);

  const load = async () => {
    const res = await fetch("/api/admin/loot");
    const data = await res.json();
    setCovers(data.covers || {});
  };

  useEffect(() => {
    load();
  }, []);

  const gen = async (id: string) => {
    setBusyId(id);
    setMsg("Shooting...");
    try {
      const res = await fetch("/api/admin/loot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, extra: notes[id] || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg("Saved");
      await load();
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-neutral-100 font-medium">Loot covers</p>
        <p className="text-xs text-neutral-500 mt-1">
          Realistic product shots from the item name + Amazon search. Cheap model. One click per card.
        </p>
        {msg && <p className="text-xs text-amber-200 mt-2">{msg}</p>}
      </div>
      {Object.entries(groups).map(([cat, items]) => (
        <section key={cat} className="space-y-3">
          <h2 className="text-xs uppercase tracking-wide text-neutral-500">{cat}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-neutral-800 bg-[#111] overflow-hidden">
                <div className="aspect-[4/3] bg-black">
                  {covers[item.id]?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={covers[item.id].image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[11px] text-neutral-600">No cover</div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-sm text-neutral-200">{item.name}</p>
                  <input
                    value={notes[item.id] || ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [item.id]: e.target.value }))}
                    placeholder="Optional extra (black case, RGB off...)"
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-xs"
                  />
                  <button
                    type="button"
                    disabled={!!busyId}
                    onClick={() => gen(item.id)}
                    className="w-full py-2 rounded-lg text-xs border border-neutral-700 text-neutral-200 disabled:opacity-40"
                  >
                    {busyId === item.id ? "Generating..." : covers[item.id]?.image_url ? "Regenerate" : "Generate photo"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
