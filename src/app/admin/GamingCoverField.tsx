"use client";

import { useState } from "react";
import type { GamingItem } from "@/lib/gaming-data";

export function GamingCoverField({
  item,
  onCover,
}: {
  item: GamingItem;
  onCover: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const generate = async () => {
    if (!item.title) return setErr("Title first");
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/gaming/cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          note: item.note,
          body: item.body,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cover failed");
      onCover(data.cover);
    } catch (e: any) {
      setErr(e.message || "Cover failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {item.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.cover} alt="" className="w-full h-28 object-cover rounded-xl border border-neutral-800" />
      ) : null}
      <div className="flex gap-2">
        <input
          type="url"
          value={item.cover || ""}
          onChange={(e) => onCover(e.target.value)}
          placeholder="Cover image URL"
          className="flex-1 px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
        />
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="shrink-0 px-3 py-2 rounded-xl text-[11px] border border-fuchsia-900/50 text-fuchsia-200 hover:bg-fuchsia-950/30 disabled:opacity-40"
        >
          {busy ? "Making…" : "Generate cover"}
        </button>
      </div>
      {err ? <p className="text-[11px] text-amber-300">{err}</p> : null}
    </div>
  );
}
