import type { Metadata } from "next";
import Link from "next/link";
import { DenHero } from "@/components/den/DenHero";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who runs Thievn's Den, what the site is for, and what to expect — dark humor, AI art, gaming, and unfiltered writing.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Thievn's Den",
    description:
      "A personal corner of the internet for dark thoughts, cynical humor, AI art, and honest takes.",
    url: "https://thievnsden.com/about",
  },
};

const ROOMS = [
  { href: "/thoughts", label: "Thoughts", line: "Essays people usually keep quiet." },
  { href: "/playground/face-the-den", label: "Face The Den", line: "Upload. Get judged. Climb." },
  { href: "/loot", label: "Loot", line: "Gear that actually got used." },
  { href: "/gaming", label: "Gaming", line: "What's on the plate. No press kits." },
  { href: "/afterimage", label: "Afterimage", line: "A lock screen that isn't stock." },
  { href: "/playground", label: "Playground", line: "Machines in the back room." },
  { href: "/playground/heat-check", label: "Heat Check", line: "They'll read it twice." },
];

export default function AboutPage() {
  return (
    <div className="home-den relative">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <DenHero
          kicker="The house · 18+"
          title="The Den isn't a brand."
          accent="It's a room."
          body="Run by Thievn. Dark humor, honest writing, AI art, gaming, and tools that don't pretend to be wholesome. Intentionally not corporate. Mature by design."
          actions={
            <>
              <a
                href="https://x.com/Thievn"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-gradient-to-b from-red-600 via-red-800 to-purple-900 text-white font-medium text-center"
              >
                Follow on X
              </a>
              <Link
                href="/join"
                className="px-6 py-3 rounded-xl border border-white/15 text-neutral-100 font-medium text-center hover:border-rose-400/40"
              >
                Join the Den
              </Link>
            </>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {ROOMS.map((room) => (
            <Link key={room.href} href={room.href} className="home-room rounded-3xl border border-neutral-800/80 bg-[#111] p-6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-rose-300/80 mb-2">{room.label}</p>
              <p className="text-neutral-200 font-medium">{room.line}</p>
              <p className="mt-5 text-sm text-neutral-500">Open →</p>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-rose-900/30 bg-gradient-to-b from-[#16080e] to-[#0b0b0b] p-8 glow-accent">
          <p className="text-neutral-400 leading-relaxed">
            Most of the Den stays free. Accounts unlock saving results and future extras.
            The tone matches the X account: a little unhinged, mostly honest.
          </p>
          <p className="mt-4 text-sm text-neutral-500">
            Primary presence:{" "}
            <a href="https://x.com/Thievn" target="_blank" rel="noopener noreferrer" className="text-rose-300 hover:text-rose-200">
              x.com/Thievn
            </a>
            {" · "}thievnsden.com
          </p>
        </div>
      </div>
    </div>
  );
}
