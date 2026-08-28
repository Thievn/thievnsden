import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Heat Check",
  description: "They’ll read it twice. A private thread in Thievn's Den. 18+.",
  alternates: { canonical: "/playground/heat-check" },
  openGraph: {
    title: "Heat Check · Thievn's Den",
    description: "They’ll read it twice.",
    url: "https://thievnsden.com/playground/heat-check",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
