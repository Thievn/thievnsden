"use client";

import { useId } from "react";
import { CAVE_GLOW, CAVE_INNER, CAVE_OUTER, CAVE_VIEWBOX } from "@/lib/cave-mark";

export function DenMark({
  className = "w-4 h-5",
  title = "Thievn's Den",
  draw = false,
}: {
  className?: string;
  title?: string;
  draw?: boolean;
}) {
  const raw = useId().replace(/:/g, "");
  const ring = `${raw}-ring`;
  const ember = `${raw}-ember`;

  return (
    <svg
      viewBox={CAVE_VIEWBOX}
      className={`${className}${draw ? " den-cave-draw" : ""}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={ring} x1="6" y1="6" x2="20" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="40%" stopColor="#be123c" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <radialGradient id={ember} cx="50%" cy="40%" r="62%">
          <stop offset="0%" stopColor="#fecdd3" />
          <stop offset="42%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#6b21a8" />
        </radialGradient>
      </defs>
      <path
        d={CAVE_OUTER}
        fill="none"
        stroke="#7c3aed"
        strokeWidth="3.1"
        strokeLinejoin="round"
        opacity="0.28"
      />
      <path
        d={CAVE_OUTER}
        className="den-cave-fill"
        fill="#1a0a10"
        stroke={`url(#${ring})`}
        strokeWidth="1.55"
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={100}
      />
      <path d={CAVE_INNER} className="den-cave-inner" fill="#050208" />
      <path d={CAVE_GLOW} className="den-cave-glow" fill={`url(#${ember})`} />
    </svg>
  );
}

export function DenMarkSplash({ className = "w-12 h-16" }: { className?: string }) {
  return (
    <span className={`relative inline-flex items-center justify-center den-seal-splash ${className}`}>
      <span className="pointer-events-none absolute inset-[-36%_-18%] den-seal-halo" />
      <DenMark className="relative z-10 w-full h-full" title="" draw />
    </span>
  );
}
