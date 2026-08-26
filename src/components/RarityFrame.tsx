"use client";

import type { RaritySlug } from "@/lib/rarity";

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function RarityFrame({
  slug,
  className,
  innerClassName,
  compact = false,
  children,
}: {
  slug: RaritySlug | string;
  className?: string;
  innerClassName?: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  const safe = (
    ["legendary", "epic", "rare", "uncommon", "common", "trash"] as const
  ).includes(slug as RaritySlug)
    ? slug
    : "common";

  return (
    <div
      className={cx(
        "rarity-frame",
        `rarity-${safe}`,
        compact && "rarity-frame-sm",
        className
      )}
    >
      <span className="rarity-frame-spin" aria-hidden />
      <span className="rarity-frame-glow" aria-hidden />
      <div className={cx("rarity-frame-inner", innerClassName)}>{children}</div>
    </div>
  );
}
