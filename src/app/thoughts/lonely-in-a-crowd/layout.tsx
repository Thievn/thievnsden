import type { Metadata } from "next";
import { THOUGHTS_META } from "@/lib/thoughts-meta";

const meta = THOUGHTS_META["lonely-in-a-crowd"];

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: "/thoughts/lonely-in-a-crowd" },
  openGraph: {
    type: "article",
    title: meta.title,
    description: meta.description,
    url: "https://thievnsden.com/thoughts/lonely-in-a-crowd",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
