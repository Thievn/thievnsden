"use client";

import Link from "next/link";
import { WyrGame } from "@/components/playground/WyrGame";

export default function WouldYouRatherPage() {
  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-8rem)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="den-ember absolute bottom-[-20%] left-1/2 h-[55%] w-[120%] max-w-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 100%, rgba(185,28,92,0.22) 0%, rgba(124,20,50,0.08) 35%, transparent 70%)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#070707_78%)]" />
        <div className="den-grain" />
      </div>
      <div className="relative pt-10 sm:pt-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 mb-2">
          <Link href="/playground" className="text-sm text-neutral-500 hover:text-neutral-300">
            ← Playground
          </Link>
        </div>
        <WyrGame />
      </div>
    </div>
  );
}
