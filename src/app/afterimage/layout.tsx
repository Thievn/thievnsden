import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Afterimage",
  description: "Make a phone wallpaper. Preview once. Phone-ready when you buy credits.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
