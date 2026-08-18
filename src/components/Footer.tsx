import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-neutral-900/80 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
              <p className="text-neutral-100 font-medium tracking-tight">Thievn&apos;s Den</p>
            </div>
            <p className="text-sm text-neutral-500">
              Dark thoughts • Cynical humor • AI art
            </p>
          </div>

          <div className="flex flex-wrap gap-x-7 gap-y-2 text-sm text-neutral-500">
            <Link href="/about" className="hover:text-neutral-300 transition-colors duration-200">
              About
            </Link>
            <Link href="/join" className="hover:text-neutral-300 transition-colors duration-200">
              Join
            </Link>
            <a
              href="https://x.com/Thievn"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-300 transition-colors duration-200"
            >
              X / @Thievn
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-neutral-900/80 text-xs text-neutral-600 flex flex-col sm:flex-row justify-between gap-3">
          <p>© {new Date().getFullYear()} Thievn&apos;s Den</p>
          <p className="text-neutral-600">
            Some links may be affiliate links. Commission earned at no extra cost to you.
          </p>
        </div>
      </div>
    </footer>
  );
}
