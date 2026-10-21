export function Seal() {
  return (
    <h1 className="seal">
      <svg className="seal-wax" viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <radialGradient id="wax-body" cx="36%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#9c2a3b" />
            <stop offset="48%" stopColor="#8E1F2F" />
            <stop offset="100%" stopColor="#3f0e16" />
          </radialGradient>
        </defs>
        <path
          fill="url(#wax-body)"
          d="M99 10c14 2 24 1 34 8 11 8 16 7 26 14 12 9 22 12 28 24 6 12 8 20 7 33-1 14 4 24-1 36-6 14-8 24-16 34-10 12-16 24-30 31-13 6-22 6-35 7-14 1-24 6-38 2-15-5-22-14-32-26-9-12-16-20-19-34-3-13-8-24-6-38 2-15 8-22 16-32 8-10 12-18 22-26 11-8 20-12 32-16 6-2 8-8 12-17z"
        />
        <path
          fill="none"
          stroke="#D4A24C"
          strokeOpacity="0.72"
          strokeWidth="1.25"
          d="M100 28c16 3 28 8 38 18 10 10 16 18 18 32 2 15-2 26-8 38-7 13-12 24-24 32-12 8-24 10-38 10s-26-3-38-12c-12-9-18-20-24-34-5-13-8-26-4-40 4-13 12-22 22-30 11-9 22-14 36-16 8-1 15-1 22 2z"
        />
        <ellipse className="wax-glint" cx="78" cy="62" rx="28" ry="16" fill="#F2E6C9" opacity="0.16" />
      </svg>
      <span className="seal-type">
        <svg className="seal-key" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="9" r="3.2" fill="none" stroke="#D4A24C" strokeWidth="1.4" />
          <path d="M11.6 11.2 L19 18.2 M16.2 16.6 L18.4 14.8 M14.6 18.2 L16.6 16.6" fill="none" stroke="#D4A24C" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span className="seal-line">Thievn&apos;s</span>
        <span className="seal-rule" />
        <span className="seal-line seal-line-den">Den</span>
      </span>
    </h1>
  );
}
