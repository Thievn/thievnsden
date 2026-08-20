"use client";

import { useState } from "react";

export function ShareActions({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/g/${id}`
      : `https://thievnsden.com/g/${id}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        typeof window !== "undefined"
          ? `${window.location.origin}/g/${id}`
          : url
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Copy this link:", `https://thievnsden.com/g/${id}`);
    }
  };

  const tweet = () => {
    const text = encodeURIComponent("Judged in the Den.");
    const link = encodeURIComponent(`https://thievnsden.com/g/${id}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${link}`, "_blank");
  };

  return (
    <div className="mt-5 flex gap-2 justify-center">
      <button
        onClick={copy}
        className="px-4 py-2 rounded-xl text-sm border border-neutral-800 text-neutral-300 hover:border-neutral-600 transition-all"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
      <button
        onClick={tweet}
        className="px-4 py-2 rounded-xl text-sm border border-neutral-800 text-neutral-300 hover:border-neutral-600 transition-all"
      >
        Share on X
      </button>
    </div>
  );
}
