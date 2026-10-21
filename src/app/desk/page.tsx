import { DeskHub } from "@/components/desks/DeskHub";
import { loadDesks } from "@/lib/desks/remote";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DeskHome() {
  const bundle = await loadDesks();
  return <DeskHub cards={bundle.cards} source={bundle.source} error={bundle.error} />;
}
