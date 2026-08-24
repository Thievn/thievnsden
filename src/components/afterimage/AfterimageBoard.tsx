"use client";

import { useState } from "react";
import { AfterimagePeek, PeekThumb } from "./AfterimagePeek";

export function AfterimageBoard({
  board,
}: {
  board: { id: string; image_url: string; username?: string; want?: string; style_id?: string }[];
}) {
  const [open, setOpen] = useState<string | null>(null);

  const save = (url: string, username?: string) => {
    const name = (username || "afterimage").replace(/[^a-z0-9-_ ]/gi, "").slice(0, 32) || "afterimage";
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.jpg`;
    a.rel = "noopener";
    a.click();
  };

  return (
    <section className="mt-16">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-200 to-amber-200">The board</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {board.length === 0 && (
          <p className="text-sm text-neutral-500">Nothing up yet.</p>
        )}
        {board.map((p) => (
          <div key={p.id} className="ai-card snap-start shrink-0 w-[160px] rounded-2xl overflow-hidden border border-white/10 bg-black/60">
            <PeekThumb src={p.image_url} onOpen={() => setOpen(p.image_url)} imgClass="w-full aspect-[9/16] object-cover" />
            <div className="px-2 py-2 flex items-center justify-between gap-1">
              <p className="text-[11px] text-fuchsia-200/80 truncate">{p.username || "anon"}</p>
              <button
                type="button"
                onClick={() => save(p.image_url, p.username)}
                className="text-[10px] text-amber-200/90 shrink-0"
              >
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
      <AfterimagePeek src={open} onClose={() => setOpen(null)} />
    </section>
  );
}
