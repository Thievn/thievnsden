"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import {
  HEAT_APPEARANCES,
  HEAT_FADE_HELP,
  HEAT_JOIN,
  HEAT_LEVELS,
  HEAT_LOGIN,
  HEAT_LOOKS,
  HEAT_ORIENTATIONS,
  HEAT_PRESENTATIONS,
  HEAT_PRONOUNS,
  HEAT_ROLES,
  HEAT_SKINS,
  HEAT_STARTERS,
  HEAT_TAGLINE,
  HEAT_VOICES,
  isFadeText,
  type HeatAppearance,
  type HeatLevel,
  type HeatLook,
  type HeatMessage,
  type HeatOrientation,
  type HeatPresentation,
  type HeatPronouns,
  type HeatRole,
  type HeatSkin,
  type HeatStarter,
  type HeatThread,
  type HeatTip,
  type HeatVoice,
} from "@/lib/heat-check";
import { readJson } from "@/lib/read-json";

type Screen = "boot" | "gate" | "soon" | "start" | "chat" | "recap";
type Recap = {
  heat: number;
  pacing: number;
  cringe: number;
  mood_handled: number;
  best_line: string;
  clean_quote: string;
};

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 1280;
        let { width, height } = img;
        if (width > max || height > max) {
          if (width > height) {
            height = Math.round((height * max) / width);
            width = max;
          } else {
            width = Math.round((width * max) / height);
            height = max;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(String(reader.result));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
      };
      img.onerror = () => resolve(String(reader.result));
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function HeatCheckApp() {
  const [screen, setScreen] = useState<Screen>("boot");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [peekDefault, setPeekDefault] = useState(true);
  const [faceGenOn, setFaceGenOn] = useState(true);
  const [skins, setSkins] = useState({ ios: true, android: true });

  const [role, setRole] = useState<HeatRole>("first-time");
  const [heat, setHeat] = useState<HeatLevel>("tease");
  const [voice, setVoice] = useState<HeatVoice>("shy");
  const [who, setWho] = useState<HeatStarter>("they");
  const [skin, setSkin] = useState<HeatSkin>("ios");
  const [look, setLook] = useState<HeatLook>("woman");
  const [presentation, setPresentation] = useState<HeatPresentation>("default");
  const [appearance, setAppearance] = useState<HeatAppearance>("any");
  const [pronouns, setPronouns] = useState<HeatPronouns>("she");
  const [orientation, setOrientation] = useState<HeatOrientation>("bi");
  const [wantFace, setWantFace] = useState(false);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [roleOpts, setRoleOpts] = useState(HEAT_ROLES);
  const [tipsByMsg, setTipsByMsg] = useState<Record<string, HeatTip>>({});
  const [openTipId, setOpenTipId] = useState<string | null>(null);

  const [thread, setThread] = useState<HeatThread | null>(null);
  const [messages, setMessages] = useState<HeatMessage[]>([]);
  const [tip, setTip] = useState<HeatTip | null>(null);
  const [rail, setRail] = useState(false);
  const [tipReady, setTipReady] = useState(false);
  const [typing, setTyping] = useState(false);
  const [receipt, setReceipt] = useState<"sent" | "delivered" | "read">("sent");
  const [draft, setDraft] = useState("");
  const [menu, setMenu] = useState(false);
  const [press, setPress] = useState<{ x: number; y: number; msg: HeatMessage } | null>(null);
  const [recap, setRecap] = useState<Recap | null>(null);
  const [pendingThem, setPendingThem] = useState<HeatMessage[]>([]);
  const [plusOpen, setPlusOpen] = useState(false);
  const [meInitial, setMeInitial] = useState("U");
  const [myFaceUrl, setMyFaceUrl] = useState<string | null>(null);
  const [newContact, setNewContact] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const libRef = useRef<HTMLInputElement>(null);
  const plusIntent = useRef<"mine" | "chat" | "pick">("pick");
  const pendingRef = useRef<File | null>(null);

  const threadEl = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const peekTimer = useRef<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => {
      document.documentElement.style.setProperty("--hc-vt", `${Math.max(0, vv.offsetTop)}px`);
      document.documentElement.style.setProperty("--hc-vv", `${vv.height}px`);
    };
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
    };
  }, []);

  const scrollEnd = () => {
    requestAnimationFrame(() => {
      const el = threadEl.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  };

  useEffect(() => {
    scrollEnd();
  }, [messages, typing, pendingThem, screen]);

  useEffect(() => {
    if (screen !== "chat") return;
    document.documentElement.classList.add("hc-kb-lock");
    return () => document.documentElement.classList.remove("hc-kb-lock");
  }, [screen]);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const preview = params.get("preview");
      if (preview === "chat" || preview === "tip" || preview === "recap" || preview === "start" || preview === "soon") {
        applyPreview(preview, { setScreen, setThread, setMessages, setTip, setRail, setRecap, setSkin, setTipsByMsg, setOpenTipId, setReceipt });
        return;
      }
      const nightId = params.get("night");
      const { data } = await supabase.auth.getSession();
      const uname = String(data.session?.user?.user_metadata?.username || data.session?.user?.email || "U");
      setMeInitial(uname.slice(0, 1).toUpperCase());
      if (!data.session?.user) {
        setScreen("gate");
        return;
      }
      const res = await fetch("/api/heat-check/access", { headers: await authHeaders() });
      const json = await readJson(res);
      setPeekDefault(json.peekDefault !== false);
      setFaceGenOn(json.faceGen === true);
      if (json.faceGen !== true) setWantFace(false);
      setSkins(json.skins || { ios: true, android: true });
      if (Array.isArray(json.roles) && json.roles.length) {
        setRoleOpts(json.roles.map((r: { slug: string; label: string; body?: string }) => ({ id: r.slug, label: r.label, line: r.body || "" })));
      }
      if (!json.play) {
        setScreen("soon");
        return;
      }
      if (nightId) {
        const night = await fetch(`/api/heat-check/threads/${nightId}`, { headers: await authHeaders() });
        const data = await readJson(night);
        if (data.thread) {
          setThread(data.thread);
          setSkin(data.thread.skin || "ios");
          setMyFaceUrl(data.thread.user_photo_url || null);
          setMessages((data.messages || []).map((m: HeatMessage & { role?: string }) => ({ ...m, sender: m.sender || m.role || "them" })));
          const map: Record<string, HeatTip> = {};
          for (const row of data.tips || []) {
            if (row.message_id) map[row.message_id] = row;
          }
          setTipsByMsg(map);
          const lastTip = (data.tips || [])[(data.tips || []).length - 1] || null;
          setTip(lastTip);
          setScreen("chat");
          return;
        }
      }
      setScreen("start");
    })();
  }, []);

  const openThread = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/heat-check/start", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          role,
          heat,
          voice,
          who_starts: who,
          skin,
          they_look: look,
          presentation,
          appearance,
          they_pronouns: pronouns,
          they_orientation: orientation,
          generate_face: faceGenOn && wantFace && !photoPath,
          user_photo_path: photoPath,
          user_photo_url: photoUrl,
          peek: peekDefault,
          new_contact: newContact,
        }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error === "coming_soon" ? "Still warming up." : data.error || "Could not open.");
      setThread(data.thread);
      setSkin(data.thread.skin);
      setMyFaceUrl(data.thread.user_photo_url || null);
      setNewContact(false);
      const incoming: HeatMessage[] = (data.messages || []).map((m: HeatMessage & { role?: string }) => ({
        ...m,
        sender: m.sender || m.role || "them",
      }));
      setMessages([]);
      setPendingThem(incoming);
      setTip(data.tip || null);
      setTipReady(!!data.tip);
      setTipsByMsg({});
      setScreen("chat");
      setReceipt("sent");
      if (data.faceError) setErr(data.faceError);
      if (data.opening) {
        setTyping(true);
        const open = await fetch("/api/heat-check/turn", {
          method: "POST",
          headers: await authHeaders(),
          body: JSON.stringify({ threadId: data.thread.id, opening: true }),
        });
        const opened = await readJson(open);
        const first: HeatMessage[] = (opened.them || []).map((m: HeatMessage & { role?: string }) => ({
          ...m,
          sender: m.sender || m.role || "them",
        }));
        if (first.length) setPendingThem(first);
        else setTyping(false);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not open.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (screen !== "chat" || !pendingThem.length) return;
    let cancelled = false;
    (async () => {
      setTyping(true);
      await wait(700 + Math.random() * 900);
      if (cancelled) return;
      setTyping(false);
      for (const msg of pendingThem) {
        if (cancelled) return;
        setMessages((m) => [...m, msg]);
        await wait(380);
      }
      setPendingThem([]);
    })();
    return () => {
      cancelled = true;
    };
  }, [pendingThem, screen]);

  useEffect(() => {
    if (screen !== "chat" || !thread?.id || thread.contact_face_url) return;
    let n = 0;
    const tick = window.setInterval(async () => {
      n += 1;
      const res = await fetch(`/api/heat-check/threads/${thread.id}`, { headers: await authHeaders() });
      const data = await readJson(res);
      if (data.thread?.contact_face_url) {
        setThread((t) => (t ? { ...t, contact_face_url: data.thread.contact_face_url } : t));
        window.clearInterval(tick);
      }
      if (n > 12) window.clearInterval(tick);
    }, 2500);
    return () => window.clearInterval(tick);
  }, [screen, thread?.id, thread?.contact_face_url]);

  const send = async (raw?: string, image?: { url: string; path?: string }) => {
    const text = (raw ?? draft).trim();
    if ((!text && !image) || !thread || busy) return;
    setDraft("");
    setBusy(true);
    setReceipt("delivered");
    setNote(null);
    const optimistic: HeatMessage = {
      id: `local-${Date.now()}`,
      thread_id: thread.id,
      user_id: thread.user_id,
      sender: "user",
      body: text,
      image_url: image?.url || null,
      score: null,
      delivered_at: new Date().toISOString(),
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    try {
      const res = await fetch("/api/heat-check/turn", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ threadId: thread.id, text, fade: isFadeText(text), imageUrl: image?.url, imagePath: image?.path }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Send failed");
      setMessages((m) => m.map((x) => (x.id === optimistic.id ? data.userMessage : x)));
      setTip(data.tip || null);
      if (data.tip && data.userMessage?.id) {
        setTipsByMsg((t) => ({ ...t, [data.userMessage.id]: data.tip }));
      }
      setTipReady(true);
      const delay = Number(data.turn?.read_delay_ms) || 2500;
      window.setTimeout(async () => {
        setReceipt("read");
        const ids = [data.userMessage?.id].filter(Boolean);
        if (ids.length) {
          await fetch(`/api/heat-check/threads/${thread.id}`, {
            method: "PATCH",
            headers: await authHeaders(),
            body: JSON.stringify({ action: "read", messageIds: ids }),
          });
        }
      }, delay);
      if (thread.peek) {
        if (peekTimer.current) window.clearTimeout(peekTimer.current);
        peekTimer.current = window.setTimeout(() => {
          setRail(true);
          peekTimer.current = window.setTimeout(() => setRail(false), 2200);
        }, 2000);
      }
      const them: HeatMessage[] = data.them || [];
      if (them.length) setPendingThem(them);
      if (data.recap) {
        setRecap(data.recap);
        window.setTimeout(() => setScreen("recap"), 1600);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Send failed");
      if (image) setNote("couldn't use that photo");
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const uploadFile = async (file: File, kind: "mine" | "chat" | "contact") => {
    const dataUrl = await fileToDataUrl(file);
    const res = await fetch("/api/heat-check/upload", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ image: dataUrl, kind }),
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return { path: data.path as string, url: data.url as string };
  };

  const uploadMine = async (file: File) => {
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch("/api/heat-check/upload", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ image: dataUrl, kind: "contact" }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setPhotoPath(data.path);
      setPhotoUrl(data.url || dataUrl);
      setPhotoName(file.name);
      setWantFace(false);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const applyMyFace = async (file: File) => {
    try {
      const up = await uploadFile(file, "mine");
      setMyFaceUrl(up.url);
      setThread((t) => (t ? { ...t, user_photo_url: up.url, user_photo_path: up.path } : t));
      if (thread?.id && thread.id !== "preview") {
        await fetch(`/api/heat-check/threads/${thread.id}`, {
          method: "PATCH",
          headers: await authHeaders(),
          body: JSON.stringify({ action: "my-face", path: up.path, url: up.url }),
        });
      }
      setPlusOpen(false);
      pendingRef.current = null;
    } catch {
      setNote("couldn't use that photo");
    }
  };

  const sendChatPhoto = async (file: File) => {
    try {
      const up = await uploadFile(file, "chat");
      setPlusOpen(false);
      pendingRef.current = null;
      await send(undefined, up);
    } catch {
      setNote("couldn't use that photo");
    }
  };

  const removeMyFace = async () => {
    setMyFaceUrl(null);
    setPlusOpen(false);
    if (thread?.id && thread.id !== "preview") {
      await fetch(`/api/heat-check/threads/${thread.id}`, {
        method: "PATCH",
        headers: await authHeaders(),
        body: JSON.stringify({ action: "remove-face" }),
      });
    }
  };

  const saveLine = async (line: string) => {
    await fetch("/api/heat-check/saves", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ line, threadId: thread?.id }),
    });
  };

  const reportLine = async (msg: HeatMessage) => {
    await fetch("/api/heat-check/report", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ threadId: thread?.id, messageId: msg.id, reason: "user" }),
    });
  };

  const switchSkin = async (next: HeatSkin) => {
    if (!skins[next]) return;
    setSkin(next);
    setMenu(false);
    if (thread) {
      await fetch(`/api/heat-check/threads/${thread.id}`, {
        method: "PATCH",
        headers: await authHeaders(),
        body: JSON.stringify({ skin: next }),
      });
    }
  };

  const fadeOut = () => {
    setMenu(false);
    send("FADE");
  };

  if (screen === "boot") {
    return (
      <div className="hc-root min-h-[70vh] grid place-items-center">
        <FlameMark className="w-10 h-12 opacity-90" />
      </div>
    );
  }

  if (screen === "gate") {
    return (
      <Shell>
        <StartFrame>
          <FlameMark className="w-9 h-11 mb-5" />
          <h1 className="hc-title text-5xl sm:text-6xl mb-4">Heat Check</h1>
          <p className="text-[#d9c4bb] text-lg mb-8 max-w-[24ch]">{HEAT_TAGLINE} You need a key.</p>
          <div className="flex flex-col gap-3">
            <Link href={HEAT_LOGIN} className="hc-cta">Log in</Link>
            <Link href={HEAT_JOIN} className="text-center text-sm text-[#c4a59a]">Join the Den</Link>
          </div>
        </StartFrame>
      </Shell>
    );
  }

  if (screen === "soon") {
    return (
      <Shell>
        <div className="hc-soon relative overflow-hidden rounded-[2rem] hc-rim min-h-[70vh] p-8 sm:p-12 flex flex-col justify-end">
          <div className="hc-grain" />
          <FlameMark className="w-9 h-11 mb-6" />
          <h1 className="hc-title text-5xl sm:text-6xl mb-3">Heat Check</h1>
          <p className="text-[#e8d2c8] text-lg max-w-[24ch] mb-2">{HEAT_TAGLINE}</p>
          <p className="text-sm text-[#b89a90] max-w-[34ch] leading-relaxed">
            Private hours. When it opens, it won&apos;t look like a default inbox.
          </p>
        </div>
      </Shell>
    );
  }

  if (screen === "start") {
    return (
      <Shell>
        <div className="hc-start-hero relative overflow-hidden rounded-[2rem] hc-rim">
          <div className="hc-ember w-64 h-64 -left-10 -top-8" />
          <div className="hc-grain" />
          <div className="relative z-[3] p-6 sm:p-8 pb-5">
            <Link href="/playground" className="text-xs text-[#b89a90] hover:text-white">← Playground</Link>
            <div className="mt-7 flex items-center gap-3">
              <FlameMark className="w-8 h-10 shrink-0" />
              <h1 className="hc-title text-4xl sm:text-5xl">Heat Check</h1>
            </div>
            <p className="mt-3 text-[#e4cfc6] text-[15px] max-w-[28ch]">{HEAT_TAGLINE}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SelectField label="Who they are" value={look} onChange={(v) => {
              const next = v as HeatLook;
              setLook(next);
              if (next === "woman" || next === "trans-woman") setPronouns("she");
              else if (next === "man" || next === "trans-man") setPronouns("he");
              else setPronouns("they");
            }} options={HEAT_LOOKS} />
            <SelectField label="Pronouns" value={pronouns} onChange={(v) => setPronouns(v as HeatPronouns)} options={HEAT_PRONOUNS} />
            <SelectField label="Look" value={presentation} onChange={(v) => setPresentation(v as HeatPresentation)} options={HEAT_PRESENTATIONS} />
            <SelectField label="Appearance" value={appearance} onChange={(v) => setAppearance(v as HeatAppearance)} options={HEAT_APPEARANCES} />
            <SelectField label="Orientation" value={orientation} onChange={(v) => setOrientation(v as HeatOrientation)} options={HEAT_ORIENTATIONS} />
            <SelectField label="Role" value={role} onChange={(v) => setRole(v as HeatRole)} options={roleOpts} />
            <SelectField label="Heat" value={heat} onChange={(v) => setHeat(v as HeatLevel)} options={HEAT_LEVELS} />
            <SelectField label="Voice" value={voice} onChange={(v) => setVoice(v as HeatVoice)} options={HEAT_VOICES} />
            <div className="sm:col-span-2">
              <p className="hc-kicker mb-2">Who starts</p>
              <div className="flex gap-2">
                <button type="button" className={cx("hc-chip hc-who-hot flex-1", who === "they" && "is-on")} aria-pressed={who === "they"} onClick={() => setWho("they")}>
                  They text first
                </button>
                <button type="button" className={cx("hc-chip flex-1", who === "you" && "is-on")} aria-pressed={who === "you"} onClick={() => setWho("you")}>
                  You open
                </button>
              </div>
            </div>
            <SelectField
              label="Phone mock"
              value={skin}
              onChange={(v) => setSkin(v as HeatSkin)}
              options={HEAT_SKINS.filter((s) => (s.id === "ios" ? skins.ios : skins.android))}
            />
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            {faceGenOn ? (
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>Generate their face</span>
                <input type="checkbox" checked={wantFace && !photoUrl} disabled={!!photoUrl} onChange={(e) => setWantFace(e.target.checked)} />
              </label>
            ) : null}
            <label className="flex items-center gap-3 text-sm">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="" className="hc-face hc-face-lg" />
              ) : (
                <span className="hc-face hc-face-lg grid place-items-center text-[11px] text-[#c4a59a]">+</span>
              )}
              <span className="flex-1">
                Their photo
                <span className="block text-[11px] text-[#9a7f76] mt-0.5">Shows as the round contact picture. Private to this night.</span>
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="max-w-[9.5rem] text-[11px] text-[#b89a90]"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadMine(f);
                }}
              />
            </label>
            {photoName ? <p className="text-[11px] text-[#9a7f76]">On the night · {photoName}</p> : null}
          </div>
          {err ? <p className="text-sm text-rose-300">{err}</p> : null}
          <button type="button" className="hc-cta" disabled={busy} onClick={openThread}>
            {busy ? "Opening…" : "Open night"}
          </button>
          <p className="text-[12px] leading-relaxed text-[#8a7670] px-1">{HEAT_FADE_HELP}</p>
        </div>
      </Shell>
    );
  }

  if (screen === "recap" && recap) {
    return (
      <Shell>
        <div className="hc-recap relative overflow-hidden rounded-[2rem] hc-rim p-6 sm:p-8">
          <div className="hc-recap-art absolute inset-0 opacity-35" />
          <div className="hc-grain" />
          <div className="relative z-[3]">
            <FlameMark className="w-8 h-10 mb-5" />
            <p className="hc-kicker mb-2">Kept</p>
            <h2 className="hc-title text-4xl mb-6">The night, scored.</h2>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Stat n={recap.heat} l="Heat" />
              <Stat n={recap.pacing} l="Pacing" />
              <Stat n={recap.cringe} l="Cringe" invert />
              <Stat n={recap.mood_handled} l="Mood" />
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#c4a59a] mb-2">Best line</p>
            <p className="font-[family-name:var(--font-hc-serif)] text-2xl text-[#fff4ee] mb-4">&ldquo;{recap.best_line}&rdquo;</p>
            <button type="button" className="text-sm text-[#ffb199] mb-8" onClick={() => saveLine(recap.best_line)}>
              Save best line
            </button>
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 mb-6">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#c4a59a] mb-2">Share card</p>
              <p className="text-lg text-[#f6ece6]">Heat {recap.heat} · Pacing {recap.pacing}</p>
              <p className="mt-2 text-[#e8d2c8]">&ldquo;{recap.clean_quote}&rdquo;</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="hc-cta" onClick={() => { setRecap(null); setThread(null); setMessages([]); setScreen("start"); }}>
                Again
              </button>
              <button
                type="button"
                className="rounded-2xl border border-white/15 text-sm"
                onClick={() => {
                  setRecap(null);
                  setThread(null);
                  setMessages([]);
                  setWho("they");
                  setNewContact(true);
                  setScreen("start");
                }}
              >
                New contact
              </button>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <div className="hc-root hc-phone-wrap z-[70]">
      <div className="hc-phone hc-rim" data-skin={skin}>
        <div className="hc-grain" />
        <header className="hc-header">
          <button type="button" className="text-[#d9c4bb] text-lg px-1" onClick={() => setScreen("start")} aria-label="Back">
            ‹
          </button>
          <p className="hc-brand">Heat Check</p>
          <div className="relative justify-self-end">
            <button type="button" className="px-2 text-lg tracking-widest" onClick={() => setMenu((v) => !v)} aria-label="More">
              ⋯
            </button>
            {menu && (
              <div className="hc-menu">
                <button type="button" onClick={() => switchSkin(skin === "ios" ? "android" : "ios")}>
                  {skin === "ios" ? "Android skin" : "iOS skin"}
                </button>
                <button type="button" onClick={fadeOut}>Fade</button>
                <button type="button" onClick={() => { setMenu(false); setThread(null); setMessages([]); setNewContact(true); setScreen("start"); }}>
                  New contact
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="hc-contact">
          {thread?.contact_face_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thread.contact_face_url} alt="" className="hc-face" />
          ) : (
            <div className="hc-face grid place-items-center text-[11px] text-[#c4a59a]">
              {thread?.contact_name?.slice(0, 1) || "?"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[15px] font-medium truncate">{thread?.contact_name}</p>
            <p className="text-[11px] text-[#9a7f76] truncate">{thread?.last_seen_label || "just now"}</p>
          </div>
        </div>

        <button
          type="button"
          className={cx("hc-tip-handle", tipReady && "hc-pulse")}
          onClick={() => { setRail((v) => !v); setTipReady(false); }}
          aria-label="Tip"
        >
          <span className="hc-tip-bar" />
        </button>
        <div className={cx("hc-rail", rail ? "open" : "shut")}>
          <div className="hc-rail-inner flex items-center justify-between gap-3">
            <p className="text-sm text-[#f0e6e1] leading-snug">
              <span className="text-[#ffb199] mr-1">{tip?.score ?? "—"}/10</span>
              {tip?.tip || "Send something. The night grades in private."}
            </p>
            {tip?.rewrite ? (
              <button type="button" className="shrink-0 text-[11px] border border-white/30 rounded-lg px-2 py-1" onClick={() => { setDraft(tip.rewrite || ""); setRail(false); }}>
                Use this instead
              </button>
            ) : null}
          </div>
        </div>

        <div ref={threadEl} className="hc-thread" onClick={() => setPress(null)}>
          {messages.map((msg) => {
            const saved = tipsByMsg[msg.id];
            return (
              <div key={msg.id} className={cx("hc-stack", msg.sender === "user" && "me")}>
                <Bubble
                  msg={msg}
                  skin={skin}
                  faceUrl={thread?.contact_face_url || photoUrl}
                  name={thread?.contact_name || "?"}
                  meFaceUrl={myFaceUrl}
                  meInitial={meInitial}
                  onPress={(e) => {
                    e.preventDefault();
                    const point = "clientX" in e ? e : e.touches?.[0];
                    setPress({ x: point?.clientX || 80, y: point?.clientY || 120, msg });
                  }}
                />
                {msg.sender === "user" ? (
                  <>
                    <button
                      type="button"
                      className="hc-chevron"
                      onClick={async () => {
                        const next = openTipId === msg.id ? null : msg.id;
                        setOpenTipId(next);
                        if (next && !tipsByMsg[next] && thread?.id && thread.id !== "preview") {
                          const res = await fetch(`/api/heat-check/threads/${thread.id}`, { headers: await authHeaders() });
                          const data = await readJson(res);
                          const map: Record<string, HeatTip> = {};
                          for (const row of data.tips || []) {
                            if (row.message_id) map[row.message_id] = row;
                          }
                          setTipsByMsg((t) => ({ ...map, ...t }));
                        }
                      }}
                    >
                      {openTipId === msg.id ? "▾ tip" : "› tip"}
                    </button>
                    {openTipId === msg.id && (saved || (tip?.message_id === msg.id ? tip : null)) ? (
                      <div className="hc-tip-drop">
                        <p className="text-sm">
                          <span className="text-[#ffb199]">{(saved || tip)?.score}/10</span>
                          {" — "}
                          {(saved || tip)?.tip}
                        </p>
                        {(saved || tip)?.rewrite ? (
                          <button
                            type="button"
                            className="mt-2 text-[11px] border border-white/30 rounded-lg px-2 py-1"
                            onClick={() => { setDraft((saved || tip)?.rewrite || ""); setOpenTipId(null); }}
                          >
                            Use this instead
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            );
          })}
          {typing && (
            <div className="hc-row them">
              {thread?.contact_face_url || photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thread?.contact_face_url || photoUrl || ""} alt="" className="hc-face hc-face-sm self-end" />
              ) : (
                <div className="hc-face hc-face-sm grid place-items-center text-[10px] text-[#c4a59a] self-end">
                  {thread?.contact_name?.slice(0, 1) || "?"}
                </div>
              )}
              <div className={cx("hc-bubble them hc-dots")}>
                <span /><span /><span />
              </div>
            </div>
          )}
          {messages.some((m) => m.sender === "user") && (
            <p className="hc-meta">
              {skin === "ios"
                ? receipt === "read" ? "Read" : receipt === "delivered" ? "Delivered" : "Sent"
                : (
                  <>
                    <Checks read={receipt === "read"} delivered={receipt !== "sent"} />
                  </>
                )}
            </p>
          )}
        </div>

        <form
          className="hc-composer flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <button type="button" className="hc-plus" aria-label="Attach" onClick={() => setPlusOpen((v) => !v)}>+</button>
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={`Reply to ${thread?.contact_name || "them"}…`}
            className="hc-input resize-none max-h-28"
          />
          <button type="submit" className="hc-send" disabled={busy || !draft.trim()} aria-label="Send">
            <FlameMark className="w-4 h-5" />
          </button>
        </form>
        {note ? <p className="hc-quiet">{note}</p> : null}
        {plusOpen ? (
          <div className="hc-sheet">
            <button type="button" onClick={() => { plusIntent.current = "pick"; camRef.current?.click(); }}>Camera</button>
            <button type="button" onClick={() => { plusIntent.current = "pick"; libRef.current?.click(); }}>Photo library</button>
            <button type="button" onClick={() => {
              if (pendingRef.current) applyMyFace(pendingRef.current);
              else { plusIntent.current = "mine"; libRef.current?.click(); }
            }}>Use as my face</button>
            <button type="button" onClick={() => {
              if (pendingRef.current) sendChatPhoto(pendingRef.current);
              else { plusIntent.current = "chat"; libRef.current?.click(); }
            }}>Send in chat</button>
            <button type="button" onClick={removeMyFace}>Remove my face</button>
          </div>
        ) : null}
        <input
          ref={camRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            if (plusIntent.current === "mine") applyMyFace(f);
            else if (plusIntent.current === "chat") sendChatPhoto(f);
            else pendingRef.current = f;
          }}
        />
        <input
          ref={libRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            if (plusIntent.current === "chat") sendChatPhoto(f);
            else if (plusIntent.current === "mine") applyMyFace(f);
            else pendingRef.current = f;
          }}
        />

        {press && (
          <div className="hc-press" style={{ left: Math.min(press.x, 220), top: Math.min(press.y, 420) }}>
            <button type="button" className="block w-full text-left px-3 py-2.5 text-sm" onClick={() => { navigator.clipboard.writeText(press.msg.body || ""); setPress(null); }}>Copy</button>
            <button type="button" className="block w-full text-left px-3 py-2.5 text-sm" onClick={() => { saveLine(press.msg.body || ""); setPress(null); }}>Save line</button>
            <button type="button" className="block w-full text-left px-3 py-2.5 text-sm" onClick={() => { reportLine(press.msg); setPress(null); }}>Report</button>
          </div>
        )}
      </div>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function applyPreview(
  kind: string,
  set: {
    setScreen: (s: Screen) => void;
    setThread: (t: HeatThread | null) => void;
    setMessages: (m: HeatMessage[]) => void;
    setTip: (t: HeatTip | null) => void;
    setRail: (v: boolean) => void;
    setRecap: (r: Recap | null) => void;
    setSkin: (s: HeatSkin) => void;
    setTipsByMsg: (t: Record<string, HeatTip>) => void;
    setOpenTipId: (id: string | null) => void;
    setReceipt: (r: "sent" | "delivered" | "read") => void;
  },
) {
  const thread: HeatThread = {
    id: "preview",
    user_id: "preview",
    contact_name: "Maya",
    contact_face_url: null,
    role: "hookup",
    heat: "filthy",
    voice: "mean",
    who_starts: "they",
    skin: "ios",
    mood: "needy",
    user_photo_path: null,
    generate_face: false,
    reward_photo_sent: false,
    peek: true,
    ended: false,
    end_reason: null,
    last_seen_label: "just now",
    recap: null,
    meta: { look: "woman", pronouns: "she", orientation: "bi" },
    they_look: "woman",
    they_pronouns: "she",
    they_orientation: "bi",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const tip: HeatTip = {
    id: "t1",
    thread_id: "preview",
    message_id: "m2",
    tip: "make them wait one more text",
    score: 8,
    rewrite: "good things take the kind of patience that makes you think about it all night",
    mood: "needy",
    created_at: new Date().toISOString(),
  };
  const messages: HeatMessage[] = [
    { id: "m1", thread_id: "preview", user_id: "preview", sender: "them", body: "you went quiet on me", image_url: null, score: null, delivered_at: "", read_at: "", created_at: "" },
    { id: "m2", thread_id: "preview", user_id: "preview", sender: "user", body: "good things take the kind of patience that makes you think about it all night", image_url: null, score: 8, delivered_at: "", read_at: "", created_at: "" },
  ];
  set.setThread(thread);
  set.setMessages(messages);
  set.setTip(tip);
  set.setTipsByMsg({ m2: tip });
  set.setSkin("ios");
  if (kind === "soon") set.setScreen("soon");
  else if (kind === "start") set.setScreen("start");
  else if (kind === "recap") {
    set.setRecap({
      heat: 8.4,
      pacing: 8,
      cringe: 2,
      mood_handled: 9,
      best_line: "good things take the kind of patience that makes you think about it all night",
      clean_quote: "Good things take patience.",
    });
    set.setScreen("recap");
  } else {
    set.setRail(kind === "tip");
    set.setOpenTipId(kind === "tip" ? "m2" : null);
    set.setReceipt("read");
    set.setScreen("chat");
  }
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="hc-root relative min-h-[calc(100vh-8rem)]">
      <div className="hc-ember w-72 h-72 -left-16 top-10" />
      <div className="hc-ember w-64 h-64 right-0 bottom-10" style={{ animationDelay: "1.2s" }} />
      <div className="hc-grain" />
      <div className="relative z-[3] max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-20">{children}</div>
    </div>
  );
}

function StartFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] hc-rim hc-start-hero min-h-[64vh] p-8 sm:p-10 flex flex-col justify-end">
      <div className="hc-grain" />
      <div className="relative z-[3]">{children}</div>
    </div>
  );
}

function FlameMark({ className = "w-8 h-10" }: { className?: string }) {
  const raw = useId().replace(/:/g, "");
  const outer = `hcFlameO-${raw}`;
  const mid = `hcFlameM-${raw}`;
  const core = `hcFlameC-${raw}`;
  return (
    <span className={cx("hc-flame", className)} aria-hidden>
      <svg viewBox="0 0 48 64" fill="none">
        <defs>
          <linearGradient id={outer} x1="24" y1="62" x2="24" y2="4">
            <stop offset="0%" stopColor="#7a1230" />
            <stop offset="42%" stopColor="#e23a1f" />
            <stop offset="78%" stopColor="#ff8a2a" />
            <stop offset="100%" stopColor="#ffd36a" />
          </linearGradient>
          <linearGradient id={mid} x1="24" y1="58" x2="24" y2="16">
            <stop offset="0%" stopColor="#ff5a1a" />
            <stop offset="60%" stopColor="#ffb040" />
            <stop offset="100%" stopColor="#ffe28a" />
          </linearGradient>
          <linearGradient id={core} x1="24" y1="54" x2="24" y2="28">
            <stop offset="0%" stopColor="#fff3c4" />
            <stop offset="100%" stopColor="#ffe27a" />
          </linearGradient>
        </defs>
        <path
          className="hc-flame-outer"
          fill={`url(#${outer})`}
          d="M24 62c-11.4 0-18-9.6-18-20.8 0-6.2 2.4-11.4 5.6-16.2-1.6-1.8-2.2-5.4.6-7.2 2.2 4.4 4.4 6.8 5.2 6.2-1.4-8.2 2.6-16.4 6.6-22.2 1.6 5.6 2.2 10.2 1.2 14.4 3.8-5.8 9.6-8.6 11.4-6.2-2.6 4.8-3.2 8.2-1.8 11.2 5.2-1.4 8.8 2.6 8.2 7.2 4.4 4.6 7 10.2 7 16.8C49 52.4 37.8 62 24 62z"
        />
        <path
          className="hc-flame-mid"
          fill={`url(#${mid})`}
          d="M24 56c-7.4 0-11.6-6.2-11.6-13.4 0-4.2 1.6-7.6 3.8-10.6-.4-2.2.8-4.2 2.4-4.4-.2 3.4 1.4 5.6 2.6 6.2.2-5.2 2.6-9.8 5-13.6.6 3.6.4 6.6-.2 8.8 2.2-3.2 5.4-4.8 6.4-3.4-1.2 2.8-1.2 4.8-.2 6.6 2.8-.4 4.8 1.8 4.6 4.4 2.6 2.8 4 6 4 9.6C40.8 49.8 33.4 56 24 56z"
        />
        <path
          className="hc-flame-core"
          fill={`url(#${core})`}
          d="M24 50c-3.6 0-5.6-3.2-5.6-6.8 0-2.4 1-4.2 2.2-5.6.6 1.8 1.6 2.8 2.4 3 .2-2.6 1.2-4.8 2.4-6.6.2 1.8 0 3.2-.2 4.2 1.2-1.4 2.6-2 3.2-1.2-.4 1.4-.2 2.4.4 3.2 1.4 0 2.4 1.2 2.2 2.6 1.2 1.4 1.8 2.8 1.8 4.4C32.8 47.2 28.6 50 24 50z"
        />
      </svg>
    </span>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="hc-kicker mb-2 block">{label}</span>
      <select className="hc-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Stat({ n, l, invert }: { n: number; l: string; invert?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <p className="text-[10px] uppercase tracking-[0.18em] text-[#c4a59a]">{l}</p>
      <p className={cx("text-3xl font-[family-name:var(--font-hc-serif)] mt-1", invert && n >= 6 && "text-rose-300")}>{n}</p>
    </div>
  );
}

function Checks({ delivered, read }: { delivered: boolean; read: boolean }) {
  const c = read ? "#ffb199" : delivered ? "#9a7f76" : "#5a4a46";
  return (
    <span className="hc-checks" aria-hidden>
      <svg width="14" height="10" viewBox="0 0 14 10"><path d="M1 5l3 3 6-7" fill="none" stroke={c} strokeWidth="1.6" /></svg>
      {delivered && <svg width="14" height="10" viewBox="0 0 14 10"><path d="M1 5l3 3 6-7" fill="none" stroke={c} strokeWidth="1.6" /></svg>}
    </span>
  );
}

function Bubble({
  msg,
  skin,
  faceUrl,
  name,
  meFaceUrl,
  meInitial,
  onPress,
}: {
  msg: HeatMessage;
  skin: HeatSkin;
  faceUrl?: string | null;
  name?: string;
  meFaceUrl?: string | null;
  meInitial?: string;
  onPress: (e: React.MouseEvent | React.TouchEvent) => void;
}) {
  const theirAvatar = (
    faceUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={faceUrl} alt="" className="hc-face hc-face-sm self-end" />
    ) : (
      <div className="hc-face hc-face-sm grid place-items-center text-[10px] text-[#c4a59a] self-end">
        {(name || "?").slice(0, 1)}
      </div>
    )
  );
  const myAvatar = meFaceUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={meFaceUrl} alt="" className="hc-face hc-face-sm self-end" />
  ) : (
    <div className="hc-face hc-face-sm grid place-items-center text-[10px] text-[#c4a59a] self-end">
      {(meInitial || "U").slice(0, 1)}
    </div>
  );
  if (msg.sender === "photo" && msg.image_url) {
    return (
      <div className="hc-row them">
        {theirAvatar}
        <div className="hc-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={msg.image_url} alt="" />
        </div>
      </div>
    );
  }
  const mine = msg.sender === "user";
  return (
    <div className={cx("hc-row", mine ? "me" : "them")}>
      {!mine ? theirAvatar : null}
      <div className="hc-bubble-wrap">
        {msg.image_url ? (
          <div className={cx("hc-photo", mine && "me")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={msg.image_url} alt="" />
          </div>
        ) : null}
        {msg.body && msg.body !== "(sent a photo)" ? (
          <button
            type="button"
            className={cx("hc-bubble", mine ? "me" : "them")}
            onContextMenu={onPress}
            onTouchStart={(e) => {
              const t = window.setTimeout(() => onPress(e), 480);
              const clear = () => window.clearTimeout(t);
              e.currentTarget.addEventListener("touchend", clear, { once: true });
              e.currentTarget.addEventListener("touchmove", clear, { once: true });
            }}
          >
            {msg.body}
            <span className="tail" aria-hidden />
          </button>
        ) : null}
        {mine ? (
          <p className="hc-stamp">
            {msg.created_at
              ? new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
              : "11:47 PM"}
          </p>
        ) : null}
      </div>
      {mine ? myAvatar : null}
    </div>
  );
}
