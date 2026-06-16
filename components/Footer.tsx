import Link from "next/link";
import { Leaf } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#F7F4EF] dark:bg-[#0F0E0C] border-t border-[#E5DED4]/60 dark:border-[#2E2A24]/60 mt-auto">
      {/* Gradient top accent */}
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(to right, transparent, rgba(61,107,82,0.3), rgba(106,173,130,0.5), rgba(61,107,82,0.3), transparent)" }}
      />
      {/* Subtle aura */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top, rgba(61,107,82,0.04) 0%, transparent 70%)" }}
      />
      <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">

          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Leaf className="w-4 h-4 text-brand shrink-0" />
              <span className="font-serif text-[18px] font-medium tracking-[-0.01em] text-stone-800 dark:text-stone-100">
                CityRoots
              </span>
            </div>
            <p className="text-[12px] text-stone-400 dark:text-stone-500 max-w-[240px] leading-relaxed">
              Free and affordable local resources, organized by every part of life.
            </p>
          </div>

          {/* Nav */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            {[
              { href: "/explore", label: "Explore cities" },
              { href: "/about",   label: "About" },
              { href: "/submit",  label: "Submit a place" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-[#E5DED4]/50 dark:border-[#2E2A24]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[11px] text-stone-400 dark:text-stone-600 tracking-wide">
            Community-built &middot; no ads &middot; no sponsored listings
          </p>
          <p className="text-[11px] text-stone-300 dark:text-stone-700">
            &copy; {new Date().getFullYear()} CityRoots
          </p>
        </div>
      </div>
    </footer>
  );
}
