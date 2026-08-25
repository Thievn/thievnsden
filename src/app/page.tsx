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

async function latestThought() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("den_thoughts")
      .select("title")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.title || CLASSICS[0].title;
  } catch {
    return CLASSICS[0].title;
  }
}

function Wash({ className }: { className: string }) {
  return <div className={`h-16 sm:h-20 ${className}`} />;
}

export default async function HomePage() {
  const thoughtLine = await latestThought();

  return (
    <div className="relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] max-w-[920px] h-[380px] sm:h-[480px] den-ember pointer-events-none bg-[radial-gradient(ellipse_at_center,_rgba(185,28,92,0.16)_0%,_rgba(124,58,237,0.06)_42%,_transparent_70%)]" />
      <div className="den-grain h-[480px] sm:h-[560px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <section className="py-16 sm:py-24 md:py-28 text-center">
          <p className="animate-fade-in-up text-[11px] sm:text-xs uppercase tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-4 sm:mb-6 font-medium">
            Welcome to the Den
          </p>
          <h1 className="animate-fade-in-up animate-delay-100 den-title-glow text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-neutral-50 mb-5 sm:mb-7 leading-[1.15]">
            Dark thoughts.
            <br />
            <span className="text-neutral-500">Cynical humor.</span>
            <br />
            Unfiltered takes.
          </h1>
          <p className="animate-fade-in-up animate-delay-200 max-w-md sm:max-w-lg mx-auto text-neutral-400 text-base sm:text-lg leading-relaxed mb-8 sm:mb-10 px-2">
            A corner of the internet for honest writing, AI art, gaming, loot picks,
            and the things people think but won't say out loud.
          </p>

          <div className="animate-fade-in-up animate-delay-300 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
            <Link href="/playground" className="px-5 py-4 rounded-2xl bg-gradient-to-b from-red-700 via-red-800 to-red-950 text-white font-medium text-center active:scale-[0.98] border border-red-500/30 shadow-[0_0_24px_-8px_rgba(185,28,92,0.7)]">
              Get roasted
            </Link>
            <Link href="/afterimage" className="px-5 py-4 rounded-2xl bg-gradient-to-b from-fuchsia-700 via-fuchsia-800 to-amber-900 text-white font-medium text-center active:scale-[0.98] border border-fuchsia-400/30 shadow-[0_0_24px_-8px_rgba(217,70,239,0.45)]">
              Print a wall
            </Link>
            <Link href="/thoughts" className="px-5 py-4 rounded-2xl bg-gradient-to-b from-purple-700 via-purple-800 to-violet-950 text-white font-medium text-center active:scale-[0.98] border border-purple-400/30 shadow-[0_0_24px_-8px_rgba(124,58,237,0.5)]">
              Read something true
            </Link>
          </div>
        </section>

        <section className="pb-10 sm:pb-14">
          <p className="text-[11px] uppercase tracking-[0.2em] text-red-300/80 mb-3">Play</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/playground" className="card group overflow-hidden rounded-2xl border border-red-900/40 bg-[#111]">
              <Wash className="bg-gradient-to-br from-red-700/50 via-rose-900/30 to-[#111]" />
              <div className="p-5">
                <p className="text-[11px] uppercase tracking-wide text-red-300 mb-1">Playground</p>
                <h2 className="text-lg font-medium text-neutral-100 mb-1 group-hover:text-red-300">Face The Den</h2>
                <p className="text-sm text-neutral-500">Upload. Get judged. Climb.</p>
              </div>
            </Link>
            <Link href="/afterimage" className="card group overflow-hidden rounded-2xl border border-fuchsia-900/40 bg-[#111]">
              <Wash className="bg-gradient-to-br from-fuchsia-600/45 via-amber-700/20 to-[#111]" />
              <div className="p-5">
                <p className="text-[11px] uppercase tracking-wide text-fuchsia-300 mb-1">Afterimage</p>
                <h2 className="text-lg font-medium text-neutral-100 mb-1 group-hover:text-fuchsia-300">Print a lock screen</h2>
                <p className="text-sm text-neutral-500">Pick a look. Take it with you.</p>
              </div>
            </Link>
            <Link href="/playground/would-you-rather" className="card group overflow-hidden rounded-2xl border border-amber-900/40 bg-[#111]">
              <Wash className="bg-gradient-to-br from-amber-600/40 via-rose-800/20 to-[#111]" />
              <div className="p-5">
                <p className="text-[11px] uppercase tracking-wide text-amber-300 mb-1">Would You Rather</p>
                <h2 className="text-lg font-medium text-neutral-100 mb-1 group-hover:text-amber-200">Pick a lane</h2>
                <p className="text-sm text-neutral-500">Out of pocket. Still makes sense.</p>
              </div>
            </Link>
          </div>
        </section>

        <section className="pb-12 sm:pb-16">
          <p className="text-[11px] uppercase tracking-[0.2em] text-purple-300/80 mb-3">Read</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/thoughts" className="card group overflow-hidden rounded-2xl border border-purple-900/40 bg-[#111]">
              <Wash className="bg-gradient-to-br from-purple-700/40 via-rose-900/20 to-[#111]" />
              <div className="p-5">
                <p className="text-[11px] uppercase tracking-wide text-purple-300 mb-1">Thoughts</p>
                <h2 className="text-lg font-medium text-neutral-100 mb-1 group-hover:text-purple-300 line-clamp-2">{thoughtLine}</h2>
                <p className="text-sm text-neutral-500">Things people keep to themselves.</p>
              </div>
            </Link>
            <Link href="/gaming" className="card group overflow-hidden rounded-2xl border border-neutral-800/80 bg-[#111]">
              <Wash className="bg-gradient-to-br from-sky-800/35 via-violet-900/20 to-[#111]" />
              <div className="p-5">
                <p className="text-[11px] uppercase tracking-wide text-sky-300 mb-1">Gaming</p>
                <h2 className="text-lg font-medium text-neutral-100 mb-1 group-hover:text-sky-300">Builds, rants, takes</h2>
                <p className="text-sm text-neutral-500">What's worth the time.</p>
              </div>
            </Link>
            <Link href="/loot" className="card group overflow-hidden rounded-2xl border border-neutral-800/80 bg-[#111]">
              <Wash className="bg-gradient-to-br from-amber-800/30 via-neutral-900 to-[#111]" />
              <div className="p-5">
                <p className="text-[11px] uppercase tracking-wide text-amber-200 mb-1">Loot</p>
                <h2 className="text-lg font-medium text-neutral-100 mb-1 group-hover:text-amber-200">Things I actually use</h2>
                <p className="text-sm text-neutral-500">No fake lists.</p>
              </div>
            </Link>
          </div>
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
