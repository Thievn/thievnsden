"use client";

import { useEffect, useState } from "react";

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

    // Always show once per session; standalone gets a slightly longer beat
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
      {/* Orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="den-boot-orb-a absolute top-[20%] left-[15%] h-[280px] w-[280px] rounded-full bg-[radial-gradient(circle,_rgba(185,28,92,0.35)_0%,_transparent_70%)] blur-2xl" />
        <div className="den-boot-orb-b absolute bottom-[18%] right-[12%] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,_rgba(124,58,237,0.3)_0%,_transparent_70%)] blur-2xl" />
      </div>

      <div className="relative flex flex-col items-center gap-5 den-boot-core">
        <div className="relative">
          <div className="absolute inset-[-18px] rounded-full border border-red-900/30 den-boot-ring" />
          <div className="absolute inset-[-32px] rounded-full border border-purple-900/20 den-boot-ring-slow" />
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 via-rose-600 to-purple-700 shadow-[0_0_40px_rgba(185,28,92,0.55)] den-boot-orb-core" />
        </div>
        <div className="text-center den-boot-text">
          <p className="text-[11px] uppercase tracking-[0.28em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-1">
            Entering
          </p>
          <p className="text-xl font-semibold tracking-tight text-neutral-50">Thievn&apos;s Den</p>
        </div>
      </div>
    </div>
  );
}
