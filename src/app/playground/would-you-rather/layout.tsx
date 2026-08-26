import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Floor · Would You Rather",
  description:
    "Late-night 18+ Would You Rather. Ten rounds. Two costs. The room splits. Get stamped.",
  alternates: { canonical: "/playground/would-you-rather" },
  openGraph: {
    title: "The Floor · Would You Rather · Thievn's Den",
    description: "Ten rounds. Two costs. Pick anyway. See how the room splits.",
    url: "https://thievnsden.com/playground/would-you-rather",
  },
};

export default function WyrLayout({ children }: { children: React.ReactNode }) {
  return children;
}
