import { LootHub } from "@/components/loot/LootHub";
import { loadLootCatalog } from "@/lib/loot-load";

export const dynamic = "force-dynamic";

export default async function LootPage() {
  const { picks } = await loadLootCatalog();
  return <LootHub initialPicks={picks} />;
}
