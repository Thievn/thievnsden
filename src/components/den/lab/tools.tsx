"use client";

import { useEffect, useRef, useState } from "react";

export function Compare({ before, after }: { before?: string; after: string }) {
  const [x, setX] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  function move(event: React.PointerEvent) {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    setX(Math.max(0, Math.min(100, ((event.clientX - box.left) / box.width) * 100)));
  }
  if (!before || before === after) return <img className="out" src={after} alt="Current" />;
  return (
    <div
      className="cmp"
      ref={ref}
      onPointerDown={(event) => { drag.current = true; event.currentTarget.setPointerCapture?.(event.pointerId); move(event); }}
      onPointerMove={(event) => drag.current && move(event)}
      onPointerUp={() => { drag.current = false; }}
    >
      <img src={after} alt="After" draggable={false} />
      <div className="cmpb" style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }}><img src={before} alt="Before" draggable={false} /></div>
      <div className="cmpline" style={{ left: `${x}%` }} />
      <span className="cmplab l">Before</span>
      <span className="cmplab r">After</span>
    </div>
  );
}

export function MaskBrush({ src, onDone, onClose }: { src: string; onDone: (mask: string | null) => void; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(48);
  const [nat, setNat] = useState<[number, number] | null>(null);
  const drawing = useRef(false);
  const last = useRef<[number, number] | null>(null);
  useEffect(() => {
    const image = new Image();
    image.onload = () => setNat([image.naturalWidth, image.naturalHeight]);
    image.src = src;
  }, [src]);
  useEffect(() => {
    if (!nat || !canvasRef.current) return;
    canvasRef.current.width = nat[0];
    canvasRef.current.height = nat[1];
  }, [nat]);
  function point(event: React.PointerEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0, 1] as const;
    const box = canvas.getBoundingClientRect();
    return [(event.clientX - box.left) * canvas.width / box.width, (event.clientY - box.top) * canvas.height / box.height, canvas.width / box.width] as const;
  }
  function stroke(event: React.PointerEvent) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const [x, y, scale] = point(event);
    ctx.strokeStyle = "rgba(220,20,60,0.7)";
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = size * scale;
    if (last.current) {
      ctx.beginPath();
      ctx.moveTo(last.current[0], last.current[1]);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, (size * scale) / 2, 0, 7);
      ctx.fill();
    }
    last.current = [x, y];
  }
  function exportMask() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let any = false;
    for (let i = 0; i < data.data.length; i += 4) {
      const on = data.data[i + 3] > 10;
      any = any || on;
      data.data[i] = data.data[i + 1] = data.data[i + 2] = on ? 255 : 0;
      data.data[i + 3] = 255;
    }
    if (!any) return onDone(null);
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    out.getContext("2d")?.putImageData(data, 0, 0);
    onDone(out.toDataURL("image/png"));
  }
  return (
    <div className="sheetwrap" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Paint the area to change" onClick={(event) => event.stopPropagation()}>
        <div className="sheethead"><b>Paint the area to change</b><button type="button" className="icon" onClick={onClose}>Close</button></div>
        <div className="sheetbody">
          <div className="maskwrap">
            <img src={src} alt="" draggable={false} />
            <canvas
              ref={canvasRef}
              style={{ touchAction: "none" }}
              onPointerDown={(event) => { drawing.current = true; last.current = null; event.currentTarget.setPointerCapture?.(event.pointerId); stroke(event); }}
              onPointerMove={(event) => drawing.current && stroke(event)}
              onPointerUp={() => { drawing.current = false; last.current = null; }}
            />
          </div>
          <label className="slider">Brush <b>{size}px</b>
            <input type="range" min="12" max="140" step="4" value={size} onChange={(event) => setSize(Number(event.target.value))} />
          </label>
        </div>
        <div className="sheetfoot row">
          <button type="button" className="btn" onClick={() => { const canvas = canvasRef.current; canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height); }}>Clear</button>
          <button type="button" className="btn" onClick={() => onDone(null)}>No mask</button>
          <button type="button" className="cta grow" onClick={exportMask}>Use mask</button>
        </div>
      </div>
    </div>
  );
}
