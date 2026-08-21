"use client";

import { useState } from "react";

export function ShareBar({
  path,
  title,
  className = "",
}: {
  path: string;
  title?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const absolute =
    typeof window !== "undefined"
      ? `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`
      : `https://thievnsden.com${path.startsWith("/") ? path : `/${path}`}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      prompt("Copy this link:", absolute);
    }
  };

  const shareX = () => {
    const text = encodeURIComponent(title || "From Thievn's Den");
    const url = encodeURIComponent(absolute);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank", "noopener,noreferrer");
  };

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: title || "Thievn's Den", url: absolute });
        return;
      } catch {
        /* user cancelled */
      }
    }
    copy();
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={copy}
        className="px-2.5 py-1.5 rounded-lg text-[11px] border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-all"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
      <button
        type="button"
        onClick={shareX}
        className="px-2.5 py-1.5 rounded-lg text-[11px] border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-all"
      >
        Share on X
      </button>
      <button
        type="button"
        onClick={nativeShare}
        className="px-2.5 py-1.5 rounded-lg text-[11px] border border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600 transition-all sm:hidden"
      >
        Share
      </button>
    </div>
  );
}
