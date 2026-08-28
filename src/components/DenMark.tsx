"use client";

import { useId } from "react";

/**
 * Cave mouth in a cliff: high walls, ragged ceiling, flat floor.
 * Reads as a hole, not mountains or an arch.
 */
const CAVE =
  "M2.2 20 L2.6 8.6 L7.4 10.2 L12.2 7.8 L17.6 10.6 L22.4 7.4 L27.2 10.4 L32.4 8.2 L37.4 9.2 L37.8 20 Z";
const CAVE_INNER =
  "M6.4 18.4 L6.8 11.2 L10.8 12.2 L14.6 10.4 L19 12.6 L23.2 10.2 L27.4 12.4 L31.4 11 L33.6 12 L33.8 18.4 Z";
const CAVE_EMBER =
  "M12.8 17.4 L15.2 15.2 L20.2 15.8 L25.4 15 L27.6 17.4 Z";

export function DenMark({
  className = "w-7 h-4",
  title = "Thievn's Den",
}: {
  className?: string;
  title?: string;
}) {
  const raw = useId().replace(/:/g, "");
  const ring = `${raw}-ring`;
  const ember = `${raw}-ember`;

  return (
    <svg
      viewBox="0 0 40 22"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={ring} x1="4" y1="8" x2="36" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="48%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id={ember} x1="16" y1="15" x2="26" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fecdd3" />
          <stop offset="50%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path d={CAVE} fill="#14080e" stroke={`url(#${ring})`} strokeWidth="1.55" strokeLinejoin="round" strokeLinecap="round" />
      <path d={CAVE_INNER} stroke={`url(#${ring})`} strokeWidth="0.8" strokeLinejoin="round" opacity="0.45" />
      <path d={CAVE_EMBER} fill={`url(#${ember})`} />
    </svg>
  );
}

export function DenMarkSplash({ className = "w-20 h-11" }: { className?: string }) {
  return (
    <span className={`relative inline-flex items-center justify-center den-seal-splash ${className}`}>
      <span className="pointer-events-none absolute inset-[-18%] den-seal-halo den-cave-clip" />
      <DenMark className="relative z-10 w-full h-full" title="" />
    </span>
  );
}
