"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { GamingItem } from "@/lib/gaming-data";
import { STATUS_STYLES, itemSlug } from "@/lib/gaming-data";
import { ThoughtReactions } from "@/components/ThoughtReactions";
import { ThoughtComments } from "@/components/ThoughtComments";
import { ShareBar } from "@/components/ShareBar";
import { CoverImage } from "@/components/gaming/CoverImage";

export default function GamingArticlePage() {
  const params = useParams();
  const slug = String(params?.slug || "");
  const [item, setItem] = useState<GamingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/gaming/${encodeURIComponent(slug)}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setItem(data.item);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-sm text-neutral-500">
        Loading…
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-neutral-300">That piece isn’t in the Den.</p>
        <Link
          href="/gaming"
          className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400"
        >
          ← Back to Gaming
        </Link>
      </div>
    );
  }

  const style = STATUS_STYLES[item.status] || STATUS_STYLES.hype;
  const path = `/gaming/${itemSlug(item)}`;
  const paragraphs = (item.body || item.note || "")
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <article className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link
        href="/gaming"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-8"
      >
        ← Back to Gaming
      </Link>

      <div className="rounded-2xl overflow-hidden mb-8 border border-neutral-800/80 aspect-[16/9]">
        <CoverImage src={item.cover} className="h-full w-full" imgClassName="h-full w-full object-cover" eager />
      </div>

      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span
            className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${style.className}`}
          >
            {style.label}
          </span>
          {item.meta ? (
            <span className="text-[12px] text-neutral-500">{item.meta}</span>
          ) : null}
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-50 leading-snug mb-4">
          {item.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <ThoughtReactions slug={`gaming-${itemSlug(item)}`} />
          <ShareBar path={path} title={`${item.title} · Thievn's Den`} />
        </div>
      </header>

      <div className="space-y-5 text-[15px] sm:text-base text-neutral-300 leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {item.url ? (
        <p className="mt-8">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-red-400/90 hover:text-red-300 underline underline-offset-2"
          >
            External link →
          </a>
        </p>
      ) : null}

      <ThoughtComments slug={`gaming-${itemSlug(item)}`} />

      <div className="mt-10 pt-8 border-t border-neutral-900">
        <Link
          href="/gaming"
          className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400"
        >
          ← Back to Gaming
        </Link>
      </div>
    </article>
  );
}
