import type { Metadata } from "next";
import { THOUGHTS_META } from "@/lib/thoughts-meta";

const meta = THOUGHTS_META["borrowed-goals"];

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: "/thoughts/borrowed-goals" },
  openGraph: {
    type: "article",
    title: meta.title,
    description: meta.description,
    url: "https://thievnsden.com/thoughts/borrowed-goals",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
