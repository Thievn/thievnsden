"use client";

import { useState, useEffect } from "react";

interface Comment {
  id: string;
  name: string;
  text: string;
  time: string;
  isAnonymous: boolean;
}

interface ThoughtCommentsProps {
  slug: string;
}

const DEN_NAMES = [
  "A voice from the Den",
  "Someone in the dark",
  "Quiet observer",
  "Passing shadow",
  "Unnamed",
  "A regular here",
  "Just visiting",
];

function getRandomDenName() {
  return DEN_NAMES[Math.floor(Math.random() * DEN_NAMES.length)];
}

export function ThoughtComments({ slug }: ThoughtCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [asAnonymous, setAsAnonymous] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`den-comments-${slug}`);
      if (stored) setComments(JSON.parse(stored));
    } catch {}
    setReady(true);
  }, [slug]);

  const save = (next: Comment[]) => {
    setComments(next);
    try {
      localStorage.setItem(`den-comments-${slug}`, JSON.stringify(next));
    } catch {}
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const displayName = asAnonymous
      ? getRandomDenName()
      : name.trim() || getRandomDenName();

    const newComment: Comment = {
      id: Date.now().toString(),
      name: displayName,
      text: text.trim(),
      time: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      isAnonymous: asAnonymous || !name.trim(),
    };

    save([newComment, ...comments]);
    setText("");
  };

  if (!ready) return null;

  return (
    <div className="mt-14 pt-10 border-t border-neutral-900">
      <h3 className="text-sm font-medium text-neutral-200 mb-6">
        Comments <span className="text-neutral-500 font-normal">({comments.length})</span>
      </h3>

      {/* Form */}
      <form onSubmit={submit} className="mb-8 space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Leave a thought..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-[#0d0d0d] border border-neutral-800 text-neutral-200 text-sm placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 resize-none"
        />

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer">
              <input
                type="checkbox"
                checked={asAnonymous}
                onChange={(e) => setAsAnonymous(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-0 focus:ring-offset-0"
              />
              Post anonymously
            </label>

            {!asAnonymous && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Display name"
                className="flex-1 max-w-[180px] px-3 py-1.5 rounded-lg bg-[#0d0d0d] border border-neutral-800 text-neutral-200 text-sm placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
              />
            )}
          </div>

          <button
            type="submit"
            disabled={!text.trim()}
            className="px-5 py-2 rounded-xl bg-gradient-to-b from-red-800/80 to-purple-900/80 text-white text-sm font-medium disabled:opacity-40 hover:from-red-700/80 hover:to-purple-800/80 transition-all"
          >
            Post
          </button>
        </div>
      </form>

      {/* List */}
      <div className="space-y-4">
        {comments.length === 0 && (
          <p className="text-sm text-neutral-600 py-4">No comments yet. Be the first.</p>
        )}

        {comments.map((c) => (
          <div
            key={c.id}
            className="p-4 rounded-xl border border-neutral-800/80 bg-[#0d0d0d]"
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-sm font-medium ${
                  c.isAnonymous
                    ? "text-purple-400/90"
                    : "text-red-300/90"
                }`}
              >
                {c.name}
              </span>
              <span className="text-[11px] text-neutral-600">{c.time}</span>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed">{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
