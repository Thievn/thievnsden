import { NextRequest, NextResponse } from "next/server";
import { heatAuth } from "@/lib/heat-check-server";
import { isAdmin } from "@/lib/admin";
import { isHeatOwner } from "@/lib/heat-check";
import { listHeatModules } from "@/lib/heat-prompt-cache";

export async function GET(req: NextRequest) {
  const { user, settings, play } = await heatAuth(req);
  const modules = await listHeatModules().catch(() => ({ roles: [], heats: [], voices: [], openers: [] }));
  return NextResponse.json({
    loggedIn: !!user,
    play,
    comingSoon: !!user && !play,
    kill: settings.kill,
    public: settings.public,
    peekDefault: settings.peek_default,
    faceGen: settings.face_gen,
    skins: settings.skins,
    admin: isAdmin(user),
    owner: isHeatOwner(user),
    roles: modules.roles,
    heats: modules.heats,
    voices: modules.voices,
    openers: modules.openers,
  });
}
