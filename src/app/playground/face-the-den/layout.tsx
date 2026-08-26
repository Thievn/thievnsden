import type { Metadata } from "next";
import "./face-the-den.css";

export const metadata: Metadata = {
  title: "Face The Den",
  description:
    "Drop a photo. Get roasted. Mark or Cut the stack. Dual leaderboards in Thievn's Den. 18+.",
  alternates: { canonical: "/playground/face-the-den" },
  openGraph: {
    title: "Face The Den · Thievn's Den",
    description: "Drop a photo. Pick a voice. The Den looks at the picture and talks back.",
    url: "https://thievnsden.com/playground/face-the-den",
  },
};

export default function FaceTheDenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
