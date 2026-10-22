import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LabApp, type LabView } from "@/components/den/lab/LabApp";
import { hasOwnerSession } from "@/lib/guard";
import "@/components/den/lab/lab.css";

const VIEWS = new Set<LabView>(["create", "gallery", "edit"]);

export const metadata: Metadata = {
  title: "Lab",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function LabPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  if (!(await hasOwnerSession())) notFound();
  const { slug } = await params;
  const head = !slug?.length ? "create" : slug.length === 1 ? slug[0] : "";
  if (!VIEWS.has(head as LabView)) notFound();
  return <LabApp view={head as LabView} />;
}
