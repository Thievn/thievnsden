"use client";

import { useState, useEffect } from "react";

interface ThoughtReactionsProps {
  slug: string;
}

export function ThoughtReactions({ slug }: ThoughtReactionsProps) {
  const [up, setUp] = useState(0);
  const [down, setDown] = useState(0);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`den-vote-${slug}`);
      const counts = localStorage.getItem(`den-counts-${slug}`);
      if (stored === "up" || stored === "down") setVoted(stored);
      if (counts) {
        const parsed = JSON.parse(counts);
        setUp(parsed.up || 0);
        setDown(parsed.down || 0);
      }
    } catch {}
    setReady(true);
  }, [slug]);

  const vote = (type: "up" | "down") => {
    if (!ready) return;

    let newUp = up;
    let newDown = down;
    let newVoted: "up" | "down" | null = type;

    if (voted === type) {
      // un-vote
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

    try {
      localStorage.setItem(`den-vote-${slug}`, newVoted || "");
      localStorage.setItem(`den-counts-${slug}`, JSON.stringify({ up: newUp, down: newDown }));
    } catch {}
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => vote("up")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all ${
          voted === "up"
            ? "border-red-800/60 bg-red-950/30 text-red-300"
            : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
        }`}
      >
        <span className="text-base leading-none">↑</span>
        <span className="tabular-nums">{up}</span>
      </button>

      <button
        onClick={() => vote("down")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all ${
          voted === "down"
            ? "border-purple-800/60 bg-purple-950/30 text-purple-300"
            : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
        }`}
      >
        <span className="text-base leading-none">↓</span>
        <span className="tabular-nums">{down}</span>
      </button>
    </div>
  );
}
