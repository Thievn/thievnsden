"use client";

import { Suspense, useState } from "react";
import AdminDashboard from "@/app/admin/AdminDashboard";
import { AfterimageTab } from "@/app/admin/AfterimageTab";
import { LootTab } from "@/app/admin/LootTab";
import { ThoughtsTab } from "@/app/admin/ThoughtsTab";
import { XThoughtsTab } from "@/app/admin/XThoughtsTab";
import { CatalogSeed } from "@/components/afterimage/CatalogSeed";
import { BulkUpload } from "@/components/afterimage/BulkUpload";

function AdminShell() {
  const [mode, setMode] = useState<"main" | "afterimage" | "loot" | "thoughts" | "xthoughts">("main");
  return (
    <div data-admin-shell="xpic-v3">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 flex flex-wrap gap-2">
        <button type="button" onClick={() => setMode("main")} className={`px-3 py-1.5 rounded-lg text-xs border ${
          mode === "main" ? "border-red-800/50 text-neutral-100" : "border-neutral-800 text-neutral-500"
        }`}>Admin tabs</button>
        <button type="button" onClick={() => setMode("afterimage")} className={`px-3 py-1.5 rounded-lg text-xs border ${
          mode === "afterimage" ? "border-fuchsia-500/50 text-fuchsia-100" : "border-neutral-800 text-neutral-500"
        }`}>Afterimage</button>
        <button type="button" onClick={() => setMode("loot")} className={`px-3 py-1.5 rounded-lg text-xs border ${
          mode === "loot" ? "border-amber-500/50 text-amber-100" : "border-neutral-800 text-neutral-500"
        }`}>Loot</button>
        <button type="button" onClick={() => setMode("thoughts")} className={`px-3 py-1.5 rounded-lg text-xs border ${
          mode === "thoughts" ? "border-rose-500/50 text-rose-100" : "border-neutral-800 text-neutral-500"
        }`}>Thoughts</button>
        <button type="button" onClick={() => setMode("xthoughts")} className={`px-3 py-1.5 rounded-lg text-xs border ${
          mode === "xthoughts" ? "border-sky-500/50 text-sky-100" : "border-neutral-800 text-neutral-500"
        }`}>X Thoughts</button>
      </div>
      {mode === "afterimage" ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <BulkUpload />
          <CatalogSeed />
          <AfterimageTab />
        </div>
      ) : mode === "loot" ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <LootTab />
        </div>
      ) : mode === "thoughts" ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <ThoughtsTab />
        </div>
      ) : mode === "xthoughts" ? (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <XThoughtsTab />
        </div>
      ) : (
        <AdminDashboard />
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-20 text-sm text-neutral-500">Opening admin…</div>}>
      <AdminShell />
    </Suspense>
  );
}
