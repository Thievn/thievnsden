import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LabApp, type LabView } from "@/components/den/lab/LabApp";
import { hasOwnerSession } from "@/lib/guard";
import "@/components/den/lab/lab.css";

const VIEWS = new Set<LabView>(["create", "gallery", "edit", "characters"]);

export const metadata: Metadata = {
  title: "Lab",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function LabPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ shot?: string; character?: string }>;
}) {
  if (!(await hasOwnerSession())) notFound();
  const { slug } = await params;
  const query = await searchParams;
  const head = !slug?.length ? "create" : slug.length === 1 ? slug[0] : "";
  if (!VIEWS.has(head as LabView)) notFound();
  return (
    <LabApp
      view={head as LabView}
      shot={typeof query.shot === "string" ? query.shot : ""}
      character={typeof query.character === "string" ? query.character : ""}
    />
  );
}
