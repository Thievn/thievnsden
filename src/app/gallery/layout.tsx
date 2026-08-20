import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Face The Den gallery — public judgments from the void. Swipe, like, and move on.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
