import Link from "next/link";

export default function BorrowedGoalsPage() {
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
          Most of your goals were never really yours
        </h1>
      </header>

      <div className="prose-den space-y-5 text-neutral-300 text-[15px] sm:text-base leading-relaxed">
        <p>
          At some point you look around and realize half the things you’ve been chasing were just ideas you absorbed from people who seemed more sure of themselves than you were.
        </p>
        <p>
          The career path. The version of success. The timeline. Even some of the personality traits you decided you should have. Most of it wasn’t chosen so much as inherited from the loudest voices in the room at the time.
        </p>
        <p>
          It’s not dramatic when it hits. It’s quieter than that. You just notice that the thing you’ve been working toward doesn’t actually feel like yours when you picture finally having it. There’s no real hunger underneath the effort — just momentum and the fear of looking directionless.
        </p>
        <p>
          The strange part is how long you can keep going anyway. You can spend years building a life that looks correct from the outside while privately feeling like you’re acting out someone else’s script. And because everyone else is doing a version of the same thing, it rarely gets questioned.
        </p>
        <p>
          Dropping those borrowed goals doesn’t automatically give you better ones. Sometimes it just leaves a gap. But at least the gap is honest. And honesty, even the uncomfortable kind, is usually a better starting point than another borrowed plan.
        </p>
      </div>

      <div className="mt-12 pt-8 border-t border-neutral-900">
        <Link
          href="/thoughts"
          className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          ← Back to Thoughts
        </Link>
      </div>
    </article>
  );
}
