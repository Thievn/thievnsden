"use client";

import { useId } from "react";

/** Simple cave mouth — same rose/purple stroke as the old mark, not a circle or an arch. */
const CAVE =
  "M3.2 24.6 L4.8 17.2 L7.6 11.4 L11.4 14.1 L14.2 7.2 L18.1 11.2 L22.4 6.4 L26.2 12.8 L30.2 10.6 L32.6 17.4 L33.4 24.6 Z";
const CAVE_INNER =
  "M8.2 22.8 L9.4 17.6 L11.4 14.2 L14 16 L16.2 11.4 L18.8 14.4 L21.8 11.2 L24.4 15.6 L26.8 14.2 L28.2 18.2 L28.6 22.8 Z";
const CAVE_EMBER =
  "M12.4 21.8 L13.4 17.6 L16.2 18.4 L18.2 15.2 L20.8 18 L23.4 16.8 L24.2 21.8 Z";

export function DenMark({
  className = "w-6 h-5",
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
      viewBox="0 0 36 28"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={ring} x1="6" y1="6" x2="30" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="48%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id={ember} x1="14" y1="15" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fecdd3" />
          <stop offset="45%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path d={CAVE} stroke={`url(#${ring})`} strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
      <path
        d={CAVE_INNER}
        stroke={`url(#${ring})`}
        strokeWidth="0.85"
        strokeLinejoin="round"
        opacity="0.42"
      />
      <path d={CAVE_EMBER} fill={`url(#${ember})`} />
    </svg>
  );
}

/** Splash cave with a living glow. No circular rings. */
export function DenMarkSplash({ className = "w-[4.5rem] h-14" }: { className?: string }) {
  return (
    <span className={`relative inline-flex items-center justify-center den-seal-splash ${className}`}>
      <span className="pointer-events-none absolute inset-[-20%] den-seal-halo den-cave-clip" />
      <DenMark className="relative z-10 w-full h-full" title="" />
    </span>
  );
}
