import type { Metadata } from "next";
import { ThoughtsBoard } from "@/components/thoughts/ThoughtsBoard";
import { DenHero } from "@/components/den/DenHero";

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
    <div className="home-den relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] bg-[radial-gradient(ellipse_at_center,_rgba(185,28,92,0.08)_0%,_transparent_70%)] pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <DenHero
          kicker="Thoughts · on the table"
          title="Things people keep quiet."
          accent="Written without the polish."
          body="Short essays. No TED-talk cadence. Sit down, read one, leave a little meaner or a little honest."
        />
        <div className="max-w-3xl">
          <ThoughtsBoard />
        </div>
      </div>
    </div>
  );
}
