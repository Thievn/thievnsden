import type { Metadata } from "next";
import "./loot.css";

export const metadata: Metadata = {
  title: "Loot",
  description: "Mini takes on gear, merch, and den tools. Affiliate search lists, not fake roundups.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
