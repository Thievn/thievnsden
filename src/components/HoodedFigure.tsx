export function HoodedFigure() {
  return (
    <div className="figure" aria-hidden="true">
      <svg viewBox="0 0 420 760" role="img">
        <title>Illustration</title>
        <defs>
          <linearGradient id="cloak" x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0%" stopColor="#4a5368" />
            <stop offset="28%" stopColor="#2a3142" />
            <stop offset="100%" stopColor="#12151c" />
          </linearGradient>
          <linearGradient id="rim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F2E6C9" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#D4A24C" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#D4A24C" stopOpacity="0" />
          </linearGradient>
        </defs>
        <ellipse cx="214" cy="718" rx="120" ry="18" fill="#000" opacity="0.5" />
        <path
          fill="url(#cloak)"
          d="M208 58c34 2 62 28 66 64 3 26-10 42-4 64 28 18 62 48 78 96 28 78 36 170 24 268-10 86-28 150-58 196H96c-28-48-46-116-40-204 6-96 28-186 62-258 16-34 8-58 2-82-8-34 18-78 52-86 12-4 24-4 36 2z"
        />
        <path fill="#1a2030" d="M156 118c22-36 70-48 104-22 10 8 16 22 8 36-18 8-46 4-70 12-22 8-40 2-42-26z" />
        <path fill="#07080d" d="M186 112c22-2 40 16 38 40-2 22-18 36-40 36-20-2-34-18-32-38 2-20 14-36 34-38z" />
        <path fill="none" stroke="url(#rim)" strokeWidth="2.4" strokeLinecap="round" d="M168 132c-6 36-22 70-48 112-30 48-46 120-40 210" />
        <path fill="none" stroke="#F2E6C9" strokeOpacity="0.16" strokeWidth="1.5" d="M250 210c16 80 8 170-8 260-8 48-4 110 16 180" />
        <path fill="none" stroke="#3E7C6B" strokeWidth="3" strokeLinecap="round" d="M118 692c46 18 96 20 168 4" />
      </svg>
    </div>
  );
}
