import type { Metadata } from "next";
import "./loot.css";

export const metadata: Metadata = {
  title: "Loot",
  description: "Things that actually earned a place in the Den.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
