import Link from "next/link";
import { DenMarkSplash } from "@/components/DenMark";
import { HomeAtmosphere } from "@/components/home/HomeAtmosphere";
import { HomeGamingRoom, HomePolaroids, HomePrintStrip } from "@/components/home/HomePolaroids";
import { PlaygroundCardArt } from "@/components/playground/PlaygroundCardArt";
import { PLAYGROUND_GAMES } from "@/lib/playground-games";

export type HomeThought = {
  title: string;
  excerpt: string | null;
  slug: string;
};

export type HomeGameCover = {
  cover: string;
  title: string;
  kind?: string;
};

export type HomeLootCover = {
  image_url: string;
  name: string;
  id: string;
};

export function HomeDen({
  thoughts,
  prints,
  gamingCovers,
  gamingTitle,
  lootCovers = [],
  playgroundArt = {},
}: {
  thoughts: HomeThought[];
  prints: string[];
  gamingCovers: HomeGameCover[];
  gamingTitle: string | null;
  lootCovers?: HomeLootCover[];
  playgroundArt?: Record<string, string>;
}) {
  const featured = thoughts[0];
  const rest = thoughts.slice(1, 3);

  return (
    <HomeAtmosphere>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <section className="pt-8 sm:pt-12 md:pt-14 pb-10 sm:pb-14">
          <div className="relative overflow-hidden rounded-[2rem] border border-rose-900/40 bg-[#090509] den-panel">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(185,28,92,0.22),transparent_45%),radial-gradient(ellipse_at_90%_80%,rgba(124,58,237,0.16),transparent_50%)]" />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/70 to-transparent" />
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 p-6 sm:p-10 lg:p-12 items-center">
              <div className="lg:col-span-7 text-left">
                <div className="home-float mb-5 w-fit">
                  <DenMarkSplash className="w-11 h-14 sm:w-14 sm:h-[4.5rem] drop-shadow-[0_0_28px_rgba(225,29,72,0.45)]" />
                </div>
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.32em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-purple-400 mb-4 font-medium">
                  Thievn&apos;s Den · members&apos; hours · 18+
                </p>
                <h1 className="text-[2.6rem] sm:text-5xl md:text-6xl lg:text-[4.6rem] font-semibold tracking-tight text-neutral-50 mb-5 leading-[0.98]">
                  Come in.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-rose-100 to-purple-300">
                    The lights stay low.
                  </span>
                </h1>
                <p className="max-w-lg text-neutral-400 text-base sm:text-lg leading-relaxed mb-8">
                  Essays on the table. Afterimage on the wall. Gaming in the corner. Machines in the back.
                  This is a den, not a landing page.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/thoughts"
                    className="px-7 py-3.5 rounded-xl bg-gradient-to-b from-red-600 via-red-800 to-purple-900 text-white font-medium text-center shadow-[0_16px_40px_-12px_rgba(185,28,92,0.7)] hover:from-red-500 hover:via-red-700 hover:to-purple-800 transition-all active:scale-[0.98]"
                  >
                    Sit with a thought
                  </Link>
                  <Link
                    href="/playground"
                    className="px-7 py-3.5 rounded-xl border border-white/15 bg-black/30 text-neutral-100 font-medium text-center hover:border-rose-400/50 hover:bg-rose-950/30 transition-all active:scale-[0.98]"
                  >
                    Pick a machine
                  </Link>
                </div>
              </div>
              <div className="lg:col-span-5 relative">
                <HomePolaroids prints={prints} />
              </div>
            </div>
          </div>
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
            <div className="relative h-44 sm:h-52 overflow-hidden rounded-t-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/35 via-rose-900/25 to-amber-800/20" />
              <HomePrintStrip prints={prints} />
            </div>
            <div className="p-6 sm:p-7 flex-1 flex flex-col">
              <p className="text-[11px] uppercase tracking-[0.2em] text-fuchsia-300/85 mb-2">Afterimage</p>
              <h2 className="text-2xl font-semibold text-neutral-50 mb-2">Print a lock screen</h2>
              <p className="text-sm text-neutral-500 flex-1">Moody stills. Not stock. Take one with you.</p>
              <p className="mt-5 text-sm text-fuchsia-300">Open the studio →</p>
            </div>
          </Link>

          <Link href="/gaming" className="home-room rounded-3xl border border-violet-900/40 bg-[#0c0a12] min-h-[280px] flex flex-col overflow-hidden">
            <HomeGamingRoom covers={gamingCovers} fallbackTitle={gamingTitle} />
          </Link>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 pb-5">
          {PLAYGROUND_GAMES.filter((g) => !g.disabled).map((g) => (
            <Link
              key={g.id}
              href={g.href}
              className={`home-room rounded-3xl border ${g.homeBorder} bg-[#0a0608] p-6 min-h-[200px] flex flex-col overflow-hidden`}
            >
              <PlaygroundCardArt url={playgroundArt[g.id]} tone="home" />
              <p className={`relative z-[3] text-[11px] uppercase tracking-[0.18em] ${g.homeKicker} mb-3`}>Playground</p>
              <h2 className="relative z-[3] text-xl font-semibold text-neutral-50 mb-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                {g.title}
              </h2>
              <p className="relative z-[3] text-sm text-neutral-300 flex-1">{g.homeLine}</p>
              <p className={`relative z-[3] mt-5 text-sm ${g.homeCta}`}>{g.homeEnter}</p>
            </Link>
          ))}
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pb-12 sm:pb-16">
          <Link href="/loot" className="home-room rounded-3xl border border-amber-900/35 bg-[#11100c] p-6 sm:p-8 overflow-hidden relative">
            <p className="text-[11px] uppercase tracking-[0.2em] text-amber-300/85 mb-3">Loot</p>
            <h2 className="text-2xl font-semibold text-neutral-50 mb-2">Things I actually use</h2>
            <p className="text-sm text-neutral-500">Lookbook takes. Real searches. No fake roundups.</p>
            {lootCovers.length ? (
              <div className="mt-6 grid grid-cols-4 gap-2">
                {lootCovers.slice(0, 4).map((item) => (
                  <div key={item.id} className="aspect-[4/5] overflow-hidden rounded-xl border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
            <p className="mt-6 text-sm text-amber-300">Browse the lookbook →</p>
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
