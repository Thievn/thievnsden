"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/admin";

type Settings = {
  maintenance_mode: boolean;
  maintenance_message: string;
  age_gate_enabled: boolean;
};

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [adminBypass, setAdminBypass] = useState(false);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .catch(() => {});

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && isAdmin(session.user)) setAdminBypass(true);
    });
  }, []);

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
            {settings?.maintenance_message ||
              "The Den is closed for a bit. Come back soon."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
