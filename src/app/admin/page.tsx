"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/admin";
import { AnalyticsTab } from "@/app/admin/AnalyticsTab";
import { GalleryTab } from "@/app/admin/GalleryTab";
import { SeedsTab } from "@/app/admin/SeedsTab";
import { GamingTab } from "@/app/admin/GamingTab";
import type { User } from "@supabase/supabase-js";

type Tab =
  | "overview"
  | "traffic"
  | "gallery"
  | "seeds"
  | "gaming"
  | "users"
  | "judgments"
  | "controls"
  | "reports"
  | "audit";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("gaming");

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user || !isAdmin(session.user)) {
        router.push("/");
        return;
      }
      setUser(session.user);
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-neutral-500 text-sm">
        Checking access…
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "traffic" as const, label: "Traffic" },
    { id: "gallery" as const, label: "Gallery" },
    { id: "seeds" as const, label: "Seeds" },
    { id: "gaming" as const, label: "Gaming" },
    { id: "users" as const, label: "Users" },
    { id: "judgments" as const, label: "Judgments" },
    { id: "controls" as const, label: "Controls" },
    { id: "reports" as const, label: "Reports" },
    { id: "audit" as const, label: "Audit" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-purple-400">
          Admin
        </h1>
        <p className="text-neutral-500 text-sm mt-1">Full control of the Den.</p>
      </div>

      <div className="flex flex-wrap gap-1 mb-6 p-1 rounded-xl bg-[#111] border border-neutral-800/80 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-gradient-to-r from-red-900/40 to-purple-900/40 text-neutral-100"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "gaming" && <GamingTab />}
      {tab === "traffic" && <AnalyticsTab />}
      {tab === "gallery" && <GalleryTab />}
      {tab === "seeds" && <SeedsTab />}

      {tab !== "gaming" && tab !== "traffic" && tab !== "gallery" && tab !== "seeds" && (
        <div className="rounded-2xl border border-neutral-800/80 bg-[#111] p-8 space-y-3">
          <p className="text-sm text-neutral-300">
            This tab is being restored. Use <span className="text-red-300">Gaming</span>, Gallery, Seeds, or Traffic for now.
          </p>
          <p className="text-xs text-neutral-600">
            Overview / Users / Judgments / Controls / Reports / Audit will return in the next push.
          </p>
        </div>
      )}
    </div>
  );
}
