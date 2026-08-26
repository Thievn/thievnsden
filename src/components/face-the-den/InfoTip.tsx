"use client";

import { useState, type ReactNode } from "react";

export function InfoTip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center align-middle">
      <button
        type="button"
        className="ftd-info peer"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
      >
        i
      </button>
      <span
        role="tooltip"
        className={`absolute z-40 left-1/2 -translate-x-1/2 top-[calc(100%+10px)] w-[min(19rem,78vw)] rounded-2xl border border-rose-900/40 bg-[#0c0709]/97 p-3.5 text-left text-[12px] leading-relaxed text-neutral-300 shadow-[0_18px_50px_-18px_rgba(185,28,92,0.55)] backdrop-blur-md transition-all ${
          open
            ? "visible opacity-100 translate-y-0"
            : "invisible opacity-0 -translate-y-1 md:peer-hover:visible md:peer-hover:opacity-100 md:peer-hover:translate-y-0 md:peer-focus-visible:visible md:peer-focus-visible:opacity-100"
        }`}
      >
        {children}
      </span>
    </span>
  );
}
