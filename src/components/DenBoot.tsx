"use client";

import { useEffect, useState } from "react";
import { DenMarkSplash } from "@/components/DenMark";

/**
 * Opening animation for the Den.
 * Plays once per browser session, and on every PWA launch.
 */
export function DenBoot() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS safari
      window.navigator.standalone === true;

    if (sessionStorage.getItem("den_boot_seen") === "1" && !standalone) return;

    setShow(true);
    const hideAt = standalone ? 3200 : 2800;
    const goneAt = hideAt + 600;
    const t1 = window.setTimeout(() => setLeaving(true), hideAt);
    const t2 = window.setTimeout(() => {
      sessionStorage.setItem("den_boot_seen", "1");
      setShow(false);
    }, goneAt);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
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
      <div className="pointer-events-none absolute inset-0 den-boot-wash" />
      <div className="pointer-events-none absolute inset-0 den-boot-wash-2" />
      <div className="pointer-events-none absolute inset-0 den-boot-vignette" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-8 den-boot-core">
        <DenMarkSplash className="h-28 w-[5.3rem] sm:h-36 sm:w-[6.8rem]" />
        <div className="text-center den-boot-text">
          <p className="text-[11px] uppercase tracking-[0.42em] text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-rose-300 to-violet-400 mb-1.5">
            Come in
          </p>
          <p className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-50">Thievn&apos;s Den</p>
        </div>
      </div>
    </div>
  );
}
