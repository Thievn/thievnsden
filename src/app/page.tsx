import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative">
      {/* Subtle mixed radial glow (crimson + purple) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[520px] bg-[radial-gradient(ellipse_at_center,_rgba(185,28,92,0.07)_0%,_transparent_65%)] pointer-events-none" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.05)_0%,_transparent_70%)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero */}
        <section className="py-24 md:py-32 text-center">
          <p className="animate-fade-in-up text-xs uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-6 font-medium">
            Welcome to the Den
          </p>
          <h1 className="animate-fade-in-up animate-delay-100 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-neutral-50 mb-7 leading-[1.1]">
            Dark thoughts.
            <br />
            <span className="text-neutral-500">Cynical humor.</span>
            <br />
            Unfiltered takes.
          </h1>
          <p className="animate-fade-in-up animate-delay-200 max-w-lg mx-auto text-neutral-400 text-lg leading-relaxed mb-12">
            A corner of the internet for AI-generated anime art, gaming rants,
            and the things people think but won&apos;t say out loud.
          </p>
          <div className="animate-fade-in-up animate-delay-300 flex flex-wrap justify-center gap-4">
            <Link
              href="/playground"
              className="group relative px-7 py-3.5 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white font-medium overflow-hidden transition-all hover:from-red-600 hover:via-red-700 hover:to-purple-800 active:scale-[0.98]"
            >
              <span className="relative z-10">Try Roast Me</span>
            </Link>
            <Link
              href="/thoughts"
              className="px-7 py-3.5 rounded-xl border border-neutral-800 text-neutral-300 font-medium hover:bg-neutral-900/60 hover:border-neutral-700 hover:text-neutral-100 transition-all active:scale-[0.98]"
            >
              Read Thoughts
            </Link>
          </div>
        </section>

        {/* Featured cards */}
        <section className="pb-24 grid md:grid-cols-3 gap-5">
          <Link
            href="/thoughts"
            className="card group p-7 rounded-2xl border border-neutral-800/80 bg-[#111]"
          >
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 text-xs font-medium tracking-wide uppercase mb-3">
              Thoughts
            </div>
            <h2 className="text-xl font-medium text-neutral-100 mb-3 group-hover:text-red-300 transition-colors duration-200">
              Short rants & observations
            </h2>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Dark humor, AI takes, and the occasional unfiltered opinion from the Den.
            </p>
          </Link>

          <Link
            href="/loot"
            className="card group p-7 rounded-2xl border border-neutral-800/80 bg-[#111]"
          >
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 text-xs font-medium tracking-wide uppercase mb-3">
              Loot
            </div>
            <h2 className="text-xl font-medium text-neutral-100 mb-3 group-hover:text-red-300 transition-colors duration-200">
              Things I actually use
            </h2>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Gaming gear, anime merch, tools, and honest recommendations — no fake lists.
            </p>
          </Link>

          <Link
            href="/playground"
            className="card group p-7 rounded-2xl border border-neutral-800/80 bg-[#111]"
          >
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 text-xs font-medium tracking-wide uppercase mb-3">
              Playground
            </div>
            <h2 className="text-xl font-medium text-neutral-100 mb-3 group-hover:text-red-300 transition-colors duration-200">
              Fun little tools
            </h2>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Get roasted by the Den. More toys and experiments coming soon.
            </p>
          </Link>
        </section>

        {/* Bottom note */}
        <section className="pb-24">
          <div className="rounded-2xl border border-neutral-800/80 bg-[#0d0d0d] p-8 sm:p-10 text-center glow-accent">
            <p className="text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              This is a living space. Expect AI art drops, gaming takes, affiliate picks,
              and the occasional experiment. Nothing here is polished corporate content —
              just the Den.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
