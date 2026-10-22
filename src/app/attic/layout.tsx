import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasOwnerSession } from "@/lib/guard";

export const metadata: Metadata = {
  title: "Lab",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LabLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasOwnerSession())) notFound();
  return children;
}
