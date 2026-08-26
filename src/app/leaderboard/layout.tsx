import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "The Marked and The Cut — Face The Den boards. Top 10 on each side.",
  alternates: { canonical: "/leaderboard" },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
