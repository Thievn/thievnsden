import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <section className="py-20 md:py-28 text-center">
        <p className="text-sm uppercase tracking-widest text-red-500/80 mb-4">
          Welcome to the Den
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-neutral-100 mb-6">
          Dark thoughts.
          <br />
          <span className="text-neutral-400">Cynical humor.</span>
          <br />
          Unfiltered takes.
        </h1>
        <p className="max-w-xl mx-auto text-neutral-400 text-lg leading-relaxed mb-10">
          A corner of the internet for AI-generated anime art, gaming rants,
          and the things people think but won&apos;t say out loud.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/playground"
            className="px-6 py-3 rounded-xl bg-red-800 hover:bg-red-700 text-white font-medium transition-colors"
          >
            Try Roast Me
          </Link>
          <Link
            href="/thoughts"
            className="px-6 py-3 rounded-xl border border-neutral-700 hover:bg-neutral-900 text-neutral-200 font-medium transition-colors"
          >
            Read Thoughts
          </Link>
        </div>
      </section>

      <section className="pb-20 grid md:grid-cols-3 gap-6">
        <Link
          href="/thoughts"
          className="card group p-6 rounded-2xl border border-neutral-800 bg-[#141414] hover:border-neutral-700"
        >
          <div className="text-red-500/80 text-sm font-medium mb-2">Thoughts</div>
          <h2 className="text-xl font-medium text-neutral-100 mb-2 group-hover:text-red-400 transition-colors">
            Short rants & observations
          </h2>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Dark humor, AI takes, and the occasional unfiltered opinion.
          </p>
        </Link>

        <Link
          href="/loot"
          className="card group p-6 rounded-2xl border border-neutral-800 bg-[#141414] hover:border-neutral-700"
        >
          <div className="text-red-500/80 text-sm font-medium mb-2">Loot</div>
          <h2 className="text-xl font-medium text-neutral-100 mb-2 group-hover:text-red-400 transition-colors">
            Things I actually use
          </h2>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Gaming gear, anime merch, tools, and honest recommendations.
          </p>
        </Link>

        <Link
          href="/playground"
          className="card group p-6 rounded-2xl border border-neutral-800 bg-[#141414] hover:border-neutral-700"
        >
          <div className="text-red-500/80 text-sm font-medium mb-2">Playground</div>
          <h2 className="text-xl font-medium text-neutral-100 mb-2 group-hover:text-red-400 transition-colors">
            Fun little tools
          </h2>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Get roasted by the Den. More toys coming soon.
          </p>
        </Link>
      </section>

      <section className="pb-20">
        <div className="rounded-2xl border border-neutral-800 bg-[#111] p-8 text-center">
          <p className="text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            This is a living space. Expect AI art drops, gaming takes, affiliate picks,
            and the occasional experiment. Nothing here is polished corporate content —
            just the Den.
          </p>
        </div>
      </section>
    </div>
  );
}
