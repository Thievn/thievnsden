"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/admin";
import {
  HEAT_LEVELS,
  HEAT_ROLES,
  HEAT_SKINS,
  HEAT_VOICES,
  type HeatLevel,
  type HeatOpt,
  type HeatRole,
  type HeatSkin,
  type HeatVoice,
} from "@/lib/heat-check";
import "@/app/playground/heat-check/heat-check.css";

const LOGIN = "/login?next=/playground/heat-check";
const JOIN = "/join?next=/playground/heat-check";

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type Msg = { id: string; role: string; body: string | null; image_url?: string | null; created_at?: string };
type Tip = { message_id: string; score: number; tip: string; rewrite: string | null };
type Thread = {
  id: string;
  skin: HeatSkin;
  role: string;
  heat: string;
  voice: string;
  they_start: boolean;
  contact_name: string;
  contact_face_url: string | null;
  user_photo_url: string | null;
  mood: string;
  status: string;
  peek: boolean;
  recap?: { heat: string; pacing: string; cringe: string; mood: string; best_line: string } | null;
};

export function HeatCheckApp() {
  const search = useSearchParams();
  const resumeId = search.get("id");
  const [userId, setUserId] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [play, setPlay] = useState(false);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<"start" | "chat" | "recap">("start");
  const [roles, setRoles] = useState<HeatOpt[]>([...HEAT_ROLES]);
  const [heats, setHeats] = useState<HeatOpt[]>([...HEAT_LEVELS]);
  const [voices, setVoices] = useState<HeatOpt[]>([...HEAT_VOICES]);
  const [role, setRole] = useState<HeatRole>("hookup");
  const [heat, setHeat] = useState<HeatLevel>("tease");
  const [voice, setVoice] = useState<HeatVoice>("dry");
  const [theyStart, setTheyStart] = useState(true);
  const [skin, setSkin] = useState<HeatSkin>("ios");
  const [wantFace, setWantFace] = useState(false);
  const [myPhoto, setMyPhoto] = useState<string | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [tips, setTips] = useState<Tip[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [tipPulse, setTipPulse] = useState(false);
  const [typing, setTyping] = useState(false);
  const [receipt, setReceipt] = useState<"none" | "delivered" | "read">("none");
  const [unread, setUnread] = useState(false);
  const [menu, setMenu] = useState(false);
  const [hold, setHold] = useState<Msg | null>(null);
  const [msg, setMsg] = useState("");
  const [recap, setRecap] = useState<Thread["recap"]>(null);
  const [kb, setKb] = useState(0);
  const [clock, setClock] = useState("9:41");
  const scrollRef = useRef<HTMLDivElement>(null);
  const loggedCanva = useRef(false);
  const pressTimer = useRef<number | null>(null);

  const latestTip = useMemo(() => tips[tips.length - 1] || null, [tips]);
  const peekOn = thread?.peek !== false;

  useEffect(() => {
    if (!loggedCanva.current) {
      loggedCanva.current = true;
      console.log("Canva skipped, CSS fallback");
    }
    const now = new Date();
    setClock(`${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, "0")}`);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user || null;
      setUserId(user?.id || null);
      setAdmin(isAdmin(user));
      if (user) {
        const res = await fetch("/api/heat-check/thread", { headers: await authHeaders() });
        const data = await res.json();
        setPlay(!!data.play);
        if (data.catalog?.roles?.length) setRoles(data.catalog.roles);
        if (data.catalog?.heats?.length) setHeats(data.catalog.heats);
        if (data.catalog?.voices?.length) setVoices(data.catalog.voices);
        const saved = localStorage.getItem("heat-skin");
        if (saved === "ios" || saved === "android") setSkin(saved);
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!resumeId || !userId) return;
    void (async () => {
      const res = await fetch(`/api/heat-check/turn?id=${encodeURIComponent(resumeId)}`, { headers: await authHeaders() });
      const data = await res.json();
      if (!data.thread) return;
      setThread(data.thread);
      setMessages(data.messages || []);
      setTips(data.tips || []);
      setSkin(data.thread.skin);
      if (data.thread.status === "recap" && data.thread.recap) {
        setRecap(data.thread.recap);
        setPhase("recap");
      } else {
        setPhase("chat");
      }
    })();
  }, [resumeId, userId]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKb(gap);
    };
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, kb]);

  const pulseTip = () => {
    setTipPulse(true);
    window.setTimeout(() => setTipPulse(false), 1400);
  };

  const openThread = async () => {
    if (!play) return;
    setBusy(true);
    setMsg("");
    try {
      let face: string | null = null;
      if (wantFace) {
        const f = await fetch("/api/heat-check/face", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(await authHeaders()) },
          body: JSON.stringify({ voice }),
        });
        const fd = await f.json();
        if (f.ok) face = fd.url;
      }
      const res = await fetch("/api/heat-check/thread", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({
          role,
          heat,
          voice,
          they_start: theyStart,
          skin,
          contact_face_url: face,
          user_photo_url: myPhoto,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not open");
      setThread(data.thread);
      const msgs: Msg[] = [];
      if (data.opener?.scene) {
        setTyping(true);
        await wait(700);
        setTyping(false);
        msgs.push({
          id: data.opener.message_id || "opener",
          role: "them",
          body: data.opener.scene,
          created_at: new Date().toISOString(),
        });
        if (data.opener.tip) {
          setTips([{ message_id: data.opener.message_id, score: 0, tip: data.opener.tip, rewrite: data.opener.rewrite }]);
          pulseTip();
        }
      }
      setMessages(msgs);
      setPhase("chat");
      setReceipt("none");
      setUnread(false);
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Could not open");
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !thread || busy) return;
    setDraft("");
    const hadUser = messages.some((m) => m.role === "user");
    const flagged = unread || (hadUser && receipt !== "read" && receipt !== "none");
    const optimistic: Msg = { id: `tmp-${Date.now()}`, role: "user", body: text, created_at: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    setReceipt("delivered");
    setUnread(true);
    setBusy(true);
    try {
      const res = await fetch("/api/heat-check/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ threadId: thread.id, body: text, double_text: flagged }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setMessages((m) => {
        const without = m.filter((x) => x.id !== optimistic.id);
        const next = [...without];
        if (data.userMessage) next.push(data.userMessage);
        return next;
      });
      if (data.turn?.tip) {
        setTips((t) => [
          ...t,
          {
            message_id: data.userMessage?.id,
            score: data.turn.score,
            tip: data.turn.tip,
            rewrite: data.turn.rewrite,
          },
        ]);
        pulseTip();
        if (thread.peek) {
          setTipOpen(true);
          window.setTimeout(() => setTipOpen(false), 2200);
        }
      }
      const delay = Number(data.turn?.read_delay_ms) || 3000;
      const stayDelivered = delay >= 7500;
      if (!stayDelivered) {
        window.setTimeout(() => {
          setReceipt("read");
          setUnread(false);
        }, delay);
      }
      if (data.turn?.scene) {
        setTyping(true);
        await wait(Math.min(1400, 400 + data.turn.scene.length * 12));
        setTyping(false);
        setMessages((m) => [
          ...m,
          data.themMessage || { id: `them-${Date.now()}`, role: "them", body: data.turn.scene, created_at: new Date().toISOString() },
        ]);
      }
      if (data.rewardUrl) {
        setMessages((m) => [...m, { id: `rew-${Date.now()}`, role: "them", body: "", image_url: data.rewardUrl }]);
      }
      if (data.recap) {
        setRecap(data.recap);
        setPhase("recap");
        setThread((t) => (t ? { ...t, status: "recap", recap: data.recap } : t));
      }
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Send failed");
    } finally {
      setBusy(false);
    }
  };

  const switchSkin = async (next: HeatSkin) => {
    setSkin(next);
    localStorage.setItem("heat-skin", next);
    setMenu(false);
    if (thread) {
      await fetch("/api/heat-check/thread", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ id: thread.id, skin: next }),
      });
      setThread({ ...thread, skin: next });
    }
  };

  const uploadMine = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/heat-check/upload", { method: "POST", headers: await authHeaders(), body: form });
    const data = await res.json();
    if (res.ok) setMyPhoto(data.url);
    else setMsg(data.error || "Upload failed");
  };

  const saveLine = async (body: string) => {
    await fetch("/api/heat-check/saves", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ body, threadId: thread?.id }),
    });
    setHold(null);
  };

  const reportLine = async (preview: string) => {
    await fetch("/api/heat-check/report", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ threadId: thread?.id, reason: "line", preview }),
    });
    setHold(null);
  };

  const startPress = (m: Msg) => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(() => setHold(m), 500);
  };
  const endPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
  };

  const stamp = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const shareRecap = async () => {
    const quote = recap?.best_line || "They’ll read it twice.";
    const text = `Heat Check · ${quote}`;
    try {
      if (navigator.share) await navigator.share({ title: "Heat Check", text });
      else await navigator.clipboard.writeText(text);
    } catch {
      await navigator.clipboard.writeText(text);
    }
  };

  if (!ready) {
    return <div className="hc-app px-4 py-24 text-center text-sm text-neutral-500">Opening…</div>;
  }

  if (!userId) {
    return (
      <div className="hc-app max-w-md mx-auto px-4 py-16 text-center">
        <div className="hc-mark mx-auto mb-4" aria-hidden />
        <p className="text-[11px] uppercase tracking-[0.28em] text-rose-300/80 mb-3">Heat Check · 18+</p>
        <h1 className="text-3xl font-semibold text-neutral-50 mb-3">They’ll read it twice.</h1>
        <p className="text-neutral-400 text-sm mb-8">Account required. The thread stays private.</p>
        <div className="flex flex-col gap-2">
          <Link href={LOGIN} className="py-3 rounded-xl bg-gradient-to-b from-red-700 to-purple-900 text-white text-sm">
            Log in
          </Link>
          <Link href={JOIN} className="py-3 rounded-xl border border-neutral-800 text-neutral-400 text-sm">
            Join
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "recap" && recap) {
    return (
      <div className="hc-app max-w-md mx-auto px-4 py-12">
        <p className="text-[11px] uppercase tracking-[0.22em] text-rose-300/80 mb-2">Recap</p>
        <h1 className="text-2xl font-semibold text-neutral-50 mb-6">That’s the tape.</h1>
        <div className="hc-card p-5 space-y-3 text-sm text-neutral-300">
          <p><span className="text-rose-300">Heat.</span> {recap.heat}</p>
          <p><span className="text-rose-300">Pacing.</span> {recap.pacing}</p>
          <p><span className="text-rose-300">Cringe.</span> {recap.cringe}</p>
          <p><span className="text-rose-300">Mood.</span> {recap.mood}</p>
          {recap.best_line ? <p className="text-neutral-100">“{recap.best_line}”</p> : null}
        </div>
        <div className="mt-5 flex flex-col gap-2">
          {recap.best_line ? (
            <button type="button" className="hc-chip on w-full" onClick={() => saveLine(recap.best_line)}>
              Save best line
            </button>
          ) : null}
          <button type="button" className="hc-chip w-full" onClick={shareRecap}>
            Share card
          </button>
          <button
            type="button"
            className="py-3 rounded-xl bg-gradient-to-b from-red-700 to-purple-900 text-white text-sm"
            onClick={() => {
              setPhase("chat");
              setMessages([]);
              setTips([]);
              setRecap(null);
              openThread();
            }}
          >
            Again
          </button>
          <button
            type="button"
            className="py-3 rounded-xl border border-neutral-800 text-neutral-300 text-sm"
            onClick={() => {
              setPhase("start");
              setThread(null);
              setMessages([]);
              setTips([]);
              setRecap(null);
            }}
          >
            New contact
          </button>
        </div>
      </div>
    );
  }

  if (phase === "chat" && thread) {
    const liveSkin = thread.skin || skin;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    return (
      <div className={`hc-thread skin-${liveSkin}`} style={{ ["--hc-kb" as string]: `${kb}px` }}>
        <div className="hc-status">
          <span>{clock}</span>
          <span className="hc-status-pips">{liveSkin === "ios" ? "●●●" : "LTE"}</span>
        </div>
        <div className="hc-header">
          <button type="button" className="text-rose-300 px-1" onClick={() => setPhase("start")}>
            ‹
          </button>
          {thread.contact_face_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thread.contact_face_url} alt="" className="hc-face" />
          ) : (
            <div className="hc-face flex items-center justify-center text-xs text-rose-200">
              {thread.contact_name.slice(0, 1)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-50 truncate">{thread.contact_name}</p>
            <p className="text-[11px] text-neutral-500">{typing ? "typing…" : "last seen just now"}</p>
          </div>
          <button type="button" className="px-2 text-neutral-300" onClick={() => setMenu((v) => !v)}>
            ⋯
          </button>
        </div>
        {menu ? (
          <div className="absolute right-3 top-20 z-30 rounded-xl border border-neutral-800 bg-[#111] p-2 text-sm w-40">
            <button type="button" className="w-full text-left px-2 py-2 text-neutral-200" onClick={() => switchSkin("ios")}>
              iOS
            </button>
            <button type="button" className="w-full text-left px-2 py-2 text-neutral-200" onClick={() => switchSkin("android")}>
              Android
            </button>
            <button
              type="button"
              className="w-full text-left px-2 py-2 text-neutral-200"
              onClick={() => {
                setDraft("FADE");
                setMenu(false);
              }}
            >
              Fade
            </button>
            <button
              type="button"
              className="w-full text-left px-2 py-2 text-neutral-400"
              onClick={() => {
                setPhase("start");
                setThread(null);
                setMenu(false);
              }}
            >
              New contact
            </button>
          </div>
        ) : null}

        {peekOn ? (
          <button type="button" className="hc-tip-handle" onClick={() => setTipOpen((v) => !v)}>
            <span className={`hc-tip-dot ${tipPulse ? "pulse" : ""}`} />
            tip
          </button>
        ) : null}
        {peekOn && tipOpen && latestTip ? (
          <div className="hc-tip-sheet">
            <p className="text-rose-300 text-xs mb-1">Score {latestTip.score}/10</p>
            <p className="text-sm text-neutral-200 mb-3">{latestTip.tip}</p>
            {latestTip.rewrite ? (
              <button
                type="button"
                className="hc-chip on"
                onClick={() => {
                  setDraft(latestTip.rewrite || "");
                  setTipOpen(false);
                }}
              >
                Use this instead
              </button>
            ) : null}
          </div>
        ) : null}

        <div ref={scrollRef} className="hc-scroll">
          {messages.map((m) => (
            <div key={m.id} className={`hc-row ${m.role === "user" ? "me" : "them"}`}>
              {liveSkin === "android" && m.role !== "user" ? <span className="hc-gutter">{stamp(m.created_at)}</span> : null}
              <button
                type="button"
                className={`hc-bubble ${m.role === "user" ? "me" : "them"} text-left`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setHold(m);
                }}
                onPointerDown={() => startPress(m)}
                onPointerUp={endPress}
                onPointerLeave={endPress}
                onPointerCancel={endPress}
              >
                {m.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.image_url} alt="" className="rounded-xl max-w-[220px]" />
                ) : (
                  m.body
                )}
              </button>
              {liveSkin === "android" && m.role === "user" ? <span className="hc-gutter">{stamp(m.created_at)}</span> : null}
            </div>
          ))}
          {typing ? (
            <div className="hc-row them">
              <div className="hc-bubble them hc-typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : null}
          {liveSkin === "ios" && lastUser && receipt !== "none" ? (
            <p className="hc-meta">{receipt === "read" ? "Read" : "Delivered"}</p>
          ) : null}
        </div>

        <div className="hc-composer">
          <textarea
            className="hc-input"
            rows={1}
            value={draft}
            placeholder="Text"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button type="button" className="hc-send" onClick={send} disabled={busy || !draft.trim()}>
            {liveSkin === "android" ? "➤" : "↑"}
          </button>
        </div>

        {hold ? (
          <div className="absolute inset-0 z-40 bg-black/50 flex items-end" onClick={() => setHold(null)}>
            <div className="w-full rounded-t-2xl bg-[#161016] p-4 space-y-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="w-full py-3 text-sm text-neutral-100"
                onClick={() => {
                  navigator.clipboard.writeText(hold.body || "");
                  setHold(null);
                }}
              >
                Copy
              </button>
              <button type="button" className="w-full py-3 text-sm text-neutral-100" onClick={() => saveLine(hold.body || "")}>
                Save line
              </button>
              <button type="button" className="w-full py-3 text-sm text-rose-300" onClick={() => reportLine(hold.body || "")}>
                Report
              </button>
            </div>
          </div>
        ) : null}
        {msg ? <p className="absolute bottom-24 left-0 right-0 text-center text-xs text-rose-300">{msg}</p> : null}
      </div>
    );
  }

  const coming = !play && !admin;

  return (
    <div className="hc-app relative max-w-md mx-auto px-4 py-10">
      <div className="hc-lock mb-6">
        <div className="hc-mark" aria-hidden />
        <p className="text-[11px] uppercase tracking-[0.28em] text-rose-300/80 mb-2">Heat Check · 18+</p>
        <h1 className="text-3xl font-semibold text-neutral-50 mb-1">They’ll read it twice.</h1>
        <p className="text-sm text-neutral-500">A fake thread. Real heat. Private.</p>
      </div>

      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-2">Role</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {roles.map((r) => (
          <button key={r.id} type="button" className={`hc-chip ${role === r.id ? "on" : ""}`} onClick={() => setRole(r.id as HeatRole)}>
            {r.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-2">Heat</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {heats.map((r) => (
          <button key={r.id} type="button" className={`hc-chip ${heat === r.id ? "on" : ""}`} onClick={() => setHeat(r.id as HeatLevel)}>
            {r.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-2">Their voice</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {voices.map((r) => (
          <button key={r.id} type="button" className={`hc-chip ${voice === r.id ? "on" : ""}`} onClick={() => setVoice(r.id as HeatVoice)}>
            {r.label}
          </button>
        ))}
      </div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-2">Who starts</p>
      <div className="flex flex-wrap gap-2 mb-5">
        <button type="button" className={`hc-chip ${theyStart ? "on" : ""}`} onClick={() => setTheyStart(true)}>
          They text first
        </button>
        <button type="button" className={`hc-chip ${!theyStart ? "on" : ""}`} onClick={() => setTheyStart(false)}>
          You open
        </button>
      </div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-2">Skin</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {HEAT_SKINS.map((r) => (
          <button key={r.id} type="button" className={`hc-chip ${skin === r.id ? "on" : ""}`} onClick={() => setSkin(r.id)}>
            {r.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 mb-6">
        <label className="hc-chip flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={wantFace} onChange={(e) => setWantFace(e.target.checked)} />
          Generate their face
        </label>
        <label className="hc-chip flex items-center gap-2 cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadMine(f);
            }}
          />
          {myPhoto ? "Photo attached" : "Upload my photo (optional)"}
        </label>
      </div>
      {msg ? <p className="text-sm text-rose-300 mb-3">{msg}</p> : null}
      <button
        type="button"
        disabled={busy || !play}
        onClick={openThread}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-b from-red-600 via-red-800 to-purple-900 text-white font-medium disabled:opacity-40"
      >
        {busy ? "Opening…" : "Open thread"}
      </button>
      <Link href="/account/heat-check" className="mt-4 block text-center text-xs text-neutral-500">
        Resume threads
      </Link>

      {coming || !play ? (
        <div className="hc-overlay">
          <div className="max-w-xs text-center pointer-events-auto">
            <p className="text-[11px] uppercase tracking-[0.22em] text-rose-300/80 mb-2">Coming soon</p>
            <p className="text-neutral-200 text-sm leading-relaxed">
              Heat Check is in the den. You can look at the setup. The thread isn’t live for everyone yet.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => window.setTimeout(r, ms));
}
