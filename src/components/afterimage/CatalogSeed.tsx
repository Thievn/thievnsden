"use client";

import { useState } from "react";

export function CatalogSeed() {
  const [msg, setMsg] = useState("");
  const [label, setLabel] = useState("");
  const [kind, setKind] = useState("series");
  const [parent, setParent] = useState("");
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5 space-y-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500">Catalog</p>
      <button
        type="button"
        onClick={async () => {
          const res = await fetch("/api/admin/afterimage/catalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
          const data = await res.json();
          setMsg(data.error || `Seeded ${data.count} rows`);
        }}
        className="px-3 py-2 rounded-lg text-xs border border-neutral-700"
      >
        Seed series + characters
      </button>
      <div className="grid sm:grid-cols-3 gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm">
          <option value="series">Series</option>
          <option value="character">Character</option>
        </select>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name" className="px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm" />
        <input value={parent} onChange={(e) => setParent(e.target.value)} placeholder="Parent slug if character" className="px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm" />
      </div>
      <button
        type="button"
        onClick={async () => {
          const res = await fetch("/api/admin/afterimage/catalog", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "add", kind, label, parent_slug: parent }),
          });
          const data = await res.json();
          setMsg(data.error || `Added ${data.row?.label}`);
          setLabel("");
        }}
        className="px-3 py-2 rounded-lg text-xs border border-amber-800/50 text-amber-100"
      >
        Add row
      </button>
      {msg && <p className="text-xs text-fuchsia-200">{msg}</p>}
    </div>
  );
}
