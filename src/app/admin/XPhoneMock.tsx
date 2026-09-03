"use client";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ASPECT_CLASS: Record<string, string> = {
  "16:9": "aspect-[16/9]",
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
  "9:16": "aspect-[9/16]",
};

export function XPhoneMock({
  body,
  image,
  aspect = "16:9",
  handle = "Thievn",
}: {
  body: string;
  image?: string;
  aspect?: string;
  handle?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[390px]">
      <div className="rounded-[2.3rem] border border-white/10 bg-black shadow-[0_20px_60px_-24px_rgba(0,0,0,0.9)] overflow-hidden">
        <div className="h-7 bg-black flex items-end justify-center pb-1">
          <div className="h-4 w-24 rounded-b-2xl bg-neutral-950" />
        </div>
        <div className="bg-[#000] px-3 pb-3">
          <div className="flex items-center justify-between py-2 px-1">
            <span className="text-white text-lg leading-none">‹</span>
            <p className="text-[13px] text-white font-semibold">Post</p>
            <span className="w-4" />
          </div>
          <div className="flex gap-3 pt-1">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-700 to-amber-700 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-[15px] font-bold text-white truncate">Thievn&apos;s Den</p>
                <span className="text-[11px] text-sky-400">✓</span>
              </div>
              <p className="text-[13px] text-neutral-500 truncate">@{handle}</p>
              <p className="mt-2 text-[15px] text-neutral-50 whitespace-pre-wrap leading-snug break-words">{body || " "}</p>
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image}
                  alt=""
                  className={`mt-3 w-full rounded-2xl border border-white/10 object-cover ${ASPECT_CLASS[aspect] || ASPECT_CLASS["16:9"]}`}
                />
              ) : null}
              <p className="mt-3 text-[13px] text-neutral-500">now</p>
              <div className="mt-3 flex items-center justify-between text-neutral-500 px-1">
                <Icon d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
                <Icon d="M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" />
                <Icon d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                <Icon d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                <Icon d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                <Icon d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8 M16 6l-4-4-4 4 M12 2v13" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
