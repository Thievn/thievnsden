import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Highway Hunter",
  description: "Night interstate. Weaponized coupe. Soft wrecks. Playground game in Thievn's Den.",
  alternates: { canonical: "/playground/highway-hunter" },
  openGraph: {
    title: "Highway Hunter · Thievn's Den",
    description: "Drive. Tag hostiles. Grab kits. Scorecard at the end.",
    url: "https://thievnsden.com/playground/highway-hunter",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
