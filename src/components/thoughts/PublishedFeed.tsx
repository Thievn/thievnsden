"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function PublishedFeed() {
  const [rows, setRows] = useState<{ slug: string; title: string; excerpt?: string; cover_url?: string; created_at?: string }[]>([]);

  useEffect(() => {
    fetch("/api/thoughts")
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []))
      .catch(() => {});
  }, []);

  if (!rows.length) return null;

  return (
    <div className="space-y-4 mb-4">
      {rows.map((thought) => (
        <Link
          key={thought.slug}
          href={`/thoughts/${thought.slug}`}
          className="group block rounded-2xl border border-neutral-800/80 bg-[#111] overflow-hidden hover:border-neutral-700"
        >
          {thought.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thought.cover_url} alt="" className="w-full aspect-[16/9] object-cover" />
          )}
          <div className="p-5 sm:p-6">
            <p className="text-[12px] text-red-400/80 mb-2">
              {thought.created_at ? new Date(thought.created_at).toLocaleString("en-US", { month: "short", year: "numeric" }) : "New"}
            </p>
            <h2 className="text-lg sm:text-xl font-medium text-neutral-100 mb-2 group-hover:text-red-300 leading-snug">
              {thought.title}
            </h2>
            {thought.excerpt && (
              <p className="text-neutral-400 text-sm leading-relaxed line-clamp-2">{thought.excerpt}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
