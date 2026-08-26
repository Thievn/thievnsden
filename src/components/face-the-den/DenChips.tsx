"use client";

import type { Opt } from "@/lib/face-the-den";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const SELECTED =
  "border-rose-300/70 text-white bg-rose-950/55 shadow-[0_0_0_1px_rgba(251,113,133,0.28)]";
const IDLE = "border-white/10 text-neutral-300 bg-black/35 hover:border-rose-400/35 hover:text-white";

export function DenField({
  label,
  hint,
  action,
}: {
  label: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-2.5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-rose-200/70">{label}</p>
        {hint ? <p className="text-[12px] text-neutral-500 mt-0.5">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function DenChips({
  label,
  hint,
  options,
  value,
  onChange,
  variant = "chip",
}: {
  label: string;
  hint?: string;
  options: Opt[];
  value: string;
  onChange: (id: string) => void;
  variant?: "chip" | "card" | "heat";
}) {
  return (
    <div>
      <DenField label={label} hint={hint} />
      <div
        className={cx(
          "w-full min-w-0",
          variant === "chip" && "flex flex-wrap gap-2",
          variant === "card" && "grid grid-cols-2 sm:grid-cols-3 gap-2",
          variant === "heat" && "grid grid-cols-2 sm:grid-cols-4 gap-2",
        )}
      >
        {options.map((opt) => {
          const selected = value === opt.id;
          if (variant === "card") {
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(opt.id)}
                className={cx(
                  "ftd-tap relative overflow-hidden rounded-2xl border px-2.5 sm:px-3 py-3 text-left bg-gradient-to-br min-w-0",
                  opt.wash || "from-white/5 to-black/40",
                  selected ? SELECTED : IDLE,
                )}
              >
                <span className="text-lg leading-none">{opt.emoji || "•"}</span>
                <span className="mt-1.5 block text-[13px] font-medium tracking-tight">{opt.label}</span>
                {opt.desc ? <span className="mt-0.5 block text-[11px] text-white/55 leading-snug break-words">{opt.desc}</span> : null}
              </button>
            );
          }
          if (variant === "heat") {
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(opt.id)}
                className={cx("ftd-tap rounded-2xl border px-2.5 sm:px-3 py-3 text-left min-w-0", selected ? SELECTED : IDLE)}
              >
                <span className="text-base">{opt.emoji}</span>
                <span className="mt-1 block text-[13px] font-medium">{opt.label}</span>
                {opt.desc ? <span className="mt-0.5 block text-[11px] text-neutral-500 break-words">{opt.desc}</span> : null}
              </button>
            );
          }
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(opt.id)}
              className={cx(
                "ftd-tap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px]",
                selected ? SELECTED : IDLE,
              )}
            >
              {opt.emoji ? <span className="text-[13px] leading-none">{opt.emoji}</span> : null}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
