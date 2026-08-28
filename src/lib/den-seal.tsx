/** Satori-friendly cave mouth. Used by favicon, PWA icons, OG. */
const CAVE =
  "polygon(9% 88%, 13% 58%, 21% 36%, 32% 48%, 40% 22%, 50% 38%, 62% 18%, 73% 42%, 84% 32%, 91% 58%, 94% 88%)";
const EMBER =
  "polygon(34% 78%, 37% 58%, 46% 62%, 51% 46%, 59% 62%, 67% 56%, 69% 78%)";

export function SatoriDenSeal({ size }: { size: number }) {
  const pad = Math.max(2, Math.round(size * 0.06));
  return (
    <div
      style={{
        width: size,
        height: Math.round(size * 0.78),
        display: "flex",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #fb7185 0%, #e11d48 48%, #a855f7 100%)",
          clipPath: CAVE,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: pad,
          background: "#070707",
          clipPath: CAVE,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #fecdd3 0%, #e11d48 52%, #7c3aed 100%)",
          clipPath: EMBER,
        }}
      />
    </div>
  );
}
