import Link from "next/link";

export default function StopExplainingPage() {
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
          The day you stop explaining yourself
        </h1>
      </header>

      <div className="space-y-5 text-neutral-300 text-[15px] sm:text-base leading-relaxed">
        <p>
          Eventually you realize some people were never going to understand you, and the energy you spent trying was just another way of asking for permission.
        </p>
        <p>
          You can feel it in the conversations that go nowhere. The ones where you carefully choose your words, offer context, rephrase the same point three different ways, and still watch it land wrong. Not because you were unclear — because they weren’t listening for understanding. They were listening for confirmation of what they already decided about you.
        </p>
        <p>
          There’s a version of self-respect that looks like silence. Not the cold kind. Just the decision to stop performing clarity for people who have already made up their minds. You still talk. You just stop treating every interaction like a trial you need to win.
        </p>
        <p>
          The first few times you do it, it feels almost rude. You’re so used to over-explaining that restraint feels like abandonment. Then you notice how much quieter your mind gets when you stop rehearsing defenses for conversations that were never going to go well anyway.
        </p>
        <p>
          Not everyone deserves the full story. Some people only ever wanted the version that made them comfortable. Once you see that clearly, the urge to keep explaining starts to look less like kindness and more like a habit you no longer need.
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
