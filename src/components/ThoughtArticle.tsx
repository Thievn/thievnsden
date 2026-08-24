"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThoughtReactions } from "./ThoughtReactions";
import { ThoughtComments } from "./ThoughtComments";

interface ThoughtArticleProps {
  title: string;
  date: string;
  readTime: string;
  slug: string;
  cover?: string;
  children: React.ReactNode;
}

export function ThoughtArticle({ title, date, readTime, slug, cover, children }: ThoughtArticleProps) {
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [header, setHeader] = useState(cover || "");
  const [show, setShow] = useState(!!cover);

  useEffect(() => {
    if (cover) {
      setHeader(cover);
      setShow(true);
      return;
    }
    fetch(`/api/thoughts/${slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const url = d?.thought?.cover_url;
        if (url) {
          setHeader(url);
          setShow(true);
        }
      })
      .catch(() => {});
  }, [cover, slug]);

  const sizeClasses = {
    sm: "text-[14px] sm:text-[15px]",
    base: "text-[15px] sm:text-base",
    lg: "text-[17px] sm:text-[18px]",
  };

  return (
    <article className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/thoughts"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 hover:from-red-300 hover:to-purple-300 transition-all"
        >
          ← Back to Thoughts
        </Link>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-neutral-500 mr-1.5">Text</span>
          {(["sm", "base", "lg"] as const).map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                fontSize === size
                  ? "bg-gradient-to-b from-red-800/40 to-purple-900/40 text-red-300 border border-red-900/40"
                  : "text-neutral-500 hover:text-neutral-300 border border-transparent"
              }`}
            >
              {size === "sm" ? "S" : size === "base" ? "M" : "L"}
            </button>
          ))}
        </div>
      </div>

      {show && header && (
        <div className="relative w-full h-44 sm:h-56 overflow-hidden rounded-2xl border border-neutral-800 mb-8 bg-[#0a0a0a]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={header} alt="" onError={() => setShow(false)} className="absolute inset-0 w-full h-full object-cover" />
        </div>
      )}

      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4 text-[12px]">
          <span className="text-red-400/90">{date}</span>
          <span className="w-1 h-1 rounded-full bg-purple-700/70" />
          <span className="text-purple-400/90">{readTime} read</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-50 leading-snug mb-6">
          {title}
        </h1>
        <ThoughtReactions slug={slug} />
      </header>

      <div className={`space-y-5 text-neutral-300 leading-relaxed ${sizeClasses[fontSize]}`}>
        {children}
      </div>

      <ThoughtComments slug={slug} />

      <div className="mt-10 pt-8 border-t border-neutral-900">
        <Link
          href="/thoughts"
          className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400"
        >
          ← Back to Thoughts
        </Link>
      </div>
    </article>
  );
}
