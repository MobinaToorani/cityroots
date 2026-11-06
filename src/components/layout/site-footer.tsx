import type { Route } from "next";
import Link from "next/link";
import { Logo } from "./logo";
import { features } from "@/lib/env";

const LINKS: { href: Route; label: string; show?: () => boolean }[] = [
  { href: "/guides", label: "Guides" },
  { href: "/submit", label: "Suggest a place" },
  { href: "/pricing", label: "Pro" },
  { href: "/about", label: "About" },
  { href: "/business", label: "Claim your listing", show: features.business },
  { href: "/partners", label: "For partners", show: features.partners },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-divider pt-8 pb-28 lg:pb-8">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Logo />
          <p className="text-meta text-text-muted">No ads. Nobody pays for placement.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-meta text-text-muted">
            {LINKS.filter((l) => !l.show || l.show()).map((l) => (
              <li key={l.href}>
                <Link className="hover:text-text" href={l.href} prefetch={false}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="w-full text-meta text-text-muted">
          Contains information licensed under the{" "}
          <a
            className="underline hover:text-text"
            href="https://open.toronto.ca/open-data-license/"
            rel="license noopener"
          >
            Open Government Licence &ndash; Toronto
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
