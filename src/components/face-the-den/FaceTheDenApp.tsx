"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { EMPTY_DRAFT, VOTE, type RoastDraft } from "@/lib/face-the-den";
import { FaceStudio } from "@/components/face-the-den/FaceStudio";
import { InfoTip } from "@/components/face-the-den/InfoTip";
import { GalleryStack } from "@/components/GalleryStack";
import { RanksList } from "@/components/RanksList";
import type { GalleryJudgment } from "@/lib/gallery";

type Tab = "face" | "stack" | "boards";

export function FaceTheDenApp() {
  const [tab, setTab] = useState<Tab>("face");
  const [userId, setUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RoastDraft>(EMPTY_DRAFT);
  const [cards, setCards] = useState<GalleryJudgment[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetch("/api/judgments?public=1")
      .then((r) => r.json())
      .then((d) => setCards(d.judgments || []))
      .catch(() => setCards([]));
  }, []);

  const stats = useMemo(() => {
    const marks = cards.reduce((n, c) => n + (c.likes || 0), 0);
    const cuts = cards.reduce((n, c) => n + (c.dislikes || 0), 0);
    return { count: cards.length, marks, cuts };
  }, [cards]);

  return (
    <div className="ftd-shell relative min-h-[calc(100vh-8rem)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ftd-orb ftd-orb-a" />
        <div className="ftd-orb ftd-orb-b" />
        <div className="ftd-orb ftd-orb-c" />
        <div className="den-grain" />
      </div>

      <div className="relative w-full min-w-0 max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="pt-8 sm:pt-10 mb-6 sm:mb-8 ftd-rise">
          <Link href="/playground" className="inline-block mb-5 text-sm text-neutral-500 hover:text-neutral-300">
            ← Playground
          </Link>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-3 min-w-0">
            <h1 className="den-title-glow text-[1.85rem] leading-none sm:text-5xl lg:text-6xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-rose-100 to-purple-300">
              Face The Den
            </h1>
            <InfoTip label="How Face The Den works">
              Drop a photo or take one. Pick a voice. The Den looks at the picture and talks back — calm, filthy, or completely unhinged, your call. Mark cards you want to keep around. Cut the ones that should leave. You need an account to play and to vote.
            </InfoTip>
          </div>
          <p className="text-neutral-400 text-sm sm:text-base max-w-xl leading-relaxed">
            Walk in looking pretty. Leave with notes. Mark and Cut the stack. Climb both boards.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 min-w-0 ftd-rise ftd-delay-1">
          <div className="flex gap-1 p-1.5 rounded-2xl border border-red-900/25 bg-black/50 backdrop-blur-sm shadow-[0_0_40px_-16px_rgba(185,28,92,0.45)] sm:max-w-lg w-full min-w-0">
            {(
              [
                ["face", "Face"],
                ["stack", "Stack"],
                ["boards", "Boards"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`ftd-tap flex-1 min-w-0 py-3 rounded-xl text-sm font-semibold tracking-wide ${
                  tab === id
                    ? "bg-gradient-to-b from-red-800/50 via-red-950/40 to-purple-950/50 text-neutral-50 border border-red-800/40"
                    : "text-neutral-500 hover:text-neutral-200 border border-transparent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.08em] sm:tracking-[0.14em] text-neutral-500 sm:ml-auto min-w-0 w-full sm:w-auto">
            <span className="ftd-pop ftd-delay-2 px-2.5 py-1 rounded-full border border-white/10 bg-black/40 whitespace-nowrap">
              {stats.count} in the stack
            </span>
            <span className="ftd-pop ftd-delay-3 px-2.5 py-1 rounded-full border border-rose-900/40 bg-rose-950/30 text-rose-200/80 whitespace-nowrap">
              {stats.marks} {VOTE.like.noun}
            </span>
            <span className="ftd-pop ftd-delay-4 px-2.5 py-1 rounded-full border border-slate-700/50 bg-slate-950/40 text-slate-300/80 whitespace-nowrap">
              {stats.cuts} {VOTE.dislike.noun}
            </span>
          </div>
        </div>

        {tab === "face" && <FaceStudio userId={userId} draft={draft} onDraft={setDraft} />}
        {tab === "stack" && (
          <div className="pb-4 w-full min-w-0 ftd-rise">
            <GalleryStack compact />
          </div>
        )}
        {tab === "boards" && (
          <div className="relative w-full min-w-0 ftd-rise">
            <RanksList compact showHeader scroll />
          </div>
        )}
      </div>
    </div>
  );
}
