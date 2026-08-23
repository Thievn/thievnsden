"use client";

import { useMemo, useState } from "react";

export type Opt = { id: string; label: string; prompt?: string };

export function SearchSelect({
  label,
  hint,
  value,
  options,
  allowEmpty = true,
  emptyLabel = "None",
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  options: Opt[];
  allowEmpty?: boolean;
  emptyLabel?: string;
  onChange: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const chosen = options.find((o) => o.id === value);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = allowEmpty ? [{ id: "", label: emptyLabel }, ...options] : options;
    if (!s) return list.slice(0, 40);
    return list.filter((o) => o.label.toLowerCase().includes(s) || o.id.toLowerCase().includes(s)).slice(0, 40);
  }, [q, options, allowEmpty, emptyLabel]);

  return (
    <label className="block space-y-1">
      <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">{label}</span>
      {hint && <span className="block text-[11px] text-neutral-600 leading-snug">{hint}</span>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full text-left px-3 py-2 rounded-xl bg-[#0b0b0b] border border-neutral-800 text-sm text-neutral-200"
        >
          {chosen?.label || emptyLabel}
        </button>
        {open && (
          <div className="absolute z-30 mt-1 w-full rounded-xl border border-neutral-800 bg-[#0c0c0c] shadow-2xl">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              className="w-full px-3 py-2 bg-transparent border-b border-neutral-800 text-sm"
            />
            <div className="max-h-44 overflow-y-auto">
              {rows.map((o) => (
                <button
                  key={o.id || "empty"}
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                    setQ("");
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-fuchsia-950/40 ${
                    o.id === value ? "text-fuchsia-200" : "text-neutral-300"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </label>
  );
}
