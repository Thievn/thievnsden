"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/admin";

type Settings = {
  maintenance_mode: boolean;
  maintenance_message: string;
  announcement_enabled: boolean;
  announcement_text: string;
  age_gate_enabled: boolean;
};

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [adminBypass, setAdminBypass] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .catch(() => {});

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && isAdmin(session.user)) setAdminBypass(true);
    });

    const dismissed = sessionStorage.getItem("thievn-banner-dismissed");
    if (dismissed) setDismissedBanner(true);
  }, []);

  // Don't block admin routes or admin users
  const onAdmin = pathname?.startsWith("/admin");
  const showMaintenance =
    settings?.maintenance_mode && !adminBypass && !onAdmin;

  if (showMaintenance) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center rounded-2xl border border-neutral-800 bg-[#111] p-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-900/40 to-purple-900/40 border border-neutral-800 flex items-center justify-center">
            <span className="text-lg">☠</span>
          </div>
          <h1 className="text-xl font-semibold text-neutral-100 mb-2">Den closed</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {settings?.maintenance_message || "The Den is closed for a bit. Come back soon."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {settings?.announcement_enabled &&
        settings.announcement_text &&
        !dismissedBanner && (
          <div className="relative z-40 border-b border-red-900/30 bg-gradient-to-r from-red-950/80 via-purple-950/60 to-red-950/80">
            <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-neutral-200 text-center flex-1">
                {settings.announcement_text}
              </p>
              <button
                onClick={() => {
                  setDismissedBanner(true);
                  sessionStorage.setItem("thievn-banner-dismissed", "1");
                }}
                className="text-neutral-500 hover:text-neutral-300 text-sm shrink-0 px-1"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        )}
      {children}
    </>
  );
}
