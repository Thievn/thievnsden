import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-neutral-900 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-neutral-100 font-medium">Thievn&apos;s Den</p>
            <p className="text-sm text-neutral-500 mt-1">
              Dark thoughts • Cynical humor • AI art
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500">
            <Link href="/about" className="hover:text-neutral-300 transition-colors">
              About
            </Link>
            <Link href="/join" className="hover:text-neutral-300 transition-colors">
              Join
            </Link>
            <a
              href="https://x.com/Thievn"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-300 transition-colors"
            >
              X / Twitter
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-900 text-xs text-neutral-600 flex flex-col sm:flex-row justify-between gap-2">
          <p>© {new Date().getFullYear()} Thievn&apos;s Den. All rights reserved.</p>
          <p>
            Some links may be affiliate links. I may earn a commission at no extra cost to you.
          </p>
        </div>
      </div>
    </footer>
  );
}
