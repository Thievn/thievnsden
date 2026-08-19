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
    }, 300);
  };

  const handleLeave = () => {
    window.location.href = "https://www.google.com";
  };

  if (!mounted || !show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 bg-[#050505]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(185,28,92,0.09)_0%,_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(124,58,237,0.06)_0%,_transparent_50%)]" />

      <div className="relative z-10 w-full max-w-[340px] sm:max-w-md age-gate-card">
        <div className="rounded-2xl border border-[#2a1a28] bg-[#0c0c0c]/95 backdrop-blur-xl px-5 py-7 sm:p-8 text-center shadow-2xl">
          <div className="mb-5 sm:mb-7 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-purple-900/20 blur-xl scale-150" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-purple-900/30 bg-gradient-to-b from-purple-950/40 via-red-950/30 to-[#0c0c0c] flex items-center justify-center">
                <span className="text-xl sm:text-2xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-red-300 to-purple-300">
                  18+
                </span>
              </div>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-100 mb-2.5">
            Enter the Den
          </h1>

          <p className="text-neutral-400 text-sm leading-relaxed mb-6 max-w-xs mx-auto">
            Mature themes, dark humor, and adult content.
            <br />
            Only those of age may pass.
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleEnter}
              className="w-full px-5 py-3.5 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white font-medium text-sm sm:text-base transition-all active:scale-[0.98]"
            >
              I am 18 or older
            </button>
            <button
              onClick={handleLeave}
              className="w-full px-5 py-3 rounded-xl border border-neutral-800 text-neutral-400 font-medium text-sm hover:bg-neutral-900/50 hover:text-neutral-300 transition-all active:scale-[0.98]"
            >
              Leave
            </button>
          </div>

          <p className="mt-5 text-[10px] sm:text-[11px] text-neutral-600 tracking-wide">
            By entering you confirm you are of legal age.
          </p>
        </div>
      </div>
    </div>
  );
}
