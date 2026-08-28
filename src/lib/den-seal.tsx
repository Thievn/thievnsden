/** Satori-friendly den seal (ember in a ring). Used by favicon, PWA icons, OG. */
export function SatoriDenSeal({ size }: { size: number }) {
  const ring = Math.round(size * 0.74);
  const core = Math.round(size * 0.26);
  const border = Math.max(2, Math.round(size * 0.055));
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
      <div
        style={{
          width: ring,
          height: ring,
          borderRadius: 999,
          border: `${border}px solid #e11d48`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 42%, #1a0a12 0%, #070707 72%)",
          boxShadow: `0 0 ${Math.round(size * 0.18)}px rgba(225,29,72,0.35)`,
        }}
      >
        <div
          style={{
            width: core,
            height: core,
            borderRadius: 999,
            background: "linear-gradient(180deg, #fda4af 0%, #e11d48 48%, #7c3aed 100%)",
          }}
        />
      </div>
    </div>
  );
}
