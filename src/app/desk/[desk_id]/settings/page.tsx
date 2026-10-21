import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeskSettings } from "@/components/desks/DeskSettings";
import { DESKS, isDeskId } from "@/lib/desks/ids";
import { loadDesks } from "@/lib/desks/remote";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata({ params }: { params: Promise<{ desk_id: string }> }): Promise<Metadata> {
  const { desk_id } = await params;
  const name = isDeskId(desk_id) ? DESKS[desk_id].name : "Desks";
  return { title: `${name} settings`, robots: { index: false, follow: false } };
}

export default async function DeskSettingsPage({ params }: { params: Promise<{ desk_id: string }> }) {
  const { desk_id } = await params;
  if (!isDeskId(desk_id)) notFound();
  const bundle = await loadDesks();
  const detail = bundle.details[desk_id];
  return (
    <DeskSettings
      deskId={detail.id}
      venue={detail.venue}
      settings={detail.settings}
      settingsSaved={detail.settingsSaved}
      using={detail.using}
      wallets={detail.wallets}
      error={bundle.error}
    />
  );
}
