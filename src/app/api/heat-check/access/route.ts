import { NextRequest, NextResponse } from "next/server";
import { heatAuth } from "@/lib/heat-check-server";
import { isAdmin } from "@/lib/admin";
import { isHeatOwner } from "@/lib/heat-check";

export async function GET(req: NextRequest) {
  const { user, settings, play } = await heatAuth(req);
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
  });
}
