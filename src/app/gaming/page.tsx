export default function GamingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
      <div className="mb-14">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-50 mb-3">
          Gaming
        </h1>
        <p className="text-neutral-500">
          Builds, takes, and the occasional descent into a new game.
        </p>
      </div>

      <div className="space-y-5">
        <div className="card p-7 rounded-2xl border border-neutral-800/80 bg-[#111]">
          <div className="text-xs text-red-500/90 uppercase tracking-wide mb-2.5">
            Current rotation
          </div>
          <h2 className="text-lg font-medium text-neutral-100 mb-2.5">
            Whatever is holding my attention this month
          </h2>
          <p className="text-neutral-500 text-sm leading-relaxed">
            This section will get proper game notes, build links, and the occasional
            “why is this so good / terrible” write-up.
          </p>
        </div>

        <div className="card p-7 rounded-2xl border border-neutral-800/80 bg-[#111]">
          <div className="text-xs text-red-500/90 uppercase tracking-wide mb-2.5">
            PC builds
          </div>
          <h2 className="text-lg font-medium text-neutral-100 mb-2.5">
            Hardware thoughts
          </h2>
          <p className="text-neutral-500 text-sm leading-relaxed">
            Specs, upgrades, cable management opinions, and the parts that actually
            mattered.
          </p>
        </div>
      </div>

      <p className="mt-14 text-center text-sm text-neutral-600">
        Content coming. The skeleton is ready.
      </p>
    </div>
  );
}
