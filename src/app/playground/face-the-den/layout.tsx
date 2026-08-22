import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Face The Den",
  description:
    "Upload a photo. Get judged. Gallery and ranks. AI roast game from Thievn's Den. 18+.",
  alternates: { canonical: "/playground/face-the-den" },
  openGraph: {
    title: "Face The Den · Thievn's Den",
    description: "Upload a photo. Choose how you want to be judged. Get a score.",
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
