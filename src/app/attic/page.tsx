import { Attic } from "@/components/den/Attic";
import { hasOwnerSession } from "@/lib/guard";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AtticPage() {
  if (!(await hasOwnerSession())) notFound();
  return <Attic />;
}
