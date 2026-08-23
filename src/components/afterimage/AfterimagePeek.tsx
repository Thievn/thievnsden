"use client";

import { useEffect } from "react";

export function AfterimagePeek({
  src,
  onClose,
}: {
  src: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [src, onClose]);

  if (!src) return null;
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] max-w-[92vw] object-contain rounded-2xl shadow-[0_0_80px_-12px_rgba(244,114,182,0.55)]"
      />
    </button>
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
