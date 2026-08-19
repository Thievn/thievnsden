import Link from "next/link";

export default function LootPage() {
  // Sample items for the Loot collection
  // Replace image paths later with real files in /public/loot/
  const items = [
    {
      id: "corsair-case",
      name: "Corsair 4000D / Frame Series",
      category: "PC Builds",
      short: "Clean case that doesn’t scream “gamer” from across the room.",
      review:
        "Solid airflow, good cable management space, and it doesn’t look like a Christmas tree. One of the few cases that still looks intentional after you actually build in it.",
      image: null, // later: "/loot/corsair-case.png"
      link: "#",
      status: "In the Den",
    },
    {
      id: "rog-gpu",
      name: "ASUS ROG / NVIDIA RTX",
      category: "PC Builds",
      short: "The card that actually does the heavy lifting.",
      review:
        "Whatever the current high-end ROG or Founders Edition card is. Power hungry, expensive, and still the reason the rest of the build exists. Worth it if you actually use it.",
      image: null,
      link: "#",
      status: "In the Den",
    },
    {
      id: "anime-figure-1",
      name: "Anime Figure – Sitting Pose",
      category: "Anime / Merch",
      short: "Shelf presence without taking over the entire room.",
      review:
        "Clean sculpt, decent paint, and it doesn’t look like it was rushed out the door. One of the few figures that still looks good after the initial hype dies.",
      image: null,
      link: "#",
      status: "In the Den",
    },
    {
      id: "gaming-headset",
      name: "Wireless Gaming Headset",
      category: "Gaming",
      short: "The one that stayed after the others got returned.",
      review:
        "Comfortable enough for long sessions, mic doesn’t sound like a tin can, and the battery lasts longer than my patience. Not perfect, but it earned its spot.",
      image: null,
      link: "#",
      status: "In the Den",
    },
    {
      id: "mech-keyboard",
      name: "60% / Compact Mechanical Keyboard",
      category: "Gaming",
      short: "Smaller footprint, still satisfying to type on.",
      review:
        "RGB can be dialed back or turned off. The switches feel good and it doesn’t dominate the desk. One of the few keyboards that survived the rotation.",
      image: null,
      link: "#",
      status: "In the Den",
    },
    {
      id: "anime-figure-2",
      name: "Anime Figure – Dual Character",
      category: "Anime / Merch",
      short: "Two characters, one base, less shelf real estate wasted.",
      review:
        "Better than average paint apps and the poses work together. Still a luxury item, but at least it doesn’t feel completely hollow.",
      image: null,
      link: "#",
      status: "In the Den",
    },
  ];

  return (
    <div className="relative">
      {/* Soft background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[420px] bg-[radial-gradient(ellipse_at_center,_rgba(185,28,92,0.06)_0%,_transparent_65%)] pointer-events-none" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.04)_0%,_transparent_70%)] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        {/* ===== BANNER AREA ===== */}
        <div className="mb-14 rounded-2xl overflow-hidden border border-neutral-800/80 bg-[#0d0d0d]">
          <div className="relative aspect-[3/1] sm:aspect-[3.5/1] flex items-center justify-center">
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
          </div>
        </div>

        {/* ===== INTRO ===== */}
        <div className="mb-12 max-w-2xl">
          <p className="text-neutral-400 leading-relaxed">
            This is a private collection, not a storefront. PC parts that survived multiple builds,
            figures that still look good after the hype dies, and gear that didn’t get returned.
            Click an item for the real take.
          </p>
        </div>

        {/* ===== COLLECTION GRID ===== */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {items.map((item) => (
            <div
              key={item.id}
              className="card group rounded-2xl border border-neutral-800/80 bg-[#111] overflow-hidden flex flex-col"
            >
              {/* Image area */}
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
                    <p className="text-xs text-neutral-600">Image coming</p>
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

                <div className="pt-3 border-t border-neutral-800/60">
                  <p className="text-xs text-neutral-600 mb-3 line-clamp-3">
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
            Real product photos and Canva review cards will replace the placeholders.
            Drop images into <code className="text-neutral-400">/public/loot/</code> when ready.
          </p>
        </div>
      </div>
    </div>
  );
}
