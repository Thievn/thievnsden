"use client";

import Link from "next/link";
import { RanksList } from "@/components/RanksList";

export default function LeaderboardPage() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-[10%] h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,_rgba(185,28,92,0.08)_0%,_transparent_70%)] blur-2xl" />
        <div className="absolute bottom-[10%] left-[5%] h-[240px] w-[240px] rounded-full bg-[radial-gradient(circle,_rgba(234,88,12,0.06)_0%,_transparent_70%)] blur-2xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <RanksList showHeader />

        <p className="text-center mt-10 space-x-4">
          <Link href="/playground" className="text-sm text-neutral-500 hover:text-neutral-300">
            ← Playground
          </Link>
          <Link href="/gallery" className="text-sm text-neutral-500 hover:text-neutral-300">
            Gallery
          </Link>
        </p>
      </div>
    </div>
  );
}
