"use client";

import Link from "next/link";
import { useState } from "react";
import { sectionLabel, type LootPick } from "@/lib/loot-data";

export function LootCover({
  name,
  src,
  className = "",
  fit = "cover",
}: {
  name: string;
  src?: string | null;
  className?: string;
  fit?: "cover" | "contain";
}) {
  const [ok, setOk] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-[#080705] ${className}`}>
      {!ok && <div className="absolute inset-0 loot-shimmer" />}
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className={`h-full w-full ${fit === "contain" ? "object-contain p-4" : "object-cover"} transition duration-700 ${
            ok ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
          onLoad={() => setOk(true)}
        />
      ) : (
        <div className="h-full w-full grid place-items-center text-[11px] text-neutral-600">Still coming</div>
      )}
    </div>
  );
}

function Meta({ item }: { item: LootPick }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.16em] text-amber-200/90">{sectionLabel(item.section)}</span>
      <span className="text-neutral-700">·</span>
      <span className="text-[10px] uppercase tracking-wide text-neutral-500">{item.status || "In the Den"}</span>
    </div>
  );
}

export function LootHeroCard({ item }: { item: LootPick }) {
  return (
    <article className="loot-card overflow-hidden rounded-[2rem] border border-amber-900/35 bg-[#0c0a08]">
      <Link href={`/loot/${item.id}`} className="grid lg:grid-cols-12 min-h-[320px] lg:min-h-[420px]">
        <div className="relative lg:col-span-7 min-h-[240px]">
          <LootCover name={item.name} src={item.image_url} className="absolute inset-0 h-full w-full" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0c0a08] hidden lg:block" />
        </div>
        <div className="relative lg:col-span-5 flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <p className="text-[11px] uppercase tracking-[0.28em] text-amber-300/80 mb-3">On the table</p>
          <Meta item={item} />
          <h2 className="mt-4 text-3xl sm:text-4xl font-semibold text-neutral-50 leading-[1.05]">{item.name}</h2>
          <p className="mt-4 text-neutral-400 leading-relaxed">{item.snippet}</p>
          <p className="mt-8 text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-rose-300">
            Read the note →
          </p>
        </div>
      </Link>
    </article>
  );
}

export function LootLead({ item }: { item: LootPick }) {
  return (
    <article className="loot-card overflow-hidden rounded-[1.7rem] border border-amber-900/30 bg-[#100e0a] h-full">
      <Link href={`/loot/${item.id}`} className="flex flex-col h-full">
        <LootCover name={item.name} src={item.image_url} className="aspect-[16/11]" />
        <div className="p-5 sm:p-6 flex-1 flex flex-col">
          <Meta item={item} />
          <h3 className="mt-3 text-2xl font-semibold text-neutral-50 leading-snug">{item.name}</h3>
          <p className="mt-3 text-sm text-neutral-400 leading-relaxed line-clamp-3 flex-1">{item.snippet}</p>
          <p className="mt-5 text-sm text-amber-200/90">Open the take →</p>
        </div>
      </Link>
    </article>
  );
}

export function LootSpread({ item }: { item: LootPick }) {
  return (
    <article className="loot-card overflow-hidden rounded-[1.7rem] border border-amber-900/30 bg-[#100e0a] h-full">
      <Link href={`/loot/${item.id}`} className="grid sm:grid-cols-2">
        <LootCover name={item.name} src={item.image_url} className="aspect-[4/3] sm:aspect-auto sm:min-h-[280px]" />
        <div className="flex flex-col justify-end p-5 sm:p-7">
          <Meta item={item} />
          <h3 className="mt-3 text-2xl font-semibold text-neutral-50 leading-snug">{item.name}</h3>
          <p className="mt-3 text-sm text-neutral-400 leading-relaxed line-clamp-3">{item.snippet}</p>
          <p className="mt-6 text-sm text-amber-200/90">Open the take →</p>
        </div>
      </Link>
    </article>
  );
}

export function LootTile({ item }: { item: LootPick }) {
  return (
    <article className="loot-card group overflow-hidden rounded-[1.5rem] border border-amber-900/25 bg-[#100e0a] flex flex-col">
      <Link href={`/loot/${item.id}`} className="flex flex-col h-full">
        <LootCover name={item.name} src={item.image_url} className="aspect-[4/3]" />
        <div className="p-4 sm:p-5 flex-1 flex flex-col">
          <Meta item={item} />
          <h3 className="mt-2.5 text-lg font-semibold text-neutral-50 leading-snug group-hover:text-amber-100 transition-colors">
            {item.name}
          </h3>
          <p className="mt-2 text-sm text-neutral-500 leading-relaxed line-clamp-2 flex-1">{item.snippet}</p>
        </div>
      </Link>
    </article>
  );
}

export function LootRow({ item }: { item: LootPick }) {
  return (
    <article className="loot-row group">
      <Link href={`/loot/${item.id}`} className="flex gap-4 items-center py-3.5">
        <LootCover name={item.name} src={item.image_url} className="h-[72px] w-[96px] shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <Meta item={item} />
          <h3 className="mt-1 text-[15px] font-medium text-neutral-100 truncate group-hover:text-amber-100">{item.name}</h3>
          <p className="text-sm text-neutral-500 line-clamp-1">{item.snippet}</p>
        </div>
        <span className="hidden sm:inline text-xs text-neutral-600 group-hover:text-amber-200 shrink-0">Note →</span>
      </Link>
    </article>
  );
}
