export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-semibold text-neutral-100 mb-6">About the Den</h1>

      <div className="space-y-6 text-neutral-300 leading-relaxed">
        <p>
          Thievn&apos;s Den is a personal corner of the internet for dark thoughts,
          cynical humor, AI-generated anime art, gaming, and the occasional
          unfiltered take.
        </p>
        <p>
          It exists because not everything needs to be polished, brand-safe, or
          optimized for maximum engagement. Some things just need a place to live.
        </p>
        <p>
          The tone matches the X account: a little unhinged, mostly honest, and
          comfortable with the darker side of humor and aesthetics.
        </p>
        <p>
          This site will grow over time — art drops, recommendations, tools,
          writing, and whatever else feels worth putting here. Some things may
          eventually require an account or be paid. Most of it will stay free.
        </p>
      </div>

      <div className="mt-12 p-6 rounded-2xl border border-neutral-800 bg-[#141414]">
        <p className="text-sm text-neutral-400">
          Find me on{" "}
          <a
            href="https://x.com/Thievn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            X / @Thievn
          </a>
          .
        </p>
      </div>
    </div>
  );
}
