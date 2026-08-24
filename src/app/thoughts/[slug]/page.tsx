import { notFound } from "next/navigation";
import { ThoughtArticle } from "@/components/ThoughtArticle";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DynamicThoughtPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase.from("den_thoughts").select("*").eq("slug", slug).eq("published", true).maybeSingle();
  if (!data) notFound();
  const paras = String(data.body || "").split(/\n\n+/).filter(Boolean);
  const created = data.created_at ? new Date(data.created_at) : new Date();
  const date = created.toLocaleString("en-US", { month: "short", year: "numeric" });
  const words = String(data.body || "").split(/\s+/).length;
  const readTime = `${Math.max(2, Math.round(words / 220))} min`;
  return (
    <ThoughtArticle title={data.title} date={date} readTime={readTime} slug={data.slug} cover={data.cover_url || undefined}>
      {paras.map((p: string, i: number) => (
        <p key={i}>{p}</p>
      ))}
    </ThoughtArticle>
  );
}
