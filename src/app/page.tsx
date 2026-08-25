import type { Metadata } from "next";
import Link from "next/link";
import { CLASSICS } from "@/lib/thoughts-packs";
import { createServiceClient } from "@/lib/supabase/server";

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

async function featuredThought() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("den_thoughts")
      .select("title, excerpt, slug")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.title) return data;
  } catch {
    /* fall through */
  }
  const c = CLASSICS[0];
  return { title: c.title, excerpt: c.excerpt, slug: c.slug };
}

export default async function HomePage() {
  const featured = await featuredThought();

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
            and the things people think but won't say out loud.
          </p>
          <div className="animate-fade-in-up animate-delay-300 flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 px-4">
            <Link
              href="/thoughts"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-b from-red-700 via-red-800 to-purple-900 text-white font-medium text-center transition-all hover:from-red-600 hover:via-red-700 hover:to-purple-800 active:scale-[0.98]"
            >
              Read Thoughts
            </Link>
            <Link
              href="/afterimage"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-fuchsia-800/60 text-fuchsia-100 font-medium text-center hover:bg-fuchsia-950/30 hover:border-fuchsia-600 hover:text-white transition-all active:scale-[0.98]"
            >
              Afterimage
            </Link>
          </div>
        </section>

        <section className="pb-16 sm:pb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          <Link href="/thoughts" className="card group p-5 sm:p-6 rounded-2xl border border-neutral-800/80 bg-[#111]">
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 text-[11px] font-medium tracking-wide uppercase mb-2.5">Thoughts</div>
            <h2 className="text-lg sm:text-xl font-medium text-neutral-100 mb-2 group-hover:text-red-300 transition-colors duration-200">Short rants & observations</h2>
            <p className="text-neutral-500 text-sm leading-relaxed">Dark humor, AI takes, and the occasional unfiltered opinion from the Den.</p>
          </Link>
          <Link href="/loot" className="card group p-5 sm:p-6 rounded-2xl border border-neutral-800/80 bg-[#111]">
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 text-[11px] font-medium tracking-wide uppercase mb-2.5">Loot</div>
            <h2 className="text-lg sm:text-xl font-medium text-neutral-100 mb-2 group-hover:text-red-300 transition-colors duration-200">Things I actually use</h2>
            <p className="text-neutral-500 text-sm leading-relaxed">Gaming gear, anime merch, tools, and honest recommendations — no fake lists.</p>
          </Link>
          <Link href="/gaming" className="card group p-5 sm:p-6 rounded-2xl border border-neutral-800/80 bg-[#111]">
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 text-[11px] font-medium tracking-wide uppercase mb-2.5">Gaming</div>
            <h2 className="text-lg sm:text-xl font-medium text-neutral-100 mb-2 group-hover:text-red-300 transition-colors duration-200">Builds, rants, takes</h2>
            <p className="text-neutral-500 text-sm leading-relaxed">What I'm playing, what's broken, and what's actually worth the time.</p>
          </Link>
          <Link href="/afterimage" className="card group p-5 sm:p-6 rounded-2xl border border-fuchsia-900/40 bg-[#111] sm:col-span-2">
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-amber-200 text-[11px] font-medium tracking-wide uppercase mb-2.5">Afterimage</div>
            <h2 className="text-lg sm:text-xl font-medium text-neutral-100 mb-2 group-hover:text-fuchsia-300 transition-colors duration-200">Print a lock screen</h2>
            <p className="text-neutral-500 text-sm leading-relaxed">Pick a look. Take it with you.</p>
          </Link>
          <Link href="/playground" className="card group p-5 sm:p-6 rounded-2xl border border-neutral-800/80 bg-[#111]">
            <div className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 text-[11px] font-medium tracking-wide uppercase mb-2.5">Playground</div>
            <h2 className="text-lg sm:text-xl font-medium text-neutral-100 mb-2 group-hover:text-red-300 transition-colors duration-200">Face The Den</h2>
            <p className="text-neutral-500 text-sm leading-relaxed">Upload a photo. Get judged. Climb the ranks.</p>
          </Link>
        </section>

        <section className="pb-12 sm:pb-16 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          <Link href={`/thoughts/${featured.slug}`} className="lg:col-span-7 card group rounded-3xl border border-rose-900/30 bg-gradient-to-br from-[#1a0b12] to-[#111] p-6 sm:p-9">
            <p className="text-[11px] uppercase tracking-[0.18em] text-rose-300/80 mb-4">On the table</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-50 leading-snug mb-4 group-hover:text-rose-200 transition-colors">{featured.title}</h2>
            {featured.excerpt && <p className="text-neutral-400 text-base leading-relaxed max-w-xl">{featured.excerpt}</p>}
            <p className="mt-6 text-sm text-rose-300/90">Keep reading →</p>
          </Link>
          <Link href="/playground" className="lg:col-span-5 card group rounded-3xl border border-red-800/40 bg-[#14080c] p-6 sm:p-8 flex flex-col justify-between min-h-[220px]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-red-300/80 mb-3">The mirror</p>
              <h2 className="text-2xl font-semibold text-neutral-50 mb-3 group-hover:text-red-200">Face The Den</h2>
              <p className="text-neutral-400 leading-relaxed">Walk in looking pretty. Leave with notes.</p>
            </div>
            <p className="mt-8 text-sm text-red-300">Sit for a roast →</p>
          </Link>
        </section>

        <section className="pb-16 sm:pb-20 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <Link href="/afterimage" className="card group rounded-3xl overflow-hidden border border-fuchsia-900/35 bg-[#111]">
            <div className="h-24 bg-gradient-to-br from-fuchsia-600/40 via-rose-800/30 to-amber-700/20" />
            <div className="p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-fuchsia-300/80 mb-2">Afterimage</p>
              <h2 className="text-xl font-medium text-neutral-50 mb-2 group-hover:text-fuchsia-200">A wall that isn't stock</h2>
              <p className="text-sm text-neutral-500">Print something you'd actually keep on the phone.</p>
            </div>
          </Link>
          <Link href="/playground/would-you-rather" className="card group rounded-3xl overflow-hidden border border-amber-900/35 bg-[#111]">
            <div className="h-24 bg-gradient-to-br from-amber-500/35 via-rose-800/25 to-[#111]" />
            <div className="p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300/80 mb-2">Would You Rather</p>
              <h2 className="text-xl font-medium text-neutral-50 mb-2 group-hover:text-amber-200">Two bad options. Pick anyway.</h2>
              <p className="text-sm text-neutral-500">Out of pocket questions. A scorecard at the end.</p>
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
