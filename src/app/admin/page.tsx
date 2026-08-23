"use client";

import { useState } from "react";
import AdminDashboard from "@/app/admin/AdminDashboard";
import { AfterimageTab } from "@/app/admin/AfterimageTab";
import { LootTab } from "@/app/admin/LootTab";

export default function AdminPage() {
  const [mode, setMode] = useState<"main" | "afterimage" | "loot">("main");
  return (
    <div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("main")}
          className={`px-3 py-1.5 rounded-lg text-xs border ${
            mode === "main" ? "border-red-800/50 text-neutral-100" : "border-neutral-800 text-neutral-500"
          }`}
        >
          Admin tabs
        </button>
        <button
          type="button"
          onClick={() => setMode("afterimage")}
          className={`px-3 py-1.5 rounded-lg text-xs border ${
            mode === "afterimage"
              ? "border-fuchsia-500/50 text-fuchsia-100"
              : "border-neutral-800 text-neutral-500"
          }`}
        >
          Afterimage
        </button>
        <button
          type="button"
          onClick={() => setMode("loot")}
          className={`px-3 py-1.5 rounded-lg text-xs border ${
            mode === "loot" ? "border-amber-500/50 text-amber-100" : "border-neutral-800 text-neutral-500"
          }`}
        >
          Loot
        </button>
      </div>
      {mode === "afterimage" ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <AfterimageTab />
        </div>
      ) : mode === "loot" ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <LootTab />
        </div>
      ) : (
        <AdminDashboard />
      )}
    </div>
  );
}
