import type { Metadata } from "next";

const title = "Gaming";
const description =
  "Full-page takes on games out now, coming soon, and classics, plus Den notes. Shelved by release date. No press kits.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/gaming" },
  openGraph: {
    title: `${title} · Thievn's Den`,
    description,
    url: "https://thievnsden.com/gaming",
    images: [
      {
        url: "/api/og?title=Gaming&subtitle=Now%20playing%20%C2%B7%20Radar%20%C2%B7%20Den%20takes&section=Gaming",
        width: 1200,
        height: 630,
        alt: "Thievn's Den Gaming",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} · Thievn's Den`,
    description,
    images: [
      "/api/og?title=Gaming&subtitle=Now%20playing%20%C2%B7%20Radar%20%C2%B7%20Den%20takes&section=Gaming",
    ],
  },
};

export default function GamingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
