import Link from "next/link";
import { notFound } from "next/navigation";
import { sectionLabel } from "@/lib/loot-data";
import { loadLootPick } from "@/lib/loot-load";
import { LinkedCopy } from "@/components/gaming/LinkedCopy";
import { LootCover } from "@/components/loot/LootCard";
import { injectLootLinks } from "@/lib/gaming-affiliates";
import { ShareBar } from "@/components/ShareBar";

export const dynamic = "force-dynamic";

export default async function LootArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { pick, tag } = await loadLootPick(slug);
  if (!pick) notFound();
  const copy = pick.body || pick.snippet || "";
  const linked = injectLootLinks(copy, pick.search_query || pick.name, tag);
  const showNote = /amazon\.com/i.test(linked);

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link
        href="/loot"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-rose-400 mb-8"
      >
        ← Back to Loot
      </Link>

      <div className="rounded-[1.8rem] overflow-hidden mb-8 border border-amber-900/40 aspect-[16/10] sm:aspect-[16/9]">
        <LootCover name={pick.name} src={pick.image_url} className="h-full w-full" />
      </div>

      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-amber-800/50 text-amber-200">
            {sectionLabel(pick.section)}
          </span>
          <span className="text-[12px] text-neutral-500">{pick.status || "In the Den"}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-neutral-50 leading-snug mb-4">
          {pick.name}
        </h1>
        <p className="text-neutral-400 text-[15px] leading-relaxed mb-5">{pick.snippet}</p>
        <ShareBar path={`/loot/${pick.id}`} title={`${pick.name} · Thievn's Den`} />
      </header>

      <LinkedCopy text={copy} mode="loot" shopQuery={pick.search_query || pick.name} />

      <a
        href={`/go/${pick.id}`}
        target="_blank"
        rel="nofollow sponsored noopener noreferrer"
        className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-amber-500/40 bg-amber-950/40 text-amber-100 text-sm font-medium hover:bg-amber-900/40"
      >
        Shop this search
        <span aria-hidden>→</span>
      </a>
      {showNote ? (
        <p className="mt-4 text-[11px] text-neutral-600">Some product links are Amazon affiliate links.</p>
      ) : null}

      <div className="mt-12 pt-8 border-t border-neutral-900">
        <Link href="/loot" className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-rose-400">
          ← Back to Loot
        </Link>
      </div>
    </article>
  );
}
