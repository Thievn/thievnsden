"use client";

import { useEffect, useState } from "react";

export function AgeGate() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    setMounted(true);
    const verified = localStorage.getItem("thievn-age-verified");
    if (!verified) {
      setShow(true);
    }
  }, []);

  const handleEnter = () => {
    setExiting(true);
    setTimeout(() => {
      localStorage.setItem("thievn-age-verified", "true");
      setShow(false);
    }, 350);
  };

  const handleLeave = () => {
    window.location.href = "https://www.google.com";
  };

  if (!mounted || !show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-350 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Deep atmospheric background */}
      <div className="absolute inset-0 bg-[#050505]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(196,30,58,0.08)_0%,_transparent_70%)]" />
      <div className="absolute inset-0 noise" />

      {/* Card */}
      <div className="relative z-10 max-w-md w-full mx-4 age-gate-card">
        <div className="rounded-2xl border border-[#2a1a1a] bg-[#0c0c0c]/95 backdrop-blur-xl p-8 sm:p-10 text-center shadow-2xl">
          {/* Icon */}
          <div className="mb-7 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-red-900/20 blur-xl scale-150" />
              <div className="relative w-20 h-20 rounded-full border border-red-900/40 bg-gradient-to-b from-red-950/60 to-[#0c0c0c] flex items-center justify-center">
                <span className="text-2xl font-semibold tracking-tight text-red-400/90">
                  18+
                </span>
              </div>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-100 mb-3">
            Enter the Den
          </h1>

          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8 max-w-sm mx-auto">
            This space contains mature themes, dark humor, and adult content.
            <br />
            Only those of age may pass.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleEnter}
              className="flex-1 group relative px-6 py-3.5 rounded-xl bg-gradient-to-b from-red-700 to-red-900 text-white font-medium overflow-hidden transition-all hover:from-red-600 hover:to-red-800 active:scale-[0.98]"
            >
              <span className="relative z-10">I am 18 or older</span>
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
            </button>
            <button
              onClick={handleLeave}
              className="flex-1 px-6 py-3.5 rounded-xl border border-neutral-800 bg-transparent text-neutral-400 font-medium hover:bg-neutral-900/50 hover:text-neutral-300 hover:border-neutral-700 transition-all active:scale-[0.98]"
            >
              Leave
            </button>
          </div>

          <p className="mt-7 text-[11px] text-neutral-600 tracking-wide">
            By entering you confirm you are of legal age in your jurisdiction.
          </p>
        </div>
      </div>
    </div>
  );
}
