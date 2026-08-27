export function PlaygroundCardArt({
  url,
  tone = "lobby",
}: {
  url?: string;
  tone?: "lobby" | "home";
}) {
  if (!url) return null;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className={`pg-card-still ${tone === "home" ? "pg-card-still-home" : ""}`} />
      <div className={`pg-card-veil ${tone === "home" ? "pg-card-veil-home" : ""}`} />
    </>
  );
}

