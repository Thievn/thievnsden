import { redirect } from "next/navigation";
import { Dashboard } from "@/components/den/Dashboard";
import { hasOwnerSession } from "@/lib/guard";

export const dynamic = "force-dynamic";

export default async function DenPage() {
  if (!(await hasOwnerSession())) redirect("/?lock=1");
  return <Dashboard />;
}
