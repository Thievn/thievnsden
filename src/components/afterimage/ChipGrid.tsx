"use client";

import { useMemo, useState, type ReactNode } from "react";
import { groupOpts, type Opt } from "@/lib/afterimage";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function FieldHead({
  label,
  hint,
  action,
}: {
  label: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-2">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-fuchsia-200/70">{label}</p>
        {hint ? <p className="text-[12px] text-neutral-500 mt-0.5">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ChipGrid({
  label,
  hint,
  options,
  value,
  onChange,
  allowEmpty = true,
  emptyLabel = "Any",
  variant = "chip",
  searchable,
}: {
  label: string;
  hint?: string;
  options: Opt[];
  value: string;
  onChange: (id: string) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
  variant?: "chip" | "card" | "swatch" | "heat";
  searchable?: boolean;
}) {
  const [q, setQ] = useState("");
  const showSearch = searchable ?? options.length > 14;
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(s) ||
        o.group?.toLowerCase().includes(s) ||
        o.id.includes(s),
    );
  }, [options, q]);
  const groups = groupOpts(filtered);

  return (
    <div className="space-y-2">
      <FieldHead
        label={label}
        hint={hint}
        action={
          showSearch ? (
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter"
              className="w-28 sm:w-36 px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 text-[12px] text-neutral-200 placeholder:text-neutral-600"
            />
          ) : undefined
        }
      />
      {groups.map(({ group, items }, index) => (
        <div key={group || "all"} className="space-y-2">
          {group ? (
            <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-600 pt-1">{group}</p>
          ) : null}
          <div
            className={cx(
              variant === "swatch" && "flex flex-wrap gap-2.5",
              variant === "chip" && "flex flex-wrap gap-2",
              variant === "heat" && "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2",
              variant === "card" && "grid grid-cols-2 sm:grid-cols-3 gap-2",
            )}
          >
            {allowEmpty && index === 0 ? (
              <Choice
                variant={variant}
                selected={!value}
                label={emptyLabel}
                onClick={() => onChange("")}
              />
            ) : null}
            {items.map((opt) => (
              <Choice
                key={opt.id}
                variant={variant}
                selected={value === opt.id}
                label={opt.label}
                emoji={opt.emoji}
                swatch={opt.swatch}
                wash={opt.wash}
                onClick={() => onChange(opt.id)}
              />
            ))}
          </div>
        </div>
      ))}
      {filtered.length === 0 ? (
        <p className="text-[12px] text-neutral-600">Nothing matches that filter.</p>
      ) : null}
    </div>
  );
}

function Choice({
  variant,
  selected,
  label,
  emoji,
  swatch,
  wash,
  onClick,
}: {
  variant: "chip" | "card" | "swatch" | "heat";
  selected: boolean;
  label: string;
  emoji?: string;
  swatch?: string;
  wash?: string;
  onClick: () => void;
}) {
  const selectedRing = selected
    ? "border-fuchsia-300/80 text-white shadow-[0_0_0_1px_rgba(240,171,252,0.35)]"
    : "border-white/10 text-neutral-300 hover:border-fuchsia-400/30 hover:text-white";

  if (variant === "swatch") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        title={label}
        className="group flex flex-col items-center gap-1 min-w-[3.25rem]"
      >
        <span
          className={cx(
            "h-9 w-9 rounded-full border-2 transition-transform",
            selected ? "border-white scale-110" : "border-white/20 group-hover:scale-105",
          )}
          style={{ background: swatch || "#222" }}
        />
        <span className={cx("text-[10px] leading-tight", selected ? "text-fuchsia-100" : "text-neutral-500")}>
          {label}
        </span>
      </button>
    );
  }

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={cx(
          "relative overflow-hidden rounded-2xl border px-3 py-3 text-left transition-all ai-choice",
          "bg-gradient-to-br",
          wash || "from-white/5 to-black/40",
          selectedRing,
          selected && "ai-choice-on",
        )}
      >
        <span className="text-xl leading-none">{emoji || "•"}</span>
        <span className="mt-2 block text-[13px] font-medium tracking-tight">{label}</span>
      </button>
    );
  }

  if (variant === "heat") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={cx(
          "rounded-2xl border px-3 py-3 text-left transition-all",
          selected ? "bg-rose-950/50" : "bg-black/30",
          selectedRing,
        )}
      >
        <span className="text-lg">{emoji}</span>
        <span className="mt-1 block text-[13px] font-medium">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] transition-all",
        selected ? "bg-fuchsia-950/70" : "bg-black/35",
        selectedRing,
      )}
    >
      {emoji ? <span className="text-[13px] leading-none">{emoji}</span> : null}
      {label}
    </button>
  );
}

export function ShuffleBtn({ onClick, label = "Shuffle" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] uppercase tracking-[0.16em] text-amber-200/80 hover:text-amber-100"
    >
      {label}
    </button>
  );
}
