"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { GamingItem } from "@/lib/gaming-data";
import { STATUS_STYLES, itemSlug } from "@/lib/gaming-data";
import { ShareBar } from "@/components/ShareBar";
import { CoverImage } from "@/components/gaming/CoverImage";

const DEN_NAMES = [
  "A voice from the Den",
  "Someone in the dark",
  "Quiet observer",
  "Passing shadow",
  "Unnamed",
];

type Comment = {
  id: string;
  name: string;
  text: string;
  time: string;
};

export function GameCard({
  item,
  featured = false,
}: {
  item: GamingItem;
  featured?: boolean;
}) {
  const style = STATUS_STYLES[item.status] || STATUS_STYLES.hype;
  const slug = itemSlug(item);
  const href = `/gaming/${slug}`;
  const storageKey = `den-game-${item.id}`;

  const [up, setUp] = useState(0);
  const [down, setDown] = useState(0);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [openComments, setOpenComments] = useState(false);
  const [text, setText] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setUp(parsed.up || 0);
        setDown(parsed.down || 0);
        setVoted(parsed.voted || null);
        setComments(parsed.comments || []);
      }
    } catch {}
    setReady(true);
  }, [storageKey]);

  const persist = (next: {
    up: number;
    down: number;
    voted: "up" | "down" | null;
    comments: Comment[];
  }) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  };

  const vote = (type: "up" | "down") => {
    if (!ready) return;
    let newUp = up;
    let newDown = down;
    let newVoted: "up" | "down" | null = type;

    if (voted === type) {
      if (type === "up") newUp = Math.max(0, up - 1);
      else newDown = Math.max(0, down - 1);
      newVoted = null;
    } else {
      if (voted === "up") newUp = Math.max(0, up - 1);
      if (voted === "down") newDown = Math.max(0, down - 1);
      if (type === "up") newUp += 1;
      else newDown += 1;
    }

    setUp(newUp);
    setDown(newDown);
    setVoted(newVoted);
    persist({ up: newUp, down: newDown, voted: newVoted, comments });
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const next: Comment[] = [
      {
        id: String(Date.now()),
        name: DEN_NAMES[Math.floor(Math.random() * DEN_NAMES.length)],
        text: text.trim(),
        time: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      },
      ...comments,
    ];
    setComments(next);
    setText("");
    persist({ up, down, voted, comments: next });
  };

  const coverAspect = featured
    ? "aspect-[21/9] sm:aspect-[2.4/1]"
    : "aspect-[16/9]";

  return (
    <article
      className={`rounded-2xl border border-neutral-800/80 bg-[#111] overflow-hidden flex flex-col ${
        featured ? "sm:col-span-2" : ""
      }`}
    >
      <Link href={href} className="group block">
        <div className={`relative ${coverAspect}`}>
          <CoverImage
            src={item.cover}
            className="absolute inset-0"
            imgClassName="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/20 to-transparent pointer-events-none" />
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${style.className}`}
            >
              {style.label}
            </span>
            {item.meta ? (
              <span className="text-[11px] text-neutral-500">{item.meta}</span>
            ) : null}
          </div>
          <h3
            className={`font-medium text-neutral-100 leading-snug group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-red-300 group-hover:to-purple-300 transition-all ${
              featured ? "text-xl sm:text-2xl" : "text-base"
            }`}
          >
            {item.title}
          </h3>
          <p
            className={`mt-2 text-neutral-400 leading-relaxed ${
              featured ? "text-sm sm:text-base max-w-2xl" : "text-sm line-clamp-3"
            }`}
          >
            {item.note}
          </p>
          <p className="mt-3 text-xs font-medium text-red-400/80 group-hover:text-red-300">
            Read more →
          </p>
        </div>
      </Link>

      <div className="px-5 pb-5 flex flex-col gap-3 mt-auto">
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-900/80">
          <button
            type="button"
            onClick={() => vote("up")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
              voted === "up"
                ? "border-red-800/60 bg-red-950/30 text-red-300"
                : "border-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <span>↑</span>
            <span className="tabular-nums">{up}</span>
          </button>
          <button
            type="button"
            onClick={() => vote("down")}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
              voted === "down"
                ? "border-purple-800/60 bg-purple-950/30 text-purple-300"
                : "border-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <span>↓</span>
            <span className="tabular-nums">{down}</span>
          </button>
          <button
            type="button"
            onClick={() => setOpenComments((v) => !v)}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-800 text-xs text-neutral-400 hover:text-neutral-200"
          >
            Comments ({comments.length})
          </button>
          <ShareBar
            path={href}
            title={`${item.title} · Thievn's Den`}
            className="ml-auto"
          />
        </div>

        {openComments && (
          <div className="pt-3 space-y-3 border-t border-neutral-900/80">
            <form onSubmit={submitComment} className="space-y-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                placeholder="Say something…"
                className="w-full px-3 py-2 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 resize-none"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-b from-red-800/80 to-purple-900/80 text-white disabled:opacity-40"
              >
                Post
              </button>
            </form>
            {comments.length === 0 ? (
              <p className="text-xs text-neutral-600">No comments yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-900"
                  >
                    <div className="flex justify-between gap-2 mb-0.5">
                      <span className="text-[11px] text-purple-400/90">{c.name}</span>
                      <span className="text-[10px] text-neutral-600">{c.time}</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
