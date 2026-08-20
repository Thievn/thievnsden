import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who runs Thievn's Den, what the site is for, and what to expect — dark humor, AI art, gaming, and unfiltered writing.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Thievn's Den",
    description:
      "A personal corner of the internet for dark thoughts, cynical humor, AI art, and honest takes.",
    url: "https://thievnsden.com/about",
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-50 mb-8">
        About the Den
      </h1>

      <div className="space-y-6 text-neutral-400 leading-relaxed text-[15px]">
        <p>
          <strong className="text-neutral-200">Thievn&apos;s Den</strong> is a personal
          site run by <strong className="text-neutral-200">Thievn</strong> — also on{" "}
          <a
            href="https://x.com/Thievn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            X @Thievn
          </a>
          . It&apos;s a home for dark humor, cynical observations, AI-generated anime art,
          gaming takes, and tools that don&apos;t pretend to be wholesome.
        </p>
        <p>
          The site is intentionally not brand-safe corporate content. Some sections include
          mature themes and adult humor. That&apos;s by design, and it&apos;s labeled as such.
        </p>
        <p>
          What you&apos;ll find here:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-neutral-400">
          <li>
            <span className="text-neutral-300">Thoughts</span> — short essays on things people
            usually keep quiet
          </li>
          <li>
            <span className="text-neutral-300">Face The Den</span> — an AI photo judgment tool
            (roasts, scores, collectible-style results)
          </li>
          <li>
            <span className="text-neutral-300">Loot</span> — gear and merch recommendations from
            actual use
          </li>
          <li>
            <span className="text-neutral-300">Gaming</span> — builds, rants, and whatever is
            currently eating time
          </li>
        </ul>
        <p>
          Most of the Den stays free. Accounts unlock saving results and future extras.
          The tone matches the X account: a little unhinged, mostly honest.
        </p>
      </div>

      <div className="mt-14 p-7 rounded-2xl border border-neutral-800/80 bg-[#111]">
        <p className="text-sm text-neutral-500">
          Primary presence:{" "}
          <a
            href="https://x.com/Thievn"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            x.com/Thievn
          </a>
          {" · "}
          <span className="text-neutral-400">thievnsden.com</span>
        </p>
      </div>
    </div>
  );
}
