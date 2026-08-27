export function PlaygroundCardArt({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="pg-card-still" />
      <div className="pg-card-veil" />
    </>
  );
}
