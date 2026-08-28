"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import {
  HEAT_JOIN,
  HEAT_LEVELS,
  HEAT_LOGIN,
  HEAT_ROLES,
  HEAT_VOICES,
  isFadeText,
  type HeatLevel,
  type HeatMessage,
  type HeatRole,
  type HeatSkin,
  type HeatStarter,
  type HeatThread,
  type HeatTip,
  type HeatVoice,
} from "@/lib/heat-check";

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
  const [wantFace, setWantFace] = useState(false);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);

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

  const threadEl = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const peekTimer = useRef<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => {
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
    (async () => {
      const preview = new URLSearchParams(window.location.search).get("preview");
      if (preview === "chat" || preview === "tip" || preview === "recap" || preview === "start" || preview === "soon") {
        applyPreview(preview, { setScreen, setThread, setMessages, setTip, setRail, setRecap, setSkin });
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        setScreen("gate");
        return;
      }
      const res = await fetch("/api/heat-check/access", { headers: await authHeaders() });
      const json = await res.json();
      setPeekDefault(json.peekDefault !== false);
      setFaceGenOn(json.faceGen !== false);
      setSkins(json.skins || { ios: true, android: true });
      if (!json.play) {
        setScreen("soon");
        return;
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
          generate_face: wantFace,
          user_photo_path: photoPath,
          peek: peekDefault,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error === "coming_soon" ? "Still warming up." : data.error || "Could not open.");
      setThread(data.thread);
      setSkin(data.thread.skin);
      const incoming: HeatMessage[] = data.messages || [];
      setMessages([]);
      setPendingThem(incoming);
      setTip(data.tip || null);
      setTipReady(!!data.tip);
      setScreen("chat");
      setReceipt("sent");
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

  const send = async (raw?: string) => {
    const text = (raw ?? draft).trim();
    if (!text || !thread || busy) return;
    setDraft("");
    setBusy(true);
    setReceipt("delivered");
    const optimistic: HeatMessage = {
      id: `local-${Date.now()}`,
      thread_id: thread.id,
      user_id: thread.user_id,
      sender: "user",
      body: text,
      image_url: null,
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
        body: JSON.stringify({ threadId: thread.id, text, fade: isFadeText(text) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setMessages((m) => m.map((x) => (x.id === optimistic.id ? data.userMessage : x)));
      setTip(data.tip || null);
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
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const uploadMine = async (file: File) => {
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch("/api/heat-check/upload", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setPhotoPath(data.path);
      setPhotoName(file.name);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
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
        <img src="/heat-check/ember-mark.png" alt="" className="w-16 h-16 opacity-90" />
      </div>
    );
  }

  if (screen === "gate") {
    return (
      <Shell>
        <StartFrame>
          <p className="hc-kicker mb-4">18+ · members</p>
          <h1 className="hc-title text-5xl sm:text-6xl mb-4">Heat Check</h1>
          <p className="text-[#d9c4bb] text-lg mb-8 max-w-[20ch]">They&apos;ll read it twice. You need a key.</p>
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
          <img src="/heat-check/ember-mark.png" alt="" className="w-12 h-12 mb-6" />
          <p className="hc-kicker mb-3">Private hours</p>
          <h1 className="hc-title text-5xl sm:text-6xl mb-3">Heat Check</h1>
          <p className="text-[#e8d2c8] text-lg max-w-[22ch] mb-2">They&apos;ll read it twice.</p>
          <p className="text-sm text-[#b89a90] max-w-[34ch] leading-relaxed">
            A late-night thread is warming. When it opens, it won&apos;t look like a default inbox.
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
          <div className="relative z-[3] p-6 sm:p-8 pb-4">
            <Link href="/playground" className="text-xs text-[#b89a90] hover:text-white">← Playground</Link>
            <div className="mt-6 flex items-center gap-3">
              <img src="/heat-check/ember-mark.png" alt="" className="w-9 h-9" />
              <div>
                <p className="hc-kicker">Trainer · 18+</p>
                <h1 className="hc-title text-4xl sm:text-5xl mt-1">Heat Check</h1>
              </div>
            </div>
            <p className="mt-3 text-[#e4cfc6] text-[15px]">They&apos;ll read it twice.</p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <Field label="Role">
            {HEAT_ROLES.map((o) => (
              <button key={o.id} type="button" className="hc-chip" aria-pressed={role === o.id} onClick={() => setRole(o.id as HeatRole)}>
                {o.label}
              </button>
            ))}
          </Field>
          <Field label="Heat">
            {HEAT_LEVELS.map((o) => (
              <button key={o.id} type="button" className="hc-chip" aria-pressed={heat === o.id} onClick={() => setHeat(o.id as HeatLevel)}>
                {o.label}
              </button>
            ))}
          </Field>
          <Field label="Voice">
            {HEAT_VOICES.map((o) => (
              <button key={o.id} type="button" className="hc-chip" aria-pressed={voice === o.id} onClick={() => setVoice(o.id as HeatVoice)}>
                {o.label}
              </button>
            ))}
          </Field>
          <Field label="Who starts">
            <button type="button" className={cx("hc-chip", who === "they" && "is-on")} aria-pressed={who === "they"} onClick={() => setWho("they")}>
              They text first
            </button>
            <button type="button" className="hc-chip" aria-pressed={who === "you"} onClick={() => setWho("you")}>
              You open
            </button>
          </Field>
          <Field label="Skin">
            {skins.ios && (
              <button type="button" className="hc-chip" aria-pressed={skin === "ios"} onClick={() => setSkin("ios")}>
                iOS language
              </button>
            )}
            {skins.android && (
              <button type="button" className="hc-chip" aria-pressed={skin === "android"} onClick={() => setSkin("android")}>
                Android language
              </button>
            )}
          </Field>
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>Generate their face</span>
              <input type="checkbox" checked={wantFace && faceGenOn} disabled={!faceGenOn} onChange={(e) => setWantFace(e.target.checked)} />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>My photo · private</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="max-w-[10rem] text-[11px] text-[#b89a90]"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadMine(f);
                }}
              />
            </label>
            {photoName ? <p className="text-[11px] text-[#9a7f76]">Kept · {photoName}</p> : null}
          </div>
          {err ? <p className="text-sm text-rose-300">{err}</p> : null}
          <button type="button" className="hc-cta" disabled={busy} onClick={openThread}>
            {busy ? "Opening…" : "Open thread"}
          </button>
          <p className="text-center text-[11px] text-[#7a6862]">Type FADE later if you want the night to end.</p>
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
            <img src="/heat-check/ember-mark.png" alt="" className="w-10 h-10 mb-5" />
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
    <div className="hc-root hc-phone-wrap fixed inset-0 z-[70]">
      <div className="hc-phone hc-rim" data-skin={skin}>
        <div className="hc-ember w-40 h-40 right-0 top-0 opacity-70" />
        <div className="hc-grain" />
        <header className="hc-header">
          <button type="button" className="text-[#d9c4bb] text-lg px-1" onClick={() => setScreen("start")} aria-label="Back">
            ‹
          </button>
          {thread?.contact_face_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thread.contact_face_url} alt="" className="hc-face" />
          ) : (
            <div className="hc-face grid place-items-center text-[11px] text-[#c4a59a]">
              {thread?.contact_name?.slice(0, 1) || "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium truncate">{thread?.contact_name}</p>
            <p className="text-[11px] text-[#9a7f76] truncate">{thread?.last_seen_label || "Active now"}</p>
          </div>
          <div className="relative">
            <button type="button" className="px-2 text-lg tracking-widest" onClick={() => setMenu((v) => !v)} aria-label="More">
              ⋯
            </button>
            {menu && (
              <div className="hc-menu">
                <button type="button" onClick={() => switchSkin(skin === "ios" ? "android" : "ios")}>
                  {skin === "ios" ? "Android language" : "iOS language"}
                </button>
                <button type="button" onClick={fadeOut}>Fade</button>
                <button type="button" onClick={() => { setMenu(false); setThread(null); setMessages([]); setScreen("start"); }}>
                  New contact
                </button>
              </div>
            )}
          </div>
        </header>

        <button
          type="button"
          className={cx("hc-tip-handle", tipReady && "hc-pulse")}
          onClick={() => { setRail((v) => !v); setTipReady(false); }}
          aria-label="Tip"
        >
          <img src="/heat-check/ember-mark.png" alt="" />
        </button>
        <div className={cx("hc-rail", rail ? "open" : "shut")}>
          <div className="hc-rail-inner">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-[family-name:var(--font-hc-serif)] text-[#ffb199]">{tip?.score ?? "—"}</span>
              <p className="text-sm text-[#f0e6e1] leading-snug">{tip?.tip || "Send something. The night grades in private."}</p>
            </div>
            {tip?.rewrite ? (
              <p className="mt-2 text-[13px] text-[#ffc7b0]">
                <span className="uppercase tracking-[0.16em] text-[10px] text-[#c4a59a] mr-2">Use this instead</span>
                {tip.rewrite}
              </p>
            ) : null}
          </div>
        </div>

        <div ref={threadEl} className="hc-thread" onClick={() => setPress(null)}>
          {messages.map((msg) => (
            <Bubble
              key={msg.id}
              msg={msg}
              skin={skin}
              onPress={(e) => {
                e.preventDefault();
                const point = "clientX" in e ? e : e.touches?.[0];
                setPress({ x: point?.clientX || 80, y: point?.clientY || 120, msg });
              }}
            />
          ))}
          {typing && (
            <div className="hc-row them">
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
            placeholder={skin === "ios" ? "iMessage" : "Message"}
            className="hc-input resize-none max-h-28"
          />
          <button type="submit" className="hc-send" disabled={busy || !draft.trim()} aria-label="Send">
            {skin === "android" ? "➤" : "↑"}
          </button>
        </form>

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
  },
) {
  const thread: HeatThread = {
    id: "preview",
    user_id: "preview",
    contact_name: "Mara",
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
    last_seen_label: "Active 9m ago",
    recap: null,
    meta: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const tip: HeatTip = {
    id: "t1",
    thread_id: "preview",
    message_id: "m2",
    tip: "She's already warmer. Don't stack a second text before she reads.",
    score: 8,
    rewrite: "tell me what you'd do if I was already in the doorway.",
    mood: "needy",
    created_at: new Date().toISOString(),
  };
  const messages: HeatMessage[] = [
    { id: "m1", thread_id: "preview", user_id: "preview", sender: "them", body: "you still up?", image_url: null, score: null, delivered_at: "", read_at: "", created_at: "" },
    { id: "m2", thread_id: "preview", user_id: "preview", sender: "user", body: "yeah. don't hang up the night yet.", image_url: null, score: 8, delivered_at: "", read_at: "", created_at: "" },
    { id: "m3", thread_id: "preview", user_id: "preview", sender: "them", body: "then say it like you mean it.", image_url: null, score: null, delivered_at: "", read_at: "", created_at: "" },
  ];
  set.setThread(thread);
  set.setMessages(messages);
  set.setTip(tip);
  set.setSkin("ios");
  if (kind === "soon") set.setScreen("soon");
  else if (kind === "start") set.setScreen("start");
  else if (kind === "recap") {
    set.setRecap({
      heat: 8.4,
      pacing: 8,
      cringe: 2,
      mood_handled: 9,
      best_line: "yeah. don't hang up the night yet.",
      clean_quote: "Don't hang up the night yet.",
    });
    set.setScreen("recap");
  } else {
    set.setRail(kind === "tip");
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="hc-kicker mb-2.5">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
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
  onPress,
}: {
  msg: HeatMessage;
  skin: HeatSkin;
  onPress: (e: React.MouseEvent | React.TouchEvent) => void;
}) {
  if (msg.sender === "photo" && msg.image_url) {
    return (
      <div className="hc-row them">
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
    </div>
  );
}
