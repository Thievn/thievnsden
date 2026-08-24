"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Item = { name: string; status: "wait" | "up" | "ok" | "fail"; error?: string };

export function BulkUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [caption, setCaption] = useState("Board drop");
  const [makePublic, setMakePublic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const run = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return setMsg("Pick image files");

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return setMsg("Log in as admin");

    setBusy(true);
    setMsg("");
    setItems(list.map((f) => ({ name: f.name, status: "wait" })));

    let ok = 0;
    for (let i = 0; i < list.length; i++) {
      setItems((prev) => prev.map((it, j) => (j === i ? { ...it, status: "up" } : it)));
      try {
        const form = new FormData();
        form.set("userId", userId);
        form.set("caption", caption);
        form.set("public", makePublic ? "1" : "0");
        form.set("file", list[i]);
        const res = await fetch("/api/admin/afterimage/bulk", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");
        ok += 1;
        setItems((prev) => prev.map((it, j) => (j === i ? { ...it, status: "ok" } : it)));
      } catch (err: any) {
        setItems((prev) =>
          prev.map((it, j) => (j === i ? { ...it, status: "fail", error: err.message } : it))
        );
      }
    }

    setMsg(`${ok} of ${list.length} on the board`);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="rounded-2xl border border-fuchsia-900/30 bg-gradient-to-b from-fuchsia-950/20 to-[#111] p-5 space-y-4">
      <div>
        <p className="text-sm text-neutral-100 font-medium">Bulk drop to the board</p>
        <p className="text-xs text-neutral-500 mt-1">
          Pick a bunch from your phone. They show as your prints — username on the card, people can save them.
        </p>
      </div>
      <label className="block space-y-1">
        <span className="text-[10px] uppercase tracking-wide text-neutral-500">Caption for this batch</span>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-neutral-800 text-sm"
          placeholder="Board drop"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-neutral-300">
        <input type="checkbox" checked={makePublic} onChange={(e) => setMakePublic(e.target.checked)} />
        Put on public board right away
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        disabled={busy}
        onChange={(e) => run(e.target.files)}
        className="block w-full text-sm text-neutral-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-fuchsia-900/40 file:text-fuchsia-100"
      />
      {busy && <p className="text-xs text-amber-200">Uploading one by one — leave this page open.</p>}
      {msg && <p className="text-xs text-fuchsia-200">{msg}</p>}
      {items.length > 0 && (
        <ul className="space-y-1 max-h-40 overflow-y-auto text-[11px]">
          {items.map((it, i) => (
            <li key={i} className="flex justify-between gap-2 text-neutral-400">
              <span className="truncate">{it.name}</span>
              <span className={it.status === "ok" ? "text-green-400" : it.status === "fail" ? "text-red-400" : "text-neutral-500"}>
                {it.status === "wait" && "queued"}
                {it.status === "up" && "uploading"}
                {it.status === "ok" && "done"}
                {it.status === "fail" && (it.error || "failed")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
