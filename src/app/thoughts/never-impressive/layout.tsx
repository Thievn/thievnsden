import type { Metadata } from "next";
import { THOUGHTS_META } from "@/lib/thoughts-meta";

const meta = THOUGHTS_META["never-impressive"];

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  alternates: { canonical: "/thoughts/never-impressive" },
  openGraph: {
    type: "article",
    title: meta.title,
    description: meta.description,
    url: "https://thievnsden.com/thoughts/never-impressive",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
