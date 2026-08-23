"use client";

import { useEffect, useState } from "react";

type Row = { slug: string; label: string; hint?: string; parent_slug?: string; prompt?: string };

export function CatalogPick({
  kind,
  parent,
  value,
  placeholder,
  onPick,
}: {
  kind: string;
  parent?: string;
  value: string;
  placeholder: string;
  onPick: (row: Row) => void;
}) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => setQ(value), [value]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const params = new URLSearchParams({ kind, q });
      if (parent) params.set("parent", parent);
      const res = await fetch(`/api/afterimage/catalog?${params}`);
      const data = await res.json().catch(() => ({ rows: [] }));
      setRows(data.rows || []);
    }, 180);
    return () => clearTimeout(t);
  }, [kind, parent, q]);

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-2xl bg-[#0b0b0b] border border-neutral-800 text-sm"
      />
      {open && rows.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-neutral-800 bg-[#0c0c0c] shadow-xl">
          {rows.map((r) => (
            <button
              key={r.slug}
              type="button"
              onClick={() => {
                onPick(r);
                setQ(r.label);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-neutral-200 hover:bg-fuchsia-950/40"
            >
              {r.label}
              {r.hint && <span className="block text-[10px] text-neutral-500">{r.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
