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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-12">
        <h1 className="text-3xl font-semibold text-neutral-100 mb-3">Thoughts</h1>
        <p className="text-neutral-400">
          Short, unfiltered notes from the Den. No SEO fluff.
        </p>
      </div>

      <div className="space-y-6">
        {posts.map((post, i) => (
          <article
            key={i}
            className="card p-6 rounded-2xl border border-neutral-800 bg-[#141414] hover:border-neutral-700 cursor-pointer"
          >
            <div className="text-xs text-neutral-500 mb-2">{post.date}</div>
            <h2 className="text-xl font-medium text-neutral-100 mb-2">
              {post.title}
            </h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              {post.excerpt}
            </p>
          </article>
        ))}
      </div>

      <p className="mt-12 text-center text-sm text-neutral-600">
        More posts coming. This is just the start.
      </p>
    </div>
  );
}
