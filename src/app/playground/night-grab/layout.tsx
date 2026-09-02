import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Night Grab",
  description: "Sixty seconds. Grab the bag. Don’t get clocked. Playground game in Thievn's Den.",
  alternates: { canonical: "/playground/night-grab" },
  openGraph: {
    title: "Night Grab · Thievn's Den",
    description: "Sixty seconds. Grab the bag. Don’t get clocked.",
    url: "https://thievnsden.com/playground/night-grab",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
