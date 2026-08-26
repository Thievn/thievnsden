"use client";

import { useState, type ReactNode } from "react";

export function InfoTip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  const open = pinned || hover;

  return (
    <span
      className="relative inline-flex items-center align-middle"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <button
        type="button"
        className="ftd-info"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setPinned((v) => !v)}
        onBlur={() => setTimeout(() => setPinned(false), 160)}
      >
        i
      </button>
      <span
        role="tooltip"
        className={`absolute z-40 top-[calc(100%+10px)] left-auto right-0 w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-rose-900/40 bg-[#0c0709]/97 p-3.5 text-left text-[12px] leading-relaxed text-neutral-300 shadow-[0_18px_50px_-18px_rgba(185,28,92,0.55)] backdrop-blur-md transition-all ${
          open ? "visible opacity-100 translate-y-0" : "invisible opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
        {children}
      </span>
    </span>
  );
}
