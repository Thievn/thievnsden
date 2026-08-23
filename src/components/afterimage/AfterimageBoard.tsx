"use client";

export function AfterimageBoard({
  board,
}: {
  board: { id: string; image_url: string; username?: string; want?: string; style_id?: string }[];
}) {
  return (
    <section className="mt-16">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-200 to-amber-200">The board</h2>
        <p className="text-xs text-neutral-500">Scroll sideways</p>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
        {board.length === 0 && (
          <p className="text-sm text-neutral-500">Nothing up yet. Print one and share it here.</p>
        )}
        {board.map((p) => (
          <div key={p.id} className="ai-card snap-start shrink-0 w-[160px] rounded-2xl overflow-hidden border border-white/10 bg-black/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image_url} alt="" className="w-full aspect-[9/16] object-cover" />
            <p className="px-2 pt-2 text-[11px] text-fuchsia-200/80">{p.username || "anon"}</p>
            <p className="px-2 pb-2 text-[10px] text-neutral-500 line-clamp-2">{p.want || p.style_id}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
