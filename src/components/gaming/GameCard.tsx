"use client";

import { useEffect, useState } from "react";
import type { GamingItem } from "@/lib/gaming-data";
import { STATUS_STYLES } from "@/lib/gaming-data";
import { ShareBar } from "@/components/ShareBar";

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

export function GameCard({ item }: { item: GamingItem }) {
  const style = STATUS_STYLES[item.status] || STATUS_STYLES.hype;
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

  const sharePath = `/gaming?card=${encodeURIComponent(item.id)}`;

  return (
    <article className="rounded-2xl border border-neutral-800/80 bg-[#111] overflow-hidden flex flex-col">
      {item.cover ? (
        <div className="relative aspect-[16/9] bg-neutral-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.cover}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent" />
        </div>
      ) : null}

      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${style.className}`}
              >
                {style.label}
              </span>
              {item.meta ? (
                <span className="text-[11px] text-neutral-500">{item.meta}</span>
              ) : null}
            </div>
            <h3 className="text-base font-medium text-neutral-100 leading-snug">
              {item.title}
            </h3>
          </div>
          {typeof item.hours === "number" ? (
            <span className="text-xs text-neutral-500 tabular-nums shrink-0">
              {item.hours}h
            </span>
          ) : null}
        </div>

        <p className="text-sm text-neutral-400 leading-relaxed flex-1">{item.note}</p>

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
          <ShareBar path={sharePath} title={`${item.title} · Thievn's Den`} className="ml-auto" />
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
