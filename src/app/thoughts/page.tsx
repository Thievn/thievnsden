import Link from "next/link";

const thoughts = [
  {
    slug: "borrowed-goals",
    title: "Most of your goals were never really yours",
    excerpt:
      "At some point you look around and realize half the things you’ve been chasing were just ideas you absorbed from people who seemed more sure of themselves than you were.",
    readTime: "3 min",
    date: "Aug 2026",
  },
  {
    slug: "never-impressive",
    title: "The quiet relief of accepting you’ll never be impressive",
    excerpt:
      "There’s a specific kind of peace that shows up the day you stop trying to be the most interesting person in the room.",
    readTime: "3 min",
    date: "Aug 2026",
  },
  {
    slug: "stop-explaining",
    title: "The day you stop explaining yourself",
    excerpt:
      "Eventually you realize some people were never going to understand you, and the energy you spent trying was just another way of asking for permission.",
    readTime: "4 min",
    date: "Aug 2026",
  },
  {
    slug: "lonely-in-a-crowd",
    title: "The loneliness that only hits when you’re surrounded",
    excerpt:
      "It’s not the empty room that gets you. It’s the full one where no one is actually looking at you.",
    readTime: "3 min",
    date: "Aug 2026",
  },
  {
    slug: "staying-too-long",
    title: "Why people stay in things that are already over",
    excerpt:
      "Sometimes the hardest part isn’t leaving. It’s admitting how long you’ve already known you should have.",
    readTime: "4 min",
    date: "Aug 2026",
  },
  {
    slug: "becoming-what-you-hated",
    title: "How easy it is to become what you used to hate",
    excerpt:
      "You don’t notice it happening in real time. You just wake up one day and recognize the tone in your own voice.",
    readTime: "3 min",
    date: "Aug 2026",
  },
];

export default function ThoughtsPage() {
  return (
    <div className="relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] bg-[radial-gradient(ellipse_at_center,_rgba(185,28,92,0.05)_0%,_transparent_70%)] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10 sm:mb-14">
          <p className="text-[11px] uppercase tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-3 font-medium">
            From the Den
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-50 mb-3">
            Thoughts
          </h1>
          <p className="text-neutral-500 text-sm sm:text-base max-w-lg leading-relaxed">
            Things people usually keep to themselves. Written without the usual polish.
          </p>
        </div>

        <div className="space-y-4">
          {thoughts.map((thought) => (
            <Link
              key={thought.slug}
              href={`/thoughts/${thought.slug}`}
              className="group block p-5 sm:p-6 rounded-2xl border border-neutral-800/80 bg-[#111] hover:bg-[#141414] hover:border-neutral-700 transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-2.5 text-[11px] text-neutral-600">
                <span>{thought.date}</span>
                <span className="w-1 h-1 rounded-full bg-neutral-700" />
                <span>{thought.readTime} read</span>
              </div>

              <h2 className="text-lg sm:text-xl font-medium text-neutral-100 mb-2 group-hover:text-red-300 transition-colors duration-200 leading-snug">
                {thought.title}
              </h2>

              <p className="text-neutral-500 text-sm leading-relaxed line-clamp-2">
                {thought.excerpt}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-900 text-center">
          <p className="text-neutral-600 text-sm">
            More coming. The Den doesn’t run out of things to say.
          </p>
        </div>
      </div>
    </div>
  );
}
