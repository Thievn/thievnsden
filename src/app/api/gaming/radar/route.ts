import { NextResponse } from "next/server";

/** Live unsaved RAWG extras used to 404 when clicked. The hub now only shows stored cards. */
export async function GET() {
  return NextResponse.json({ items: [], reason: "stored_only" });
}
