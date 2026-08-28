const STONE = "/mark/den-stone.webp";

export function DenMark({
  className = "h-8 w-auto",
  title = "Thievn's Den",
  glow = false,
}: {
  className?: string;
  title?: string;
  glow?: boolean;
}) {
  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      {glow ? <span className="pointer-events-none absolute inset-[-55%_-40%] den-mark-halo" /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={STONE}
        alt={title}
        draggable={false}
        className="relative z-10 h-full w-auto max-w-none object-contain select-none"
      />
    </span>
  );
}

export function DenMarkSplash({ className = "h-20 w-auto" }: { className?: string }) {
  return (
    <span className={`relative inline-flex items-center justify-center den-seal-splash ${className}`}>
      <span className="pointer-events-none absolute inset-[-32%] den-seal-halo" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={STONE}
        alt=""
        draggable={false}
        className="relative z-10 den-boot-stone h-full w-auto max-w-none object-contain select-none"
      />
    </span>
  );
}
