"use client";

import { useEffect, useState } from "react";
import { LOOT_ITEMS } from "@/lib/loot-data";

function LootImage({ id, name, cover }: { id: string; name: string; cover?: string }) {
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const src = cover || `/loot/${id}.jpg`;

  useEffect(() => {
    setState("loading");
  }, [src]);

  return (
    <div className="relative aspect-[16/10] sm:aspect-[4/3] bg-[#0a0a0a] border-b border-neutral-800/60 overflow-hidden">
      {state !== "ok" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#0c0c0c] to-[#080808]">
          <div className="text-center px-4">
            <div className="w-11 h-11 mx-auto mb-3 rounded-full border border-neutral-800/90 bg-black/40 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gradient-to-br from-red-500 to-purple-500 opacity-70" />
            </div>
            <p className="text-[11px] text-neutral-500 tracking-wide">Photo coming</p>
          </div>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          state === "ok" ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setState("ok")}
        onError={() => setState("missing")}
      />
    </div>
  );
}

function ReviewBlock({ review }: { review: string }) {
  const [open, setOpen] = useState(false);
  const needsToggle = review.length > 110;

  return (
    <div className="pt-3 border-t border-neutral-800/60">
      <p className={`text-xs text-neutral-400 leading-relaxed transition-all ${
        open || !needsToggle ? "" : "line-clamp-2"
      }`}>
        {review}
      </p>
      {needsToggle && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="mt-1.5 text-[11px] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 hover:from-red-300 hover:to-purple-300 min-h-0 py-0.5"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

export default function LootPage() {
  const [covers, setCovers] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/loot/covers")
      .then((r) => r.json())
      .then((d) => setCovers(d.covers || {}))
      .catch(() => {});
  }, []);

  return (
    <div className="relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] h-[280px] sm:h-[380px] bg-[radial-gradient(ellipse_at_center,_rgba(185,28,92,0.06)_0%,_transparent_65%)] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="mb-10 sm:mb-14 rounded-2xl overflow-hidden border border-neutral-800/80 bg-[#0d0d0d]">
          <div className="relative py-10 sm:py-14 px-5 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0c0c0c] via-[#111] to-[#0a0a0a]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,_rgba(185,28,92,0.12)_0%,_transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,_rgba(124,58,237,0.08)_0%,_transparent_50%)]" />
            <div className="relative z-10 text-center">
              <p className="text-[11px] uppercase tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-2.5 font-medium">
                From the Den
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-neutral-50 mb-2">Loot</h1>
              <p className="text-neutral-500 text-sm max-w-sm mx-auto">Things that actually earned a place.</p>
            </div>
          </div>
        </div>

        <div className="mb-8 sm:mb-12 max-w-2xl">
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
            Private collection, not a storefront. PC parts that survived multiple builds,
            figures that still look decent after the hype dies, and gear that didn’t get returned.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {LOOT_ITEMS.map((item) => (
            <div key={item.id} className="card group rounded-2xl border border-neutral-800/80 bg-[#111] overflow-hidden flex flex-col">
              <LootImage id={item.id} name={item.name} cover={covers[item.id]} />
              <div className="p-4 sm:p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-[11px] font-medium text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 uppercase tracking-wide">
                    {item.category}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-neutral-600">{item.status}</span>
                </div>
                <h2 className="text-base sm:text-lg font-medium text-neutral-100 mb-1.5 group-hover:text-red-300 transition-colors">{item.name}</h2>
                <p className="text-sm text-neutral-500 leading-relaxed mb-3 flex-1">{item.short}</p>
                <ReviewBlock review={item.review} />
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-red-300 transition-colors py-1">
                  Check it out
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
