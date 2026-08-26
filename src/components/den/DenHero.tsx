import type { ReactNode } from "react";

const TONES = {
  rose: "border-rose-900/40 from-[#1a080f] via-[#0c0709] to-[#090509]",
  violet: "border-violet-900/40 from-[#12081c] via-[#0b0712] to-[#090509]",
  fuchsia: "border-fuchsia-900/40 from-[#180814] via-[#0d0710] to-[#090509]",
  amber: "border-amber-900/40 from-[#161008] via-[#0e0b07] to-[#090509]",
  red: "border-red-900/40 from-[#180808] via-[#0e0707] to-[#090509]",
};

export function DenHero({
  kicker,
  title,
  accent,
  body,
  actions,
  visual,
  tone = "rose",
}: {
  kicker: string;
  title: string;
  accent?: string;
  body: string;
  actions?: ReactNode;
  visual?: ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <section className="pt-8 sm:pt-10 pb-8 sm:pb-10">
      <div className={`relative overflow-hidden rounded-[2rem] border bg-gradient-to-br ${TONES[tone]} den-panel`}>
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-rose-400/60 to-transparent" />
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-9 lg:p-10 items-center">
          <div className={visual ? "lg:col-span-7" : "lg:col-span-12"}>
            <p className="text-[11px] uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-purple-400 mb-3 font-medium">
              {kicker}
            </p>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-neutral-50 leading-[1.02] mb-4">
              {title}
              {accent ? (
                <>
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-rose-100 to-purple-300">
                    {accent}
                  </span>
                </>
              ) : null}
            </h1>
            <p className="max-w-xl text-neutral-400 text-sm sm:text-base leading-relaxed">{body}</p>
            {actions ? <div className="mt-7 flex flex-col sm:flex-row gap-3">{actions}</div> : null}
          </div>
          {visual ? <div className="lg:col-span-5">{visual}</div> : null}
        </div>
      </div>
    </section>
  );
}
