import type { Metadata } from "next";
import { ThoughtsBoard } from "@/components/thoughts/ThoughtsBoard";

export const metadata: Metadata = {
  title: "Thoughts",
  description:
    "Short essays from Thievn's Den — honest observations on goals, identity, loneliness, and the things people usually keep to themselves.",
  alternates: { canonical: "/thoughts" },
  openGraph: {
    title: "Thoughts · Thievn's Den",
    description:
      "Dark, honest short writing. No motivational fluff — just the things people think and rarely say.",
    url: "https://thievnsden.com/thoughts",
  },
};

export default function ThoughtsPage() {
  return (
    <div className="relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] bg-[radial-gradient(ellipse_at_center,_rgba(185,28,92,0.05)_0%,_transparent_70%)] pointer-events-none" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-8 sm:mb-10">
          <p className="text-[11px] uppercase tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400 mb-3 font-medium">
            From the Den
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-50 mb-3">Thoughts</h1>
          <p className="text-neutral-400 text-sm sm:text-base max-w-lg leading-relaxed">
            Things people usually keep to themselves. Written without the usual polish.
          </p>
        </div>
        <ThoughtsBoard />
      </div>
    </div>
  );
}
