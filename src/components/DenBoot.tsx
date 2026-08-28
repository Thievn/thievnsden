"use client";

import { useEffect, useState } from "react";
import { DenMarkSplash } from "@/components/DenMark";

/**
 * Opening animation for the Den.
 * Plays once per browser session (and always when launched as installed PWA).
 */
let bootLeave: (() => void) | null = null;
let bootHide: (() => void) | null = null;
let bootTimer: number | null = null;

export function DenBoot() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS safari
      window.navigator.standalone === true;

    if (sessionStorage.getItem("den_boot_seen") === "1" && !standalone) return;

    bootLeave = () => setLeaving(true);
    bootHide = () => {
      sessionStorage.setItem("den_boot_seen", "1");
      setShow(false);
    };

    setShow(true);

    if (bootTimer == null) {
      const hideAt = standalone ? 2800 : 2400;
      bootTimer = window.setTimeout(() => {
        bootLeave?.();
        window.setTimeout(() => {
          bootHide?.();
          bootTimer = null;
        }, 600);
      }, hideAt);
    }
  }, []);

  if (!show) return null;

  return (
    <div
      id="den-boot"
      className={`fixed inset-0 z-[200] overflow-hidden bg-[#050505] transition-opacity duration-500 ${
        leaving ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(185,28,92,0.16)_0%,_transparent_58%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_#050505_78%)]" />

      <div className="den-boot-door den-boot-door-l" />
      <div className="den-boot-door den-boot-door-r" />
      <div className="den-boot-leak" />

      <div className="relative z-30 flex h-full flex-col items-center justify-center gap-6 den-boot-core">
        <DenMarkSplash className="w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 drop-shadow-[0_0_28px_rgba(225,29,72,0.45)]" />
        <div className="text-center den-boot-text">
          <p className="text-[11px] uppercase tracking-[0.38em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-purple-400 mb-1.5">
            Come in
          </p>
          <p className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-50">Thievn&apos;s Den</p>
        </div>
      </div>
    </div>
  );
}
