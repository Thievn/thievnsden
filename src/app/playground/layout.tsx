import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playground",
  description:
    "Games in Thievn's Den. Face The Den, Would You Rather, Highway Hunter, Night Grab, and more. 18+.",
  alternates: { canonical: "/playground" },
  openGraph: {
    title: "Playground · Thievn's Den",
    description: "Pick a game. Face The Den, Would You Rather, and whatever opens next.",
    url: "https://thievnsden.com/playground",
  },
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
