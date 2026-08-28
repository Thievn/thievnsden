/** Satori cave mouth for favicon, PWA icons, OG. */
export function SatoriDenSeal({ size }: { size: number }) {
  const w = size;
  const h = Math.round(size * 0.55);
  const sw = Math.max(1.4, size * 0.045);
  return (
    <svg width={w} height={h} viewBox="0 0 40 22" fill="none">
      <defs>
        <linearGradient id="caveRing" x1="4" y1="8" x2="36" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="48%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="caveEmber" x1="16" y1="15" x2="26" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fecdd3" />
          <stop offset="50%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path
        d="M1.6 19.8 L3.2 14.1 L6.8 11.2 L11.2 12.6 L15.8 9.4 L20.2 11.8 L24.8 9.1 L29.2 12.4 L33.6 10.8 L36.6 14.4 L38.2 19.8 Z"
        fill="#10080c"
        stroke="url(#caveRing)"
        strokeWidth={sw}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M13.2 17.6 L15 15.4 L20.2 16 L25.4 15.2 L27.2 17.6 Z"
        fill="url(#caveEmber)"
      />
    </svg>
  );
}
