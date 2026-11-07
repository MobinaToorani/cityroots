import { ArrowUpRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { LogoMark } from "./logo";
import { Icon } from "@/components/ui/icon";
import { features } from "@/lib/env";

type FooterLink = { href: Route; label: string; show?: () => boolean };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Find",
    links: [
      { href: "/explore", label: "Things to do" },
      { href: "/events", label: "What's on" },
      { href: "/planner", label: "Plan a day" },
      { href: "/guides", label: "Guides" },
    ],
  },
  {
    title: "CityRoots",
    links: [
      { href: "/about", label: "About" },
      { href: "/pricing", label: "Pro" },
      { href: "/business", label: "Claim your listing", show: features.business },
      { href: "/partners", label: "For partners", show: features.partners },
    ],
  },
  {
    title: "Fine print",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

/**
 * Dark in both themes, so the page ends firmly. Fixed colours rather than tokens,
 * because the ink token flips to light in dark mode.
 */
export function SiteFooter() {
  return (
    <footer className="mt-24 bg-[#0b0f14] pb-24 text-white sm:mt-32 lg:pb-0">
      <div className="page-frame pt-12 sm:pt-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="max-w-sm rounded-card bg-white p-5 text-[#12161c]">
            <p className="font-semibold tracking-tight">Know a free spot we&apos;re missing?</p>
            <p className="mt-1 text-meta text-[#525a65]">
              Tell us and we&apos;ll check it. No ads, and nobody pays for placement.
            </p>
            <Link
              href="/submit"
              prefetch={false}
              className="touch-target relative mt-4 inline-flex h-9 items-center gap-1.5 rounded-full border border-[#12161c]/20 px-4 text-meta font-semibold hover:border-[#12161c]"
            >
              Suggest a place
              <Icon icon={ArrowUpRight} size={16} />
            </Link>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-meta font-semibold text-white/60">{col.title}</p>
                <ul className="mt-3 grid gap-2.5 text-meta">
                  {col.links
                    .filter((l) => !l.show || l.show())
                    .map((l) => (
                      <li key={l.href}>
                        <Link
                          className="touch-target relative text-white/90 hover:text-white hover:underline"
                          href={l.href}
                          prefetch={false}
                        >
                          {l.label}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <Link
          href="/"
          prefetch={false}
          aria-label="CityRoots home"
          className="mt-14 flex items-center gap-[0.18em] text-[clamp(3.5rem,1rem+12vw,11rem)] leading-none font-medium tracking-tight sm:mt-20"
        >
          <LogoMark className="size-[0.8em] shrink-0" />
          <span className="font-display text-[#f4efe6]">CityRoots</span>
        </Link>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-white/15 py-6 text-meta text-white/65">
          <p>&copy; {new Date().getFullYear()} CityRoots</p>
          <p>
            Contains information licensed under the{" "}
            <a
              className="underline hover:text-white"
              href="https://open.toronto.ca/open-data-license/"
              rel="license noopener"
            >
              Open Government Licence &ndash; Toronto
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
