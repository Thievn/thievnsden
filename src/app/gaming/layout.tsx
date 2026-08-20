import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gaming",
  description:
    "Gaming notes from Thievn's Den — builds, rants, and whatever is currently on the screen.",
  alternates: { canonical: "/gaming" },
};

export default function GamingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
