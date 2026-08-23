"use client";

import { useEffect, useMemo, useState } from "react";
import { LOOT_SECTIONS, SEED_PICKS, sectionLabel, type LootPick } from "@/lib/loot-data";

function Cover({ name, src }: { name: string; src?: string | null }) {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(false), [src]);
  return (
    <div className="relative aspect-[16/10] sm:aspect-[4/3] bg-[#0a0a0a] border-b border-neutral-800/60 overflow-hidden">
      {!ok && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[11px] text-neutral-500">{src ? "Loading" : "Photo coming"}</p>
        </div>
      )}
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            ok ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setOk(true)}
        />
      )}
    </div>
  );
}

function Note({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const long = text.length > 140;
  return (
    <div className="pt-3 border-t border-neutral-800/60">
      <p className={`text-xs text-neutral-400 leading-relaxed whitespace-pre-line ${
        open || !long ? "" : "line-clamp-3"
      }`}>{text}</p>
      {long && (
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-1.5 text-[11px] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400">
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

export default function LootPage() {
  const [picks, setPicks] = useState<LootPick[]>(SEED_PICKS);

  useEffect(() => {
    fetch("/api/loot/list")
      .then((r) => r.json())
      .then((d) => {
        if (d.picks?.length) setPicks(d.picks);
      })
      .catch(() => {});
  }, []);

  const groups = useMemo(() => {
    const order = LOOT_SECTIONS.map((s) => s.id);
    const map: Record<string, LootPick[]> = {};
    picks.forEach((p) => {
      const key = order.includes(p.section as any) ? p.section : "desk";
      (map[key] ||= []).push(p);
    });
    return order.filter((id) => map[id]?.length).map((id) => ({ id, items: map[id] }));
  }, [picks]);

  return (
    <div className="relative">
      <div className="loot-hero-orb pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] h-[280px] sm:h-[380px] bg-[radial-gradient(ellipse_at_center,_rgba(185,28,92,0.08)_0%,_transparent_65%)]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="mb-10 sm:mb-14 rounded-2xl overflow-hidden border border-neutral-800/80 bg-[#0d0d0d]">
          <div className="relative py-10 sm:py-14 px-5 text-center">
            <p className="text-[11px] uppercase tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-2.5 font-medium">From the Den</p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-neutral-50 mb-2">Loot</h1>
            <p className="text-neutral-500 text-sm max-w-sm mx-auto">Things that earned a place. Scroll the pile.</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 sticky top-14 z-20 bg-[#070707]/80 backdrop-blur-md py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {groups.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="shrink-0 px-3 py-1.5 rounded-full border border-neutral-800 text-xs text-neutral-300 hover:border-red-800/50">
              {sectionLabel(g.id)}
            </a>
          ))}
        </div>

        {groups.map((g) => (
          <section key={g.id} id={g.id} className="mb-12 sm:mb-16 scroll-mt-28">
            <h2 className="text-xs uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-4">
              {sectionLabel(g.id)}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {g.items.map((item, i) => (
                <article
                  key={item.id}
                  className="loot-card group rounded-2xl border border-neutral-800/80 bg-[#111] overflow-hidden flex flex-col"
                  style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                >
                  <Cover name={item.name} src={item.image_url} />
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-medium text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 uppercase tracking-wide">
                        {sectionLabel(item.section)}
                      </span>
                      <span className="text-[10px] text-neutral-600">{item.status || "In the Den"}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-neutral-100 mb-1.5 group-hover:text-red-300 transition-colors">{item.name}</h3>
                    <p className="text-sm text-neutral-500 leading-relaxed mb-3 flex-1">{item.snippet}</p>
                    <Note text={item.body || ""} />
                    <a
                      href={`/go/${item.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-red-300 transition-colors py-1"
                    >
                      Check it out
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
