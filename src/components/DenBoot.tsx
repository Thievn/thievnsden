"use client";

import { useEffect, useState } from "react";
import { DenMarkSplash } from "@/components/DenMark";

/**
 * Opening animation for the Den.
 * Plays once per browser session (and always when launched as installed PWA).
 */
export function DenBoot() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS
      // @ts-expect-error iOS safari
      window.navigator.standalone === true;

    const seen = sessionStorage.getItem("den_boot_seen");
    if (seen && !standalone) return;

    setShow(true);
    sessionStorage.setItem("den_boot_seen", "1");

    const t1 = setTimeout(() => setLeaving(true), standalone ? 2200 : 1600);
    const t2 = setTimeout(() => setShow(false), standalone ? 2800 : 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-[#050505] transition-opacity duration-500 ${
        leaving ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden
    >
      {/* Soft vignette only — no floating orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(185,28,92,0.08)_0%,_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#050505_75%)]" />
      </div>

      <div className="relative flex flex-col items-center gap-6 den-boot-core">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-[-20px] rounded-full border border-red-900/25 den-boot-ring" />
          <div className="absolute inset-[-36px] rounded-full border border-purple-900/15 den-boot-ring-slow" />
          <DenMarkSplash className="w-14 h-[4.5rem] relative z-10 drop-shadow-[0_0_18px_rgba(185,28,92,0.35)]" />
        </div>
        <div className="text-center den-boot-text">
          <p className="text-[11px] uppercase tracking-[0.28em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-1">
            Entering
          </p>
          <p className="text-xl font-semibold tracking-tight text-neutral-50">Thievn's Den</p>
        </div>
      </div>
    </div>
  );
}
