import Link from "next/link";

export default function LootPage() {
  // Placeholder items — replace image paths later with real Canva exports
  // Recommended folder: /public/loot/
  const items = [
    {
      id: "item-1",
      name: "Example Item One",
      category: "Tools",
      short: "Something that actually earned a permanent spot in the Den.",
      review:
        "Honest take goes here. Keep it short, a little cynical, and useful. Link below goes to the real product.",
      image: null, // later: "/loot/item-1.png"
      link: "#",
      status: "Coming soon",
    },
    {
      id: "item-2",
      name: "Example Item Two",
      category: "Gaming",
      short: "Another thing that survived the cut.",
      review:
        "Placeholder review. When the real Canva card is ready, drop the image in /public/loot/ and update the path.",
      image: null,
      link: "#",
      status: "Coming soon",
    },
    {
      id: "item-3",
      name: "Example Item Three",
      category: "Anime / Merch",
      short: "Looks good on a shelf. Doesn’t feel like pure consumerism… mostly.",
      review:
        "Short review text. The card below is structured so a Canva review graphic can sit on top later if you want.",
      image: null,
      link: "#",
      status: "Coming soon",
    },
  ];

  return (
    <div className="relative">
      {/* Soft background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-[radial-gradient(ellipse_at_center,_rgba(185,28,92,0.06)_0%,_transparent_65%)] pointer-events-none" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.04)_0%,_transparent_70%)] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        {/* ===== BANNER AREA ===== */}
        {/* Drop a Canva banner here later as /public/loot/banner.png */}
        <div className="mb-14 rounded-2xl overflow-hidden border border-neutral-800/80 bg-[#0d0d0d]">
          <div className="relative aspect-[3/1] sm:aspect-[3.5/1] flex items-center justify-center">
            {/* Placeholder banner content */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0c0c0c] via-[#111] to-[#0a0a0a]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,_rgba(185,28,92,0.12)_0%,_transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_60%,_rgba(124,58,237,0.08)_0%,_transparent_50%)]" />

            <div className="relative z-10 text-center px-6">
              <p className="text-xs uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-3 font-medium">
                From the Den
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-neutral-50 mb-3">
                Loot
              </h1>
              <p className="text-neutral-500 text-sm sm:text-base max-w-md mx-auto">
                Things that actually earned a place. No fake top-10 lists.
              </p>
            </div>

            {/* Tiny indicator that this is a banner slot */}
            <div className="absolute bottom-3 right-4 text-[10px] text-neutral-700 tracking-wide">
              Banner slot · replace with Canva export
            </div>
          </div>
        </div>

        {/* ===== INTRO ===== */}
        <div className="mb-12 max-w-2xl">
          <p className="text-neutral-400 leading-relaxed">
            This is a private collection, not a storefront. Everything here is something I&apos;ve used,
            tested, or kept around for a reason. Click an item for the real take and a link if you want it.
          </p>
        </div>

        {/* ===== COLLECTION GRID ===== */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {items.map((item) => (
            <div
              key={item.id}
              className="card group rounded-2xl border border-neutral-800/80 bg-[#111] overflow-hidden flex flex-col"
            >
              {/* Image area — drop Canva card or product photo here later */}
              <div className="relative aspect-[4/3] bg-[#0a0a0a] border-b border-neutral-800/60 flex items-center justify-center">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center px-4">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full border border-neutral-800 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-br from-red-500 to-purple-500 opacity-60" />
                    </div>
                    <p className="text-xs text-neutral-600">Image / Canva card</p>
                  </div>
                )}
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 uppercase tracking-wide">
                    {item.category}
                  </span>
                  <span className="text-[11px] text-neutral-600">{item.status}</span>
                </div>

                <h2 className="text-lg font-medium text-neutral-100 mb-2 group-hover:text-red-300 transition-colors">
                  {item.name}
                </h2>

                <p className="text-sm text-neutral-500 leading-relaxed mb-4 flex-1">
                  {item.short}
                </p>

                {/* This can later expand into a full review view or modal */}
                <div className="pt-3 border-t border-neutral-800/60">
                  <p className="text-xs text-neutral-600 mb-3 line-clamp-2">
                    {item.review}
                  </p>
                  <a
                    href={item.link}
                    className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-red-300 transition-colors"
                  >
                    View item
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ===== NOTE ===== */}
        <div className="rounded-2xl border border-neutral-800/80 bg-[#0d0d0d] p-8 text-center">
          <p className="text-neutral-500 text-sm max-w-lg mx-auto leading-relaxed">
            Real product cards and Canva review graphics will land here.
            Structure is ready — just drop the images into <code className="text-neutral-400">/public/loot/</code> and update the paths.
          </p>
        </div>
      </div>
    </div>
  );
}
