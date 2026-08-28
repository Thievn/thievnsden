"use client";

import { useId } from "react";

/** Circular den seal — ember in a vault ring. Replaces the old keyhole. */
export function DenMark({
  className = "w-5 h-5",
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
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={ring} x1="8" y1="2" x2="24" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="48%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <radialGradient id={ember} cx="46%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#fecdd3" />
          <stop offset="42%" stopColor="#fb7185" />
          <stop offset="78%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#6b21a8" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="13.35" stroke={`url(#${ring})`} strokeWidth="1.65" />
      <circle cx="16" cy="16" r="10.15" stroke={`url(#${ring})`} strokeWidth="0.7" opacity="0.38" />
      <circle cx="16" cy="16" r="4.55" fill={`url(#${ember})`} />
      <circle cx="14.7" cy="14.35" r="1.15" fill="#fff" opacity="0.38" />
    </svg>
  );
}

/** Larger splash seal with a living halo. */
export function DenMarkSplash({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <span className={`relative inline-flex items-center justify-center den-seal-splash ${className}`}>
      <span className="pointer-events-none absolute inset-[-22%] rounded-full den-seal-halo" />
      <span className="pointer-events-none absolute inset-[-8%] rounded-full border border-rose-500/25 den-seal-spin" />
      <DenMark className="relative z-10 w-full h-full" title="" />
    </span>
  );
}
