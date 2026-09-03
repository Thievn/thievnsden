import { NextRequest } from "next/server";
import { POST as dispatch } from "@/app/api/admin/x-thoughts/dispatch/route";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function GET(req: NextRequest) {
  return dispatch(req);
}
