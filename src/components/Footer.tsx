import Link from "next/link";
import { DenMark } from "@/components/DenMark";

export function Footer() {
  return (
    <footer className="border-t border-neutral-900/80 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <DenMark className="w-[22px] h-[12px] shrink-0" />
              <p className="text-neutral-100 font-medium tracking-tight text-sm sm:text-base">Thievn's Den</p>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500">
              Dark thoughts • Cynical humor • AI art
            </p>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-500">
            <Link href="/afterimage" className="hover:text-neutral-300 transition-colors">
              Afterimage
            </Link>
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
              X / @Thievn
            </a>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-neutral-900/80 text-xs text-neutral-600 flex flex-col sm:flex-row justify-between gap-2">
          <p>© {new Date().getFullYear()} Thievn's Den</p>
          <p>Some links may be affiliate links.</p>
        </div>
      </div>
    </footer>
  );
}
