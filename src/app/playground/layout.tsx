import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Face The Den",
  description:
    "Face The Den is an AI photo judgment tool from Thievn's Den. Upload a photo, pick a style, get scored. Honest, unhinged, or somewhere in between. Mature audiences.",
  alternates: { canonical: "/playground" },
  openGraph: {
    title: "Face The Den · AI photo judgment",
    description:
      "Upload a photo. Choose how you want to be judged. Get a score and a verdict from the Den.",
    url: "https://thievnsden.com/playground",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
