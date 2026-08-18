export default function ThoughtsPage() {
  const posts = [
    {
      title: "Why most AI art accounts feel the same",
      date: "Aug 2026",
      excerpt:
        "Everyone is chasing the same aesthetic. The ones that stand out actually have a point of view — even if that point of view is mildly unhinged.",
    },
    {
      title: "The quiet joy of a clean PC build",
      date: "Jul 2026",
      excerpt:
        "Cable management is a personality trait. So is refusing to buy RGB just because it exists.",
    },
    {
      title: "Dark humor is a filter",
      date: "Jun 2026",
      excerpt:
        "If someone can’t handle a joke about the void, they probably shouldn’t be in the Den anyway.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
      <div className="mb-14">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-50 mb-3">
          Thoughts
        </h1>
        <p className="text-neutral-500">
          Short, unfiltered notes from the Den. No SEO fluff.
        </p>
      </div>

      <div className="space-y-5">
        {posts.map((post, i) => (
          <article
            key={i}
            className="card p-7 rounded-2xl border border-neutral-800/80 bg-[#111] cursor-pointer"
          >
            <div className="text-xs text-neutral-600 mb-2.5 tracking-wide">{post.date}</div>
            <h2 className="text-xl font-medium text-neutral-100 mb-2.5">
              {post.title}
            </h2>
            <p className="text-neutral-500 text-sm leading-relaxed">
              {post.excerpt}
            </p>
          </article>
        ))}
      </div>

      <p className="mt-14 text-center text-sm text-neutral-600">
        More posts coming. This is just the start.
      </p>
    </div>
  );
}
