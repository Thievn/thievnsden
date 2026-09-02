"use client";

type Sfx = {
  unlock: () => void;
  setMuted: (v: boolean) => void;
  grab: () => void;
  ember: () => void;
  extract: () => void;
  clocked: () => void;
  ten: () => void;
  noise: () => void;
};

export function createNightGrabAudio(): Sfx {
  let ctx: AudioContext | null = null;
  let muted = false;

  const ac = () => {
    if (typeof window === "undefined") return null;
    if (!ctx) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  };

  const beep = (freq: number, dur: number, type: OscillatorType, vol: number, slide = 0) => {
    const c = ac();
    if (!c || muted) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + dur + 0.02);
  };

  return {
    unlock: () => {
      ac();
    },
    setMuted: (v) => {
      muted = v;
    },
    grab: () => beep(640, 0.07, "sine", 0.05, 180),
    ember: () => {
      beep(220, 0.16, "square", 0.05, 80);
      beep(880, 0.1, "triangle", 0.04, -200);
    },
    extract: () => {
      beep(420, 0.1, "sine", 0.05, 260);
      beep(680, 0.12, "triangle", 0.04, 120);
    },
    clocked: () => beep(140, 0.18, "sawtooth", 0.07, -60),
    ten: () => beep(980, 0.09, "square", 0.045, -120),
    noise: () => beep(180, 0.08, "square", 0.04, 40),
  };
}
