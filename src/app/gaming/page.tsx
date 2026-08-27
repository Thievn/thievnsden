import { GamingHub } from "@/components/gaming/GamingHub";
import { loadGamingCatalog } from "@/lib/gaming-load";

export const dynamic = "force-dynamic";

export default async function GamingPage() {
  const { items, config } = await loadGamingCatalog();
  return <GamingHub initialItems={items} initialConfig={config} />;
}
