import Link from "next/link";

export default function NeverImpressivePage() {
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
          The quiet relief of accepting you’ll never be impressive
        </h1>
      </header>

      <div className="space-y-5 text-neutral-300 text-[15px] sm:text-base leading-relaxed">
        <p>
          There’s a specific kind of peace that shows up the day you stop trying to be the most interesting person in the room.
        </p>
        <p>
          For a long time the pressure is invisible because it’s constant. You measure yourself against people who seem further ahead, more composed, more certain. You edit the version of yourself you present. You collect small achievements like proof that you’re still in the game.
        </p>
        <p>
          Then one day the math stops working. You realize that “impressive” was always a moving target defined by people who were also exhausted. And the version of you that kept chasing it was mostly just tired.
        </p>
        <p>
          Accepting you’ll never be impressive doesn’t mean giving up. It means the performance can finally end. You get to care about things without needing them to make you look a certain way. You get to be average at some things and excellent at fewer things without the constant background calculation of how it lands.
        </p>
        <p>
          The relief isn’t loud. It’s just the absence of a weight you didn’t fully notice you were carrying until it was gone.
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
