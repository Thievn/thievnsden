import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Would You Rather",
  description:
    "Two real costs. Pick one. See the split. Get a scorecard. 18+ game in Thievn's Den.",
  alternates: { canonical: "/playground/would-you-rather" },
  openGraph: {
    title: "Would You Rather · Thievn's Den",
    description: "Human, nasty, no magic. Pick a side and see how the room splits.",
    url: "https://thievnsden.com/playground/would-you-rather",
  },
};

export default function WyrLayout({ children }: { children: React.ReactNode }) {
  return children;
}
