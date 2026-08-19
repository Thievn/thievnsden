import Link from "next/link";

export default function StayingTooLongPage() {
  return (
    <article className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <Link
        href="/thoughts"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 mb-8 transition-colors"
      >
        ← Thoughts
      </Link>

      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4 text-[11px] text-neutral-600">
          <span>Aug 2026</span>
          <span className="w-1 h-1 rounded-full bg-neutral-700" />
          <span>4 min read</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-50 leading-snug">
          Why people stay in things that are already over
        </h1>
      </header>

      <div className="space-y-5 text-neutral-300 text-[15px] sm:text-base leading-relaxed">
        <p>
          Sometimes the hardest part isn’t leaving. It’s admitting how long you’ve already known you should have.
        </p>
        <p>
          People stay in jobs, relationships, cities, and versions of themselves long after the life has gone out of them. Not because they’re fools. Because leaving requires acknowledging that the time already spent can’t be recovered. And that acknowledgment is heavier than the discomfort of staying.
        </p>
        <p>
          There’s a sunk-cost gravity to most long-term situations. You tell yourself one more month, one more conversation, one more attempt to make it work. You rewrite the story so the current version still has a chance. You protect the investment even as it keeps costing you more.
        </p>
        <p>
          The moment of clarity usually arrives sideways. Not as a dramatic realization, but as a quiet notice that you’ve been performing hope for an audience of one. Once you see it, staying starts to feel less like loyalty and more like avoidance.
        </p>
        <p>
          Leaving doesn’t magically fix anything. It just stops the slow leak. And sometimes the most honest thing you can do is admit that the version of the future you were waiting for was never going to arrive in that particular room.
        </p>
      </div>

      <div className="mt-12 pt-8 border-t border-neutral-900">
        <Link href="/thoughts" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">
          ← Back to Thoughts
        </Link>
      </div>
    </article>
  );
}
