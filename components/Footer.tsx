import Link from "next/link";
import { Leaf } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-100 bg-white mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-brand" />
              <span className="font-semibold text-zinc-900 text-sm">CityRoots</span>
            </div>
            <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
              Free and affordable local resources, organized by every part of life.
            </p>
          </div>
          <nav className="flex flex-col sm:flex-row gap-3 sm:gap-6">
            {[
              { href: "/explore", label: "Explore" },
              { href: "/about", label: "About" },
              { href: "/submit", label: "Submit a place" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs text-zinc-400">Community-built. No ads, no sponsored listings.</p>
          <p className="text-xs text-zinc-300">&copy; {new Date().getFullYear()} CityRoots</p>
        </div>
      </div>
    </footer>
  );
}
