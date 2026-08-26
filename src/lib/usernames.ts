import type { createServiceClient } from "@/lib/supabase/server";

type Service = ReturnType<typeof createServiceClient>;

export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase();
}

export async function isUsernameTaken(
  supabase: Service,
  username: string,
  excludeUserId?: string | null
) {
  const trimmed = username.trim();
  const key = normalizeUsername(trimmed);
  if (!key) return true;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", trimmed)
    .maybeSingle();

  if (profile && profile.id !== excludeUserId) return true;

  const { data: used } = await supabase
    .from("used_usernames")
    .select("username, user_id")
    .eq("username", key)
    .maybeSingle();

  if (used && used.user_id !== excludeUserId) return true;
  return false;
}

export async function claimUsername(
  supabase: Service,
  username: string,
  userId: string,
  source: "cast" | "user" = "user"
) {
  const key = normalizeUsername(username);
  const { error } = await supabase.from("used_usernames").insert({
    username: key,
    user_id: userId,
    source,
  });

  if (!error) return;

  if (error.code === "23505") {
    const { data } = await supabase
      .from("used_usernames")
      .select("user_id")
      .eq("username", key)
      .maybeSingle();
    if (data?.user_id === userId) return;
    throw new Error("USERNAME_TAKEN");
  }

  throw new Error(`USERNAME_LEDGER: ${error.message}`);
}
