import type { Metadata } from "next";
import { THOUGHTS_META } from "@/lib/thoughts-meta";

const meta = THOUGHTS_META["staying-too-long"];

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: "/thoughts/staying-too-long" },
  openGraph: {
    type: "article",
    title: meta.title,
    description: meta.description,
    url: "https://thievnsden.com/thoughts/staying-too-long",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
