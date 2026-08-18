export default function JoinPage() {
  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold text-neutral-100 mb-3">
          Join the Den
        </h1>
        <p className="text-neutral-400 text-sm">
          Optional. Everything is free to browse right now.
          Accounts will unlock a few extras later if you want them.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-6 space-y-5">
        <div>
          <label className="block text-sm text-neutral-400 mb-1.5">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
            disabled
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400 mb-1.5">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full px-4 py-2.5 rounded-xl bg-[#0a0a0a] border border-neutral-800 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
            disabled
          />
        </div>

        <button
          disabled
          className="w-full py-3 rounded-xl bg-neutral-800 text-neutral-500 font-medium cursor-not-allowed"
        >
          Coming soon
        </button>

        <p className="text-xs text-neutral-600 text-center">
          Auth is not live yet. This page is just the placeholder so the structure is ready.
        </p>
      </div>
    </div>
  );
}
