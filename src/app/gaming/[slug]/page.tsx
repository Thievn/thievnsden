import Link from "next/link";
import { notFound } from "next/navigation";
import { STATUS_STYLES, itemSlug, shelfOf } from "@/lib/gaming-data";
import { ThoughtReactions } from "@/components/ThoughtReactions";
import { ThoughtComments } from "@/components/ThoughtComments";
import { ShareBar } from "@/components/ShareBar";
import { CoverImage } from "@/components/gaming/CoverImage";
import { LinkedCopy } from "@/components/gaming/LinkedCopy";
import { loadGamingItem } from "@/lib/gaming-load";
import { injectShopLinks } from "@/lib/gaming-affiliates";

export const dynamic = "force-dynamic";

export default async function GamingArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await loadGamingItem(slug);
  if (!item) notFound();

  const style = STATUS_STYLES[item.status] || STATUS_STYLES.hype;
  const path = `/gaming/${itemSlug(item)}`;
  const copy = item.body || item.note || "";
  const mode = shelfOf(item) === "essay" ? "essay" : "game";
  const showAffiliateNote = /amazon\.com/i.test(injectShopLinks(copy, mode));

  return (
    <article className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link
        href="/gaming"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-8"
      >
        ← Back to Gaming
      </Link>

      <div className="rounded-2xl overflow-hidden mb-8 border border-neutral-800/80 aspect-[16/10] sm:aspect-[16/9]">
        <CoverImage src={item.cover} className="h-full w-full" imgClassName="h-full w-full object-cover" eager />
      </div>

      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-violet-800/50 text-violet-200">
            {shelfOf(item)}
          </span>
          <span
            className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${style.className}`}
          >
            {style.label}
          </span>
          {item.meta ? (
            <span className="text-[12px] text-neutral-500">{item.meta}</span>
          ) : null}
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-50 leading-snug mb-4">
          {item.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <ThoughtReactions slug={`gaming-${itemSlug(item)}`} />
          <ShareBar path={path} title={`${item.title} · Thievn's Den`} />
        </div>
      </header>

      <LinkedCopy text={copy} mode={mode} />
      {showAffiliateNote ? (
        <p className="mt-6 text-[11px] text-neutral-600">Some product links are Amazon affiliate links.</p>
      ) : null}

      {item.url ? (
        <p className="mt-8">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-red-400/90 hover:text-red-300 underline underline-offset-2"
          >
            External link →
          </a>
        </p>
      ) : null}

      <ThoughtComments slug={`gaming-${itemSlug(item)}`} />

      <div className="mt-10 pt-8 border-t border-neutral-900">
        <Link
          href="/gaming"
          className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400"
        >
          ← Back to Gaming
        </Link>
      </div>
    </article>
  );
}
