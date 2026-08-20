import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loot",
  description:
    "Gear, merch, and tools Thievn actually uses — PC parts, gaming hardware, and honest picks from the Den. No fake listicles.",
  alternates: { canonical: "/loot" },
  openGraph: {
    title: "Loot · Thievn's Den",
    description: "Things from the Den that are actually worth a look.",
    url: "https://thievnsden.com/loot",
  },
};

export default function LootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
