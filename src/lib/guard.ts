import { cookies } from "next/headers";
import { readSessionToken, SESSION_COOKIE } from "./session";

export async function hasOwnerSession(): Promise<boolean> {
  const jar = await cookies();
  return readSessionToken(jar.get(SESSION_COOKIE)?.value);
}
