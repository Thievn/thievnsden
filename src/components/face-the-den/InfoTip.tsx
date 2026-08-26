"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

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
  const btnRef = useRef<HTMLButtonElement>(null);
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) {
      setBox(null);
      return;
    }
    const place = () => {
      const r = btnRef.current?.getBoundingClientRect();
      if (!r) return;
      const gutter = 16;
      const width = Math.min(304, window.innerWidth - gutter * 2);
      let left = r.right - width;
      if (left < gutter) left = gutter;
      if (left + width > window.innerWidth - gutter) {
        left = window.innerWidth - gutter - width;
      }
      setBox({ top: r.bottom + 10, left, width });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  return (
    <span
      className="relative inline-flex items-center align-middle"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <button
        ref={btnRef}
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
        style={box ? { top: box.top, left: box.left, width: box.width } : undefined}
        className={`fixed z-50 rounded-2xl border border-rose-900/40 bg-[#0c0709]/97 p-3.5 text-left text-[12px] leading-relaxed text-neutral-300 shadow-[0_18px_50px_-18px_rgba(185,28,92,0.55)] backdrop-blur-md max-w-[calc(100vw-2rem)] ${
          open && box ? "opacity-100" : "hidden pointer-events-none"
        }`}
      >
        {children}
      </span>
    </span>
  );
}
