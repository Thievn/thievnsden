"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORIES, CLASSICS, inferPack } from "@/lib/thoughts-packs";

type Card = {
  slug: string;
  title: string;
  excerpt?: string;
  cover_url?: string | null;
  pack: string;
  date?: string;
  readTime?: string;
};

function Cover({ src }: { src?: string | null }) {
  const [ok, setOk] = useState(!!src);
  if (!src || !ok) return null;
  return (
    <div className="relative w-full h-36 sm:h-44 overflow-hidden bg-[#0a0a0a]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" onError={() => setOk(false)} className="absolute inset-0 w-full h-full object-cover" />
    </div>
  );
}

export function ThoughtsBoard() {
  const [extra, setExtra] = useState<Card[]>([]);
  const [pack, setPack] = useState("all");

  useEffect(() => {
    fetch("/api/thoughts")
      .then((r) => r.json())
      .then((d) => {
        const rows = (d.rows || []).map((r: any) => ({
          slug: r.slug,
          title: r.title,
          excerpt: r.excerpt,
          cover_url: r.cover_url,
          pack: r.pack || inferPack(r.topic, r.slug),
          date: r.created_at ? new Date(r.created_at).toLocaleString("en-US", { month: "short", year: "numeric" }) : "",
        }));
        setExtra(rows);
      })
      .catch(() => {});
  }, []);

  const cards = useMemo(() => {
    const map = new Map<string, Card>();
    CLASSICS.forEach((c) => map.set(c.slug, { ...c, pack: c.pack }));
    extra.forEach((r) => {
      const prev = map.get(r.slug);
      map.set(r.slug, {
        ...prev,
        ...r,
        title: r.title || prev?.title || r.slug,
        excerpt: r.excerpt || prev?.excerpt,
        cover_url: r.cover_url || prev?.cover_url,
        pack: r.pack || prev?.pack || "self",
        date: r.date || prev?.date,
        readTime: prev?.readTime,
      });
    });
    return [...map.values()];
  }, [extra]);

  const shown = pack === "all" ? cards : cards.filter((c) => c.pack === pack);

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
        {CATEGORIES.map((c) => {
          const on = pack === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setPack(c.id)}
              className={`thought-chip shrink-0 px-3.5 py-1.5 rounded-full text-xs border bg-gradient-to-r transition-all duration-300 ${
                on ? c.chip + " scale-105 shadow-[0_0_18px_-6px_rgba(244,114,182,0.7)]" : "from-transparent to-transparent border-neutral-800 text-neutral-500"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {shown.map((thought) => (
          <Link
            key={thought.slug}
            href={`/thoughts/${thought.slug}`}
            className="group block rounded-2xl border border-neutral-800/80 bg-[#111] overflow-hidden hover:border-rose-900/50 transition-colors"
          >
            <Cover src={thought.cover_url} />
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-2.5 text-[12px]">
                <span className="text-red-400/80">{thought.date || "Aug 2026"}</span>
                {thought.readTime && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-purple-800/60" />
                    <span className="text-purple-400/80">{thought.readTime} read</span>
                  </>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-medium text-neutral-100 mb-2 group-hover:text-red-300 leading-snug">
                {thought.title}
              </h2>
              {thought.excerpt && (
                <p className="text-neutral-400 text-sm leading-relaxed line-clamp-2">{thought.excerpt}</p>
              )}
            </div>
          </Link>
        ))}
        {shown.length === 0 && <p className="text-sm text-neutral-500 px-1">Nothing in this lane yet.</p>}
      </div>
    </div>
  );
}
