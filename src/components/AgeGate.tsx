"use client";

import { useEffect, useState } from "react";

export function AgeGate() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const verified = localStorage.getItem("thievn-age-verified");
    if (!verified) {
      setShow(true);
    }
  }, []);

  const handleEnter = () => {
    localStorage.setItem("thievn-age-verified", "true");
    setShow(false);
  };

  const handleLeave = () => {
    window.location.href = "https://www.google.com";
  };

  if (!mounted || !show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 p-8 rounded-2xl border border-neutral-800 bg-[#111] shadow-2xl text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-950/50 border border-red-900/50 mb-4">
            <span className="text-2xl">18+</span>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-100 mb-2">
            Enter the Den
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            This site contains mature themes, dark humor, and adult content.
            You must be 18 or older to continue.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleEnter}
            className="flex-1 px-6 py-3 rounded-xl bg-red-800 hover:bg-red-700 text-white font-medium transition-colors"
          >
            I am 18 or older
          </button>
          <button
            onClick={handleLeave}
            className="flex-1 px-6 py-3 rounded-xl border border-neutral-700 hover:bg-neutral-900 text-neutral-300 font-medium transition-colors"
          >
            Leave
          </button>
        </div>

        <p className="mt-6 text-xs text-neutral-600">
          By entering you agree that you are of legal age in your jurisdiction.
        </p>
      </div>
    </div>
  );
}
