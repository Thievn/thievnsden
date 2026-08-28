import type { Metadata } from "next";
import "./loot.css";

export const metadata: Metadata = {
  title: "Loot",
  description: "Gear, merch, and den tools that earned a place. Mini takes, not a catalog.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
