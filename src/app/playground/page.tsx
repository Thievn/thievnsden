import { artUrlMap } from "@/lib/playground-games";
import { loadPlaygroundArt } from "@/lib/playground-art";
import { PlaygroundLobby } from "./PlaygroundLobby";

export const dynamic = "force-dynamic";

export default async function PlaygroundPage() {
  let arts: Record<string, string> = {};
  try {
    arts = artUrlMap(await loadPlaygroundArt());
  } catch {
    arts = {};
  }
  return <PlaygroundLobby arts={arts} />;
}
