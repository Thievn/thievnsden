import type { User } from "@supabase/supabase-js";

const ADMIN_EMAIL = "thievnsden@gmail.com";
const ADMIN_USERNAME = "thievn"; // compared case-insensitive

export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false;

  const email = (user.email || "").toLowerCase();
  const username = (user.user_metadata?.username || "").toLowerCase();

  return email === ADMIN_EMAIL || username === ADMIN_USERNAME;
}

export const ADMIN_DISPLAY = "Thievn";
