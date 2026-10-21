import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { hasOwnerSession } from "@/lib/guard";

export const metadata: Metadata = {
  title: "Den",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DenLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasOwnerSession())) redirect("/?lock=1");
  return children;
}
