import { CAVE_GLOW, CAVE_INNER, CAVE_OUTER, CAVE_VIEWBOX } from "@/lib/cave-mark";

/** Square-safe cave for favicon, PWA icons, and OG. */
export function SatoriDenSeal({ size }: { size: number }) {
  const caveH = Math.round(size * 0.62);
  const caveW = Math.round(caveH * (26 / 36));
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={caveW} height={caveH} viewBox={CAVE_VIEWBOX} fill="none">
        <defs>
          <linearGradient id="caveRing" x1="6" y1="6" x2="20" y2="33" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="40%" stopColor="#be123c" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <radialGradient id="caveEmber" cx="50%" cy="40%" r="62%">
            <stop offset="0%" stopColor="#fecdd3" />
            <stop offset="42%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#6b21a8" />
          </radialGradient>
        </defs>
        <path
          d={CAVE_OUTER}
          fill="#1a0a10"
          stroke="url(#caveRing)"
          strokeWidth="1.55"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path d={CAVE_INNER} fill="#050208" />
        <path d={CAVE_GLOW} fill="url(#caveEmber)" />
      </svg>
    </div>
  );
}
