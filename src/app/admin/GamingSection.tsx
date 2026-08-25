"use client";

import { GamingAutoPull } from "@/app/admin/GamingAutoPull";
import { GamingTab } from "@/app/admin/GamingTab";

export function GamingSection() {
  return (
    <div className="space-y-6">
      <GamingAutoPull />
      <GamingTab />
    </div>
  );
}
