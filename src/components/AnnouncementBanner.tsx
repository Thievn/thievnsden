"use client";

import { useEffect, useState } from "react";

type PublicSettings = {
  announcement_enabled?: boolean;
  announcement_text?: string;
};

export function AnnouncementBanner() {
  const [text, setText] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(true); // hide until loaded

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings/public");
        if (!res.ok) return;
        const data = await res.json();
        const s: PublicSettings = data.settings || {};
        if (!s.announcement_enabled || !s.announcement_text?.trim()) {
          if (!cancelled) setDismissed(true);
          return;
        }
        const msg = s.announcement_text.trim();
        const key = `thievn-banner-${msg.slice(0, 40)}`;
        const wasDismissed = sessionStorage.getItem(key) === "1";
        if (!cancelled) {
          setText(msg);
          setDismissed(wasDismissed);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (dismissed || !text) return null;

  return (
    <div className="relative z-[60] border-b border-red-900/40 bg-[#0c0508]">
      <div className="absolute inset-0 bg-gradient-to-r from-red-950/70 via-purple-950/40 to-red-950/70 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-start sm:items-center gap-3">
        <span
          className="mt-0.5 sm:mt-0 shrink-0 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse"
          aria-hidden
        />
        <p className="flex-1 text-[12px] sm:text-sm text-neutral-200 leading-snug text-left sm:text-center">
          {text}
        </p>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            try {
              sessionStorage.setItem(`thievn-banner-${text.slice(0, 40)}`, "1");
            } catch {}
          }}
          className="shrink-0 text-neutral-500 hover:text-neutral-200 text-lg leading-none px-1.5 py-0.5 rounded-md hover:bg-white/5 transition-colors"
          aria-label="Dismiss announcement"
        >
          ×
        </button>
      </div>
    </div>
  );
}
