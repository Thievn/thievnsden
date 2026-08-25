"use client";

import { GamingAutoPull } from "@/app/admin/GamingAutoPull";
import { GamingCards } from "@/app/admin/GamingCards";

export function GamingTab() {
  return (
    <div className="space-y-6">
      <GamingAutoPull />
      <GamingCards />
    </div>
  );
}
