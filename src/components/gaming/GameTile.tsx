"use client";

import Link from "next/link";
import type { GamingItem } from "@/lib/gaming-data";
import { STATUS_STYLES, itemSlug, shelfOf } from "@/lib/gaming-data";
import { CoverImage } from "@/components/gaming/CoverImage";

const SHELF_LABEL: Record<string, string> = {
  current: "Just out",
  coming: "Soon",
  classic: "Classic",
  essay: "Take",
};

export function GameTile({ item }: { item: GamingItem }) {
  const href = `/gaming/${itemSlug(item)}`;
  const style = STATUS_STYLES[item.status] || STATUS_STYLES.hype;
  const shelf = shelfOf(item);

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl border border-violet-900/30 bg-[#0d0b12] aspect-square"
    >
      <CoverImage
        src={item.cover}
        alt={item.title}
        className="absolute inset-0 h-full w-full"
        imgClassName="h-full w-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-[1.04] transition-all duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5">
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded border border-white/15 text-neutral-200 bg-black/40">
            {SHELF_LABEL[shelf] || shelf}
          </span>
          <span className={`text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${style.className}`}>
            {style.label}
          </span>
        </div>
        <h3 className="text-sm sm:text-[15px] font-medium text-white leading-snug line-clamp-2">
          {item.title}
        </h3>
        <p className="mt-1 text-[11px] text-neutral-300/90 leading-snug line-clamp-2">
          {item.note}
        </p>
      </div>
    </Link>
  );
}
