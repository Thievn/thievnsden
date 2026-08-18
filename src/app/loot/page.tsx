export default function LootPage() {
  const items = [
    {
      category: "PC & Gaming",
      title: "What I actually run",
      description:
        "Current build notes, the parts that didn’t suck, and the ones I regret. Honest takes only.",
      status: "Coming soon",
    },
    {
      category: "Anime & Merch",
      title: "Figures & merch picks",
      description:
        "Things that look good on a shelf and don’t feel like pure consumerism... mostly.",
      status: "Coming soon",
    },
    {
      category: "Tools & Toys",
      title: "Useful & questionable",
      description:
        "AI tools, adult toys, software, and random gear that somehow earned a permanent spot.",
      status: "Coming soon",
    },
    {
      category: "Affiliate Note",
      title: "Transparency",
      description:
        "Some links will be affiliate links. I’ll always mark them. I only recommend things I’ve used or would actually buy.",
      status: "Always on",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <h1 className="text-3xl font-semibold text-neutral-100 mb-3">Loot</h1>
        <p className="text-neutral-400 max-w-xl">
          Curated recommendations and the stuff I actually keep around.
          No fake “top 10” lists.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        {items.map((item, i) => (
          <div
            key={i}
            className="card p-6 rounded-2xl border border-neutral-800 bg-[#141414]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-red-500/80 uppercase tracking-wide">
                {item.category}
              </span>
              <span className="text-xs text-neutral-600">{item.status}</span>
            </div>
            <h2 className="text-lg font-medium text-neutral-100 mb-2">
              {item.title}
            </h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 p-6 rounded-2xl border border-neutral-800 bg-[#111] text-center">
        <p className="text-neutral-400 text-sm">
          Real product cards and affiliate links will land here soon.
          For now this is the placeholder skeleton.
        </p>
      </div>
    </div>
  );
}
