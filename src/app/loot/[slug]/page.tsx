import Link from "next/link";
import { notFound } from "next/navigation";
import { sectionLabel } from "@/lib/loot-data";
import { loadLootCatalog, loadLootPick } from "@/lib/loot-load";
import { LinkedCopy } from "@/components/gaming/LinkedCopy";
import { LootCover, LootTile } from "@/components/loot/LootCard";
import { injectLootLinks } from "@/lib/gaming-affiliates";
import { ShareBar } from "@/components/ShareBar";

export const dynamic = "force-dynamic";

export default async function LootArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ pick, tag }, catalog] = await Promise.all([loadLootPick(slug), loadLootCatalog()]);
  if (!pick) notFound();
  const copy = pick.body || pick.snippet || "";
  const linked = injectLootLinks(copy, pick.search_query || pick.name, tag);
  const showNote = /amazon\.com/i.test(linked);
  const related = catalog.picks.filter((p) => p.id !== pick.id && p.section === pick.section).slice(0, 3);

  return (
    <article className="pb-20">
      <div className="loot-article-hero relative overflow-hidden border-b border-amber-900/25">
        <div className="absolute inset-0">
          <LootCover name={pick.name} src={pick.image_url} className="h-full w-full min-h-[320px] sm:min-h-[420px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/55 to-black/20" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-10 min-h-[320px] sm:min-h-[420px] flex flex-col justify-end">
          <Link href="/loot" className="text-sm text-amber-100/80 hover:text-amber-50 mb-6 w-fit">
            ← Lookbook
          </Link>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 rounded-full border border-amber-200/30 text-amber-50">
              {sectionLabel(pick.section)}
            </span>
            <span className="text-[12px] text-neutral-300">{pick.status || "In the Den"}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white max-w-3xl leading-[1.05]">
            {pick.name}
          </h1>
          <p className="mt-4 max-w-xl text-neutral-200/90 text-base sm:text-lg leading-relaxed">{pick.snippet}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10 sm:mt-14 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <ShareBar path={`/loot/${pick.id}`} title={`${pick.name} · Thievn's Den`} />
          <LinkedCopy
            text={copy}
            mode="loot"
            shopQuery={pick.search_query || pick.name}
            className="mt-8 space-y-5 text-[16px] sm:text-[17px] text-neutral-300 leading-[1.75]"
          />
        </div>
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-20 rounded-[1.6rem] border border-amber-900/40 bg-[#120e0a] p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300/80 mb-2">Off the table</p>
            <p className="text-sm text-neutral-400 leading-relaxed mb-5">
              Same piece. Walk it out.
            </p>
            <a
              href={`/go/${pick.id}`}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-b from-amber-200 to-amber-500 text-black text-sm font-semibold hover:from-amber-100 hover:to-amber-400"
            >
              Hunt this
              <span aria-hidden>→</span>
            </a>
            {showNote ? (
              <p className="mt-4 text-[11px] text-neutral-600">Some product links are Amazon affiliate links.</p>
            ) : null}
          </div>
        </aside>
      </div>

      {related.length ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-16">
          <h2 className="text-sm uppercase tracking-[0.18em] text-amber-200/80 mb-5">Same shelf</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((item) => (
              <LootTile key={item.id} item={item} />
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
