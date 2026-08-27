import { splitLinkedCopy, type CopyPart } from "@/lib/gaming-affiliates";

function Parts({ parts }: { parts: CopyPart[] }) {
  return (
    <>
      {parts.map((part, i) =>
        part.type === "link" ? (
          <a
            key={`${part.href}-${i}`}
            href={part.href}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            className="underline underline-offset-[3px] decoration-violet-400/70 text-violet-200 hover:text-violet-100 hover:decoration-violet-300"
          >
            {part.text}
          </a>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}

export function LinkedCopy({
  text,
  mode = "essay",
  className = "",
}: {
  text: string;
  mode?: "essay" | "game";
  className?: string;
}) {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className={className || "space-y-5 text-[16px] sm:text-[17px] text-neutral-300 leading-[1.7]"}>
      {paragraphs.map((p, i) => (
        <p key={i}>
          <Parts parts={splitLinkedCopy(p, mode)} />
        </p>
      ))}
    </div>
  );
}
