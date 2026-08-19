import Link from "next/link";

export default function LonelyInACrowdPage() {
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
          The loneliness that only hits when you’re surrounded
        </h1>
      </header>

      <div className="space-y-5 text-neutral-300 text-[15px] sm:text-base leading-relaxed">
        <p>
          It’s not the empty room that gets you. It’s the full one where no one is actually looking at you.
        </p>
        <p>
          You can be in a group chat that never stops moving, at a table with people you’ve known for years, or in a relationship that looks fine from the outside, and still feel the specific hollowness of not being met. The conversation happens around you. The jokes land. The plans get made. And somehow none of it includes the part of you that showed up hoping to be seen.
        </p>
        <p>
          This kind of loneliness is harder to name because it comes with company. You’re not isolated in the obvious way, so it feels ungrateful to admit it. But the body still registers the distance. The slight performance required to stay in the room. The way you leave feeling more drained than when you arrived.
        </p>
        <p>
          The fix isn’t always more people. Sometimes it’s fewer, chosen more carefully. Sometimes it’s learning to sit with the quiet without immediately trying to fill it. And sometimes it’s just telling the truth about how little of you is actually present in rooms that used to feel like home.
        </p>
        <p>
          Being alone and being lonely are different things. One of them can happen in a crowd. The other one, at least, is honest about what it is.
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
