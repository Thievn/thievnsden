"use client";

type Sfx = {
  unlock: () => void;
  setMuted: (v: boolean) => void;
  shoot: () => void;
  explode: (big?: boolean) => void;
  pickup: () => void;
  hit: () => void;
  engine: (on: boolean) => void;
};

export function createHighwayAudio(): Sfx {
  let ctx: AudioContext | null = null;
  let muted = false;
  let engineOsc: OscillatorNode | null = null;
  let engineGain: GainNode | null = null;

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

  const noise = (dur: number, vol: number) => {
    const c = ac();
    if (!c || muted) return;
    const n = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    const g = c.createGain();
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 900;
    src.buffer = n;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    src.connect(f);
    f.connect(g);
    g.connect(c.destination);
    src.start();
  };

  return {
    unlock: () => {
      ac();
    },
    setMuted: (v) => {
      muted = v;
      if (v && engineGain && ctx) engineGain.gain.setValueAtTime(0, ctx.currentTime);
    },
    shoot: () => beep(880, 0.07, "square", 0.05, -400),
    explode: (big) => {
      noise(big ? 0.28 : 0.14, big ? 0.18 : 0.1);
      beep(big ? 90 : 140, 0.18, "sawtooth", 0.06, -50);
    },
    pickup: () => {
      beep(520, 0.08, "sine", 0.06, 200);
      beep(780, 0.1, "sine", 0.05, 120);
    },
    hit: () => {
      noise(0.12, 0.12);
      beep(110, 0.16, "square", 0.07, -40);
    },
    engine: (on) => {
      const c = ac();
      if (!c) return;
      if (!on) {
        if (engineOsc) {
          try {
            engineOsc.stop();
          } catch {
            /* already */
          }
        }
        engineOsc = null;
        engineGain = null;
        return;
      }
      if (engineOsc) return;
      engineOsc = c.createOscillator();
      engineGain = c.createGain();
      engineOsc.type = "sawtooth";
      engineOsc.frequency.value = 48;
      engineGain.gain.value = muted ? 0 : 0.018;
      engineOsc.connect(engineGain);
      engineGain.connect(c.destination);
      engineOsc.start();
    },
  };
}
