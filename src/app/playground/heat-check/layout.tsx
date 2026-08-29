import type { Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";
import "./heat-check.css";

const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-hc-serif",
});

const sans = Outfit({
  subsets: ["latin"],
  variable: "--font-hc-sans",
});

export const metadata: Metadata = {
  title: "Heat Check",
  description: "They'll read it twice.",
  alternates: { canonical: "/playground/heat-check" },
  openGraph: {
    title: "Heat Check · Thievn's Den",
    description: "They'll read it twice.",
    url: "https://thievnsden.com/playground/heat-check",
  },
  robots: { index: false, follow: false },
};

export default function HeatCheckLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${serif.variable} ${sans.variable}`}>{children}</div>;
}
