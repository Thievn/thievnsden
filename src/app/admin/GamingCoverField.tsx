"use client";

import { useState } from "react";
import type { GamingItem } from "@/lib/gaming-data";
import { CoverImage } from "@/components/gaming/CoverImage";

export function GamingCoverField({
  item,
  onCover,
}: {
  item: GamingItem;
  onCover: (url: string) => void;
}) {
  const [busy, setBusy] = useState<"rawg" | "gen" | "">("");
  const [err, setErr] = useState("");

  const run = async (kind: "rawg" | "gen") => {
    if (!item.title) return setErr("Title first");
    setBusy(kind);
    setErr("");
    try {
      const res = await fetch(kind === "rawg" ? "/api/admin/gaming/rawg-cover" : "/api/admin/gaming/cover", {
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
      setBusy("");
    }
  };

  return (
    <div className="space-y-2">
      {item.cover ? (
        <CoverImage src={item.cover} className="h-32 rounded-xl border border-neutral-800" imgClassName="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="h-24 rounded-xl border border-dashed border-neutral-800 bg-[#0a0a0a] flex items-center justify-center text-[11px] text-neutral-600">
          No cover yet
        </div>
      )}
      <input
        type="url"
        value={item.cover || ""}
        onChange={(e) => onCover(e.target.value)}
        placeholder="Cover URL (RAWG, Steam, or your own)"
        className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-xs text-neutral-300 focus:outline-none focus:border-neutral-600"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => run("rawg")}
          disabled={!!busy}
          className="flex-1 px-3 py-2 rounded-xl text-[11px] border border-violet-800/60 text-violet-200 hover:bg-violet-950/40 disabled:opacity-40"
        >
          {busy === "rawg" ? "Fetching…" : "From RAWG"}
        </button>
        <button
          type="button"
          onClick={() => run("gen")}
          disabled={!!busy}
          className="flex-1 px-3 py-2 rounded-xl text-[11px] border border-fuchsia-900/50 text-fuchsia-200 hover:bg-fuchsia-950/30 disabled:opacity-40"
        >
          {busy === "gen" ? "Making…" : "Generate"}
        </button>
      </div>
      {err ? <p className="text-[11px] text-amber-300">{err}</p> : null}
    </div>
  );
}
