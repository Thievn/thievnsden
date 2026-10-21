import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DeskNav } from "@/components/desks/DeskNav";
import "@/components/desks/desks.css";
import { hasOwnerSession } from "@/lib/guard";

export const metadata: Metadata = {
  title: "Desks",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasOwnerSession())) redirect("/?lock=1");
  return (
    <div className="desk-shell">
      <a className="skip" href="#desk-main">Skip to content</a>
      <DeskNav />
      <main id="desk-main" className="desk-main">{children}</main>
    </div>
  );
}
