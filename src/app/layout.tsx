import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { AgeGate } from "@/components/AgeGate";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SiteChrome } from "@/components/SiteChrome";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { JsonLd } from "@/components/JsonLd";
import { PwaRegister } from "@/components/PwaRegister";
import { DenBoot } from "@/components/DenBoot";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteTitle = "Thievn's Den";
const siteDescription =
  "Dark humor, honest writing, AI art, gaming, and experimental tools from Thievn. Home of Face The Den and unfiltered thoughts.";

const ogImage =
  "/api/og?title=Thievn%27s%20Den&subtitle=Dark%20humor%20%C2%B7%20Gaming%20%C2%B7%20Face%20The%20Den";

export const metadata: Metadata = {
  metadataBase: new URL("https://thievnsden.com"),
  title: {
    default: siteTitle,
    template: `%s · Thievn's Den`,
  },
  description: siteDescription,
  applicationName: "Thievn's Den",
  authors: [{ name: "Thievn", url: "https://thievnsden.com/about" }],
  creator: "Thievn",
  publisher: "Thievn",
  keywords: [
    "Thievn",
    "Thievn's Den",
    "dark humor",
    "AI art",
    "AI roast",
    "Face The Den",
    "gaming",
    "personal essays",
    "cynical humor",
    "anime art",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://thievnsden.com",
    siteName: "Thievn's Den",
    title: siteTitle,
    description: siteDescription,
    images: [{ url: ogImage, width: 1200, height: 630, alt: "Thievn's Den" }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    creator: "@Thievn",
    site: "@Thievn",
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "entertainment",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Thievn's Den",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#070707",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#070707] text-neutral-200 overflow-x-hidden">
        <JsonLd />
        <DenBoot />
        <AgeGate />
        <Navbar />
        <SiteChrome>
          <main className="flex-1 w-full">{children}</main>
        </SiteChrome>
        <Footer />
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        <PwaRegister />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
