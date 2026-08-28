"use client";

import { useId } from "react";

/** Wide cave mouth — ragged roof, open floor. Not a circle, arch, or mountain. */
const CAVE =
  "M1.6 19.8 L3.2 14.1 L6.8 11.2 L11.2 12.6 L15.8 9.4 L20.2 11.8 L24.8 9.1 L29.2 12.4 L33.6 10.8 L36.6 14.4 L38.2 19.8 Z";
const CAVE_INNER =
  "M7.4 18.2 L8.6 14.6 L11.4 13 L15 14.2 L18.4 12 L21.8 13.8 L25.2 12.2 L28.4 14 L31.4 13.2 L33 15.2 L33.6 18.2 Z";
const CAVE_EMBER =
  "M13.2 17.6 L15 15.4 L20.2 16 L25.4 15.2 L27.2 17.6 Z";

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
      <path d={CAVE} fill="#10080c" stroke={`url(#${ring})`} strokeWidth="1.55" strokeLinejoin="round" strokeLinecap="round" />
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
