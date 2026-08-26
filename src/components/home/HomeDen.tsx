import Link from "next/link";
import { DenMarkSplash } from "@/components/DenMark";
import { HomeAtmosphere } from "@/components/home/HomeAtmosphere";

function coverSrc(url: string) {
  if (url.startsWith("/")) return url;
  if (url.includes("thievnsden.com")) return url;
  if (url.includes("supabase.co") && url.includes("/storage/v1/object/public/")) return url;
  return `/api/gaming/cover?u=${encodeURIComponent(url)}`;
}

export type HomeThought = {
  title: string;
  excerpt: string | null;
  slug: string;
};

export function HomeDen({
  thoughts,
  prints,
  gamingCover,
  gamingTitle,
}: {
  thoughts: HomeThought[];
  prints: string[];
  gamingCover: string | null;
  gamingTitle: string | null;
}) {
  const featured = thoughts[0];
  const rest = thoughts.slice(1, 3);

  return (
    <HomeAtmosphere>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <section className="pt-14 sm:pt-20 md:pt-24 pb-12 sm:pb-16 text-center">
          <div className="home-reveal home-float mx-auto mb-6 sm:mb-8 w-fit">
            <DenMarkSplash className="w-12 h-16 sm:w-14 sm:h-[4.5rem] drop-shadow-[0_0_24px_rgba(225,29,72,0.35)]" />
          </div>
          <p className="home-reveal text-[11px] sm:text-xs uppercase tracking-[0.28em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-purple-400 mb-5 font-medium">
            Members&apos; hours · 18+
          </p>
          <h1 className="home-reveal text-[2.35rem] sm:text-5xl md:text-6xl lg:text-[4.35rem] font-semibold tracking-tight text-neutral-50 mb-5 sm:mb-6 leading-[1.08]">
            Come in.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-rose-200 to-purple-300">
              The lights stay low.
            </span>
          </h1>
          <p className="home-reveal max-w-xl mx-auto text-neutral-400 text-base sm:text-lg leading-relaxed mb-8 sm:mb-10 px-1">
            Dark essays. Honest loot. Gaming that isn&apos;t a press kit. Afterimage on the wall.
            Games in the back room. This is Thievn&apos;s Den — not a brand deck.
          </p>
          <div className="home-reveal flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link
              href="/thoughts"
              className="px-7 py-3.5 rounded-xl bg-gradient-to-b from-red-600 via-red-800 to-purple-900 text-white font-medium text-center shadow-[0_12px_32px_-12px_rgba(185,28,92,0.55)] hover:from-red-500 hover:via-red-700 hover:to-purple-800 transition-all active:scale-[0.98]"
            >
              Sit with a thought
            </Link>
            <Link
              href="/playground"
              className="px-7 py-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-neutral-100 font-medium text-center hover:border-rose-500/40 hover:bg-rose-950/20 transition-all active:scale-[0.98]"
            >
              Pick a machine
            </Link>
          </div>
          <div className="home-line mx-auto mt-12 sm:mt-16 h-px w-full max-w-md rounded-full" />
        </section>

          <nav className="home-reveal flex gap-2 overflow-x-auto pb-2 mb-8 sm:mb-10 -mx-4 px-4 sm:mx-0 sm:px-0" aria-label="Rooms in the Den">
          {[
            { href: "/thoughts", label: "Thoughts", tone: "border-rose-500/30 text-rose-200" },
            { href: "/gaming", label: "Gaming", tone: "border-violet-500/30 text-violet-200" },
            { href: "/afterimage", label: "Afterimage", tone: "border-fuchsia-500/30 text-fuchsia-200" },
            { href: "/playground", label: "Playground", tone: "border-red-500/30 text-red-200" },
            { href: "/loot", label: "Loot", tone: "border-amber-500/30 text-amber-200" },
          ].map((room) => (
            <Link
              key={room.href}
              href={room.href}
              className={`shrink-0 px-4 py-2 rounded-full border bg-black/40 text-[11px] uppercase tracking-[0.18em] hover:bg-white/5 transition-colors ${room.tone}`}
            >
              {room.label}
            </Link>
          ))}
        </nav>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 pb-5">
          <Link
            href={featured ? `/thoughts/${featured.slug}` : "/thoughts"}
            className="home-room lg:col-span-7 rounded-3xl border border-rose-900/35 bg-gradient-to-br from-[#1c0a12] via-[#11080c] to-[#0c0c0c] p-6 sm:p-9 min-h-[280px] flex flex-col"
          >
            <p className="text-[11px] uppercase tracking-[0.2em] text-rose-300/85 mb-4">On the table</p>
            <h2 className="text-2xl sm:text-4xl font-semibold text-neutral-50 leading-tight mb-4">
              {featured?.title || "Thoughts from the Den"}
            </h2>
            {featured?.excerpt ? (
              <p className="text-neutral-400 text-base sm:text-lg leading-relaxed max-w-xl flex-1">{featured.excerpt}</p>
            ) : (
              <p className="text-neutral-500 flex-1">Short rants. Longer honesty. No TED-talk cadence.</p>
            )}
            <p className="mt-8 text-sm text-rose-300">Keep reading →</p>
          </Link>

          <div className="lg:col-span-5 grid grid-cols-1 gap-4 sm:gap-5">
            {rest.map((t) => (
              <Link
                key={t.slug}
                href={`/thoughts/${t.slug}`}
                className="home-room rounded-3xl border border-neutral-800/80 bg-[#111] p-5 sm:p-6"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-rose-400/80 mb-2">Thoughts</p>
                <h3 className="text-lg font-medium text-neutral-100 leading-snug mb-2">{t.title}</h3>
                {t.excerpt ? <p className="text-sm text-neutral-500 line-clamp-2">{t.excerpt}</p> : null}
              </Link>
            ))}
            {!rest.length ? (
              <Link href="/thoughts" className="home-room rounded-3xl border border-neutral-800/80 bg-[#111] p-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-rose-400/80 mb-2">Thoughts</p>
                <h3 className="text-lg font-medium text-neutral-100">The full stack of essays</h3>
              </Link>
            ) : null}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 pb-5">
          <Link href="/afterimage" className="home-room rounded-3xl border border-fuchsia-900/40 bg-[#100810] min-h-[280px] flex flex-col">
            <div className="relative h-40 sm:h-48 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/35 via-rose-900/25 to-amber-800/20" />
              {prints.length ? (
                <div className="absolute inset-0 flex items-end justify-center gap-2 px-8 pb-3">
                  {prints.slice(0, 4).map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src + i}
                      src={src}
                      alt=""
                      className="h-[78%] w-[22%] object-cover rounded-md border border-white/15 shadow-2xl"
                      style={{ transform: `rotate(${[-8, -2, 3, 9][i] || 0}deg) translateY(${i % 2 ? 8 : 0}px)` }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
            <div className="p-6 sm:p-7 flex-1 flex flex-col">
              <p className="text-[11px] uppercase tracking-[0.2em] text-fuchsia-300/85 mb-2">Afterimage</p>
              <h2 className="text-2xl font-semibold text-neutral-50 mb-2">Print a lock screen</h2>
              <p className="text-sm text-neutral-500 flex-1">Moody stills. Not stock. Take one with you.</p>
              <p className="mt-5 text-sm text-fuchsia-300">Open the studio →</p>
            </div>
          </Link>

          <Link href="/gaming" className="home-room rounded-3xl border border-violet-900/40 bg-[#0c0a12] min-h-[280px] flex flex-col overflow-hidden">
            <div className="relative h-40 sm:h-48 bg-[#0a0a0e]">
              {gamingCover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverSrc(gamingCover)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-violet-700/30 via-purple-950/40 to-[#0c0a12]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a12] via-[#0c0a12]/30 to-transparent" />
            </div>
            <div className="p-6 sm:p-7 flex-1 flex flex-col">
              <p className="text-[11px] uppercase tracking-[0.2em] text-violet-300/85 mb-2">Gaming</p>
              <h2 className="text-2xl font-semibold text-neutral-50 mb-2">
                {gamingTitle || "Builds, rants, radar"}
              </h2>
              <p className="text-sm text-neutral-500 flex-1">What&apos;s on the plate, what&apos;s broken, what is actually worth the hours.</p>
              <p className="mt-5 text-sm text-violet-300">Enter the hub →</p>
            </div>
          </Link>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 pb-5">
          <Link href="/playground/face-the-den" className="home-room rounded-3xl border border-red-800/40 bg-[#14080c] p-6 min-h-[200px] flex flex-col">
            <p className="text-[11px] uppercase tracking-[0.18em] text-red-300/85 mb-3">Playground</p>
            <h2 className="text-xl font-semibold text-neutral-50 mb-2">Face The Den</h2>
            <p className="text-sm text-neutral-500 flex-1">Walk in looking pretty. Leave with notes.</p>
            <p className="mt-5 text-sm text-red-300">Sit for a roast →</p>
          </Link>
          <Link href="/playground/would-you-rather" className="home-room rounded-3xl border border-amber-900/40 bg-[#120e08] p-6 min-h-[200px] flex flex-col">
            <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300/85 mb-3">Playground</p>
            <h2 className="text-xl font-semibold text-neutral-50 mb-2">Would You Rather</h2>
            <p className="text-sm text-neutral-500 flex-1">Two bad options. Pick anyway. Get clocked.</p>
            <p className="mt-5 text-sm text-amber-300">Deal the cards →</p>
          </Link>
          <Link href="/playground/highway-hunter" className="home-room rounded-3xl border border-orange-900/35 bg-[#120a08] p-6 min-h-[200px] flex flex-col">
            <p className="text-[11px] uppercase tracking-[0.18em] text-orange-300/85 mb-3">Playground</p>
            <h2 className="text-xl font-semibold text-neutral-50 mb-2">Highway Hunter</h2>
            <p className="text-sm text-neutral-500 flex-1">Night interstate. Soft wrecks. Preview heat.</p>
            <p className="mt-5 text-sm text-orange-300">Take the on-ramp →</p>
          </Link>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pb-12 sm:pb-16">
          <Link href="/loot" className="home-room rounded-3xl border border-amber-900/35 bg-[#11100c] p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.2em] text-amber-300/85 mb-3">Loot</p>
            <h2 className="text-2xl font-semibold text-neutral-50 mb-2">Things I actually use</h2>
            <p className="text-sm text-neutral-500">Gear, merch, tools. No fake roundups.</p>
            <p className="mt-6 text-sm text-amber-300">See the shelf →</p>
          </Link>
          <Link href="/about" className="home-room rounded-3xl border border-neutral-800/80 bg-[#0e0e0e] p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 mb-3">The house</p>
            <h2 className="text-2xl font-semibold text-neutral-50 mb-2">Who keeps the lights</h2>
            <p className="text-sm text-neutral-500">Mature by design. Unfiltered on purpose. 18+.</p>
            <p className="mt-6 text-sm text-neutral-300">Read the door policy →</p>
          </Link>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="rounded-3xl border border-rose-900/30 bg-gradient-to-b from-[#16080e] to-[#0b0b0b] p-8 sm:p-12 text-center glow-accent">
            <p className="text-[11px] uppercase tracking-[0.22em] text-rose-300/80 mb-4">Stay a while</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-50 mb-4">The Den is a living room, not a funnel.</h2>
            <p className="text-neutral-400 max-w-2xl mx-auto leading-relaxed mb-8">
              Essays, drops, roasts, lock screens, and the occasional experiment. Nothing here is polished corporate content.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/join"
                className="px-6 py-3 rounded-xl bg-gradient-to-b from-red-700 to-purple-900 text-white font-medium hover:from-red-600 hover:to-purple-800 transition-all"
              >
                Join the Den
              </Link>
              <Link
                href="/playground"
                className="px-6 py-3 rounded-xl border border-neutral-700 text-neutral-200 hover:border-neutral-500 transition-all"
              >
                Wander the playground
              </Link>
            </div>
          </div>
        </section>
      </div>
    </HomeAtmosphere>
  );
}
