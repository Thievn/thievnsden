"use client";

import Link from "next/link";
import { useState } from "react";

interface ThoughtArticleProps {
  title: string;
  date: string;
  readTime: string;
  children: React.ReactNode;
}

export function ThoughtArticle({ title, date, readTime, children }: ThoughtArticleProps) {
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");

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

        {/* Text size control */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-neutral-500 mr-1">Text</span>
          {(["sm", "base", "lg"] as const).map((size) => (
            <button
              key={size}
              onClick={() => setFontSize(size)}
              className={`w-7 h-7 rounded-md text-xs font-medium transition-all ${
                fontSize === size
                  ? "bg-gradient-to-b from-red-800/40 to-purple-900/40 text-red-300 border border-red-900/50"
                  : "text-neutral-500 hover:text-neutral-300 border border-transparent hover:border-neutral-800"
              }`}
            >
              {size === "sm" ? "A" : size === "base" ? "A" : "A"}
              <span className="sr-only">{size}</span>
            </button>
          ))}
          <div className="flex gap-0.5 ml-0.5">
            <button
              onClick={() => setFontSize("sm")}
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                fontSize === "sm" ? "text-red-300" : "text-neutral-600 hover:text-neutral-400"
              }`}
            >
              S
            </button>
            <button
              onClick={() => setFontSize("base")}
              className={`px-1.5 py-0.5 rounded text-[11px] ${
                fontSize === "base" ? "text-red-300" : "text-neutral-600 hover:text-neutral-400"
              }`}
            >
              M
            </button>
            <button
              onClick={() => setFontSize("lg")}
              className={`px-1.5 py-0.5 rounded text-[12px] ${
                fontSize === "lg" ? "text-red-300" : "text-neutral-600 hover:text-neutral-400"
              }`}
            >
              L
            </button>
          </div>
        </div>
      </div>

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4 text-[12px]">
          <span className="text-red-400/90">{date}</span>
          <span className="w-1 h-1 rounded-full bg-purple-700/70" />
          <span className="text-purple-400/90">{readTime} read</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-50 leading-snug">
          {title}
        </h1>
      </header>

      <div className={`space-y-5 text-neutral-300 leading-relaxed ${sizeClasses[fontSize]}`}>
        {children}
      </div>

      <div className="mt-12 pt-8 border-t border-neutral-900">
        <Link
          href="/thoughts"
          className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 hover:from-red-300 hover:to-purple-300 transition-all"
        >
          ← Back to Thoughts
        </Link>
      </div>
    </article>
  );
}
