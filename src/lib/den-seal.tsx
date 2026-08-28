/** Satori cave mouth for favicon, PWA icons, OG. */
const CAVE =
  "M2.2 20 L2.6 8.6 L7.4 10.2 L12.2 7.8 L17.6 10.6 L22.4 7.4 L27.2 10.4 L32.4 8.2 L37.4 9.2 L37.8 20 Z";
const EMBER = "M12.8 17.4 L15.2 15.2 L20.2 15.8 L25.4 15 L27.6 17.4 Z";

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
        d={CAVE}
        fill="#14080e"
        stroke="url(#caveRing)"
        strokeWidth={sw}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d={EMBER} fill="url(#caveEmber)" />
    </svg>
  );
}
