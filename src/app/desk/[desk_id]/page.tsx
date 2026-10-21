import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeskBoard } from "@/components/desks/DeskBoard";
import { DESKS, isDeskId } from "@/lib/desks/ids";
import { loadDesks } from "@/lib/desks/remote";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata({ params }: { params: Promise<{ desk_id: string }> }): Promise<Metadata> {
  const { desk_id } = await params;
  return {
    title: isDeskId(desk_id) ? DESKS[desk_id].name : "Desks",
    robots: { index: false, follow: false },
  };
}

export default async function DeskPage({ params }: { params: Promise<{ desk_id: string }> }) {
  const { desk_id } = await params;
  if (!isDeskId(desk_id)) notFound();
  const bundle = await loadDesks();
  return <DeskBoard detail={bundle.details[desk_id]} source={bundle.source} error={bundle.error} />;
}
