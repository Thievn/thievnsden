import Link from "next/link";

export default function BecomingWhatYouHatedPage() {
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
          <span>3 min read</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-50 leading-snug">
          How easy it is to become what you used to hate
        </h1>
      </header>

      <div className="space-y-5 text-neutral-300 text-[15px] sm:text-base leading-relaxed">
        <p>
          You don’t notice it happening in real time. You just wake up one day and recognize the tone in your own voice.
        </p>
        <p>
          The shortcuts you swore you’d never take. The dismissiveness you used to call out in other people. The quiet ranking of who deserves your patience. It rarely arrives as a full personality transplant. It shows up as small permissions you give yourself under pressure, until the new version feels normal.
        </p>
        <p>
          Most of the time it isn’t malice. It’s fatigue, self-protection, or the slow influence of the rooms you spend the most time in. You adapt to survive, and the adaptation sticks. By the time you notice, the distance between who you were and who you’ve become is wide enough to make you uncomfortable.
        </p>
        <p>
          The useful part isn’t the shame. Shame just freezes you in place. The useful part is catching the pattern early enough to decide whether you still want it. Some of the traits you picked up might actually serve you. Others are just residue from a version of life you’ve already left.
        </p>
        <p>
          Becoming what you used to hate doesn’t have to be permanent. But it does require noticing before the new version finishes settling in.
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
