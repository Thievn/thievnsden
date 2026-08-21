/** Classic flat-bottom keyhole mark for Thievn's Den */
export function DenMark({
  className = "w-5 h-5",
  title = "Thievn's Den",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id="den-key-stroke" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="45%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      {/* Classic keyhole: round head + tapered slot with flat base */}
      <path
        d="M12 2.5c-3.6 0-6.5 2.9-6.5 6.5 0 2.35 1.25 4.4 3.1 5.5L7.2 28.5h9.6l-1.4-14c1.85-1.1 3.1-3.15 3.1-5.5 0-3.6-2.9-6.5-6.5-6.5z"
        stroke="url(#den-key-stroke)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Larger splash variant with optional soft outer ring */
export function DenMarkSplash({ className = "w-16 h-20" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="den-key-splash" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="40%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5c-3.6 0-6.5 2.9-6.5 6.5 0 2.35 1.25 4.4 3.1 5.5L7.2 28.5h9.6l-1.4-14c1.85-1.1 3.1-3.15 3.1-5.5 0-3.6-2.9-6.5-6.5-6.5z"
        stroke="url(#den-key-splash)"
        strokeWidth="2.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
