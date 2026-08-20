import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AgeGate } from "@/components/AgeGate";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SiteChrome } from "@/components/SiteChrome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Thievn's Den",
  description: "Dark thoughts, cynical humor, AI art, and the occasional roast. Welcome to the Den.",
  keywords: ["Thievn", "AI art", "dark humor", "anime", "gaming"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#070707",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#070707] text-neutral-200 overflow-x-hidden">
        <AgeGate />
        <Navbar />
        <SiteChrome>
          <main className="flex-1 w-full">{children}</main>
        </SiteChrome>
        <Footer />
      </body>
    </html>
  );
}
