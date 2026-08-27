"use client";

import Link from "next/link";
import { useState } from "react";
import { sectionLabel, type LootPick } from "@/lib/loot-data";

export function LootCover({ name, src, className = "" }: { name: string; src?: string | null; className?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-[#080705] ${className}`}>
      {!ok && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(245,158,11,0.12)_0%,_transparent_70%)]" />
      )}
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className={`h-full w-full object-cover transition duration-700 ${ok ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
          onLoad={() => setOk(true)}
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-[11px] text-neutral-600">Still coming</div>
      )}
    </div>
  );
}

export function LootCard({ item, featured = false }: { item: LootPick; featured?: boolean }) {
  return (
    <article
      className={`loot-card group relative overflow-hidden rounded-[1.6rem] border border-amber-900/30 bg-[#100e0a] ${
        featured ? "sm:col-span-2 lg:col-span-2" : ""
      }`}
    >
      <Link href={`/loot/${item.id}`} className="block">
        <LootCover
          name={item.name}
          src={item.image_url}
          className={featured ? "aspect-[16/9] sm:aspect-[16/8]" : "aspect-[4/3]"}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent opacity-90" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-100 bg-black/40">
              {sectionLabel(item.section)}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-neutral-400">{item.status || "In the Den"}</span>
          </div>
          <h3 className={`font-semibold text-white leading-snug ${featured ? "text-xl sm:text-2xl" : "text-base sm:text-lg"}`}>
            {item.name}
          </h3>
          <p className="mt-1.5 text-sm text-neutral-300/90 leading-snug line-clamp-2">{item.snippet}</p>
        </div>
      </Link>
    </article>
  );
}
