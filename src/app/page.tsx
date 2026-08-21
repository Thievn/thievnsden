import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Thievn's Den — Dark humor, AI art, and unfiltered thoughts" },
  description:
    "Thievn's Den is a personal site for dark humor, honest essays, AI-generated art, gaming takes, and tools like Face The Den. Unfiltered, not corporate.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Thievn's Den",
    description:
      "Dark humor, honest writing, AI art, gaming, and experimental tools. Welcome to the Den.",
    url: "https://thievnsden.com",
  },
};

export default function HomePage() {
  return (
    <div className="relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[900px] h-[320px] sm:h-[420px] bg-[radial-gradient(ellipse_at_center,_rgba(185,28,92,0.07)_0%,_transparent_65%)] pointer-events-none" />
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[240px] sm:h-[300px] bg-[radial-gradient(ellipse_at_center,_rgba(124,58,237,0.05)_0%,_transparent_70%)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <section className="py-16 sm:py-24 md:py-32 text-center">
          <p className="animate-fade-in-up text-[11px] sm:text-xs uppercase tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-4 sm:mb-6 font-medium">
            Welcome to the Den
          </p>
          <h1 className="animate-fade-in-up animate-delay-100 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-neutral-50 mb-5 sm:mb-7 leading-[1.15]">
            Dark thoughts.
            <br />
            <span className="text-neutral-500">Cynical humor.</span>
            <br />
            Unfiltered takes.
          </h1>
          <p className="animate-fade-in-up animate-delay-200 max-w-md sm:max-w-lg mx-auto text-neutral-400 text-base sm:text-lg leading-relaxed mb-8 sm:mb-12 px-2">
            A corner of the internet for honest writing, AI art, gaming, loot picks,
            and the things people think but won&apos;t say out loud.
          </p>
          <div className="animate-fade-in-up animate-delay-300 flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 px-4">
            <Link
              href="/thoughts"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white font-medium text-center transition-all hover:from-red-600 hover:via-red-700 hover:to-purple-800 active:scale-[0.98]"
            >
              Read Thoughts
            </Link>
            <Link
              href="/loot"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-neutral-800 text-neutral-300 font-medium text-center hover:bg-neutral-900/60 hover:border-neutral-700 hover:text-neutral-100 transition-all active:scale-[0.98]"
            >
              Browse Loot
            </Link>
          </div>
        </section>

        <section className="pb-16 sm:pb-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <Link
            href="/thoughts"
            className="card group p-5 sm:p-6 rounded-2xl border border-neutral-800/80 bg-[#111]"
          >
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 text-[11px] font-medium tracking-wide uppercase mb-2.5">
              Thoughts
            </div>
            <h2 className="text-lg sm:text-xl font-medium text-neutral-100 mb-2 group-hover:text-red-300 transition-colors duration-200">
              Short rants & observations
            </h2>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Dark humor, AI takes, and the occasional unfiltered opinion from the Den.
            </p>
          </Link>

          <Link
            href="/loot"
            className="card group p-5 sm:p-6 rounded-2xl border border-neutral-800/80 bg-[#111]"
          >
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 text-[11px] font-medium tracking-wide uppercase mb-2.5">
              Loot
            </div>
            <h2 className="text-lg sm:text-xl font-medium text-neutral-100 mb-2 group-hover:text-red-300 transition-colors duration-200">
              Things I actually use
            </h2>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Gaming gear, anime merch, tools, and honest recommendations — no fake lists.
            </p>
          </Link>

          <Link
            href="/gaming"
            className="card group p-5 sm:p-6 rounded-2xl border border-neutral-800/80 bg-[#111]"
          >
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 text-[11px] font-medium tracking-wide uppercase mb-2.5">
              Gaming
            </div>
            <h2 className="text-lg sm:text-xl font-medium text-neutral-100 mb-2 group-hover:text-red-300 transition-colors duration-200">
              Builds, rants, takes
            </h2>
            <p className="text-neutral-500 text-sm leading-relaxed">
              What I&apos;m playing, what&apos;s broken, and what&apos;s actually worth the time.
            </p>
          </Link>

          <Link
            href="/playground"
            className="card group p-5 sm:p-6 rounded-2xl border border-neutral-800/80 bg-[#111] sm:col-span-2 lg:col-span-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 text-[11px] font-medium tracking-wide uppercase mb-2.5">
                  Experiments
                </div>
                <h2 className="text-lg sm:text-xl font-medium text-neutral-100 mb-2 group-hover:text-red-300 transition-colors duration-200">
                  Face The Den
                </h2>
                <p className="text-neutral-500 text-sm leading-relaxed max-w-xl">
                  Optional side experiment — upload, get judged, browse the gallery. Not the whole site.
                </p>
              </div>
              <span className="text-sm text-neutral-500 group-hover:text-neutral-300 shrink-0">Open →</span>
            </div>
          </Link>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="rounded-2xl border border-neutral-800/80 bg-[#0d0d0d] p-6 sm:p-8 text-center glow-accent">
            <p className="text-neutral-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              This is a living space. Expect AI art drops, gaming takes, affiliate picks,
              and the occasional experiment. Nothing here is polished corporate content —
              just the Den. Mature themes. 18+.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
