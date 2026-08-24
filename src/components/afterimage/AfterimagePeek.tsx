"use client";

import { useEffect, useRef } from "react";

export function AfterimagePeek({
  src,
  onClose,
}: {
  src: string | null;
  onClose: () => void;
}) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!src) {
      pushed.current = false;
      return;
    }

    if (!pushed.current) {
      try {
        window.history.pushState({ afterimagePeek: true }, "");
        pushed.current = true;
      } catch {
        pushed.current = false;
      }
    }

    const onPop = () => {
      pushed.current = false;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
    };
  }, [src, onClose]);

  const close = () => {
    if (pushed.current) {
      pushed.current = false;
      window.history.back();
      return;
    }
    onClose();
  };

  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-black/88 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
      <button
        type="button"
        aria-label="Close preview"
        onClick={close}
        className="absolute top-3 right-3 z-[81] w-11 h-11 rounded-full bg-black/70 border border-white/20 text-white text-2xl leading-none"
      >
        ×
      </button>
      <button type="button" aria-label="Close preview" onClick={close} className="absolute inset-0" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="relative z-[81] max-h-[88vh] max-w-[92vw] object-contain rounded-2xl shadow-[0_0_80px_-12px_rgba(244,114,182,0.55)] pointer-events-none"
      />
    </div>
  );
}

export function PeekThumb({
  src,
  onOpen,
  className = "",
  imgClass = "w-full h-full object-cover",
}: {
  src: string;
  onOpen: () => void;
  className?: string;
  imgClass?: string;
}) {
  return (
    <button type="button" onClick={onOpen} className={`ai-peek group relative block overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className={imgClass} />
      <span className="ai-peek-glow" />
    </button>
  );
}
