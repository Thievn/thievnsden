"use client";

import Link from "next/link";
import { WyrGame } from "@/components/playground/WyrGame";
import "./floor.css";

export default function WouldYouRatherPage() {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="floor-rig absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.16),_transparent_70%)]" />
        <div
          className="den-ember absolute bottom-[-18%] left-1/2 h-[60%] w-[140%]"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 100%, rgba(185,28,92,0.38) 0%, rgba(124,20,50,0.12) 40%, transparent 72%)",
          }}
        />
        <div className="wyr-pulse-a absolute top-[8%] left-[8%] h-56 w-56 rounded-full blur-3xl bg-amber-600/20" />
        <div className="wyr-pulse-b absolute top-[18%] right-[6%] h-64 w-64 rounded-full blur-3xl bg-violet-700/22" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#070707_82%)]" />
        <div className="den-grain" />
      </div>
      <div className="relative pt-8 sm:pt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-3">
          <Link href="/playground" className="text-sm text-neutral-500 hover:text-neutral-300">
            ← Playground
          </Link>
        </div>
        <WyrGame />
      </div>
    </div>
  );
}
