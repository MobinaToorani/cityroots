import Link from "next/link";
import { LogoMark } from "./logo";
import { Container } from "@/components/ui/section";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-divider pt-12 pb-32 md:pb-12">
      <Container className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-bold">CityRoots</span>
          </div>
          <p className="mt-3 text-meta text-text-muted">
            Free and low-cost things to do across the GTA and Waterloo Region, curated by people who
            live here. No ads, and nobody pays for placement.
          </p>
        </div>
        <nav aria-label="Footer">
          <h2 className="text-meta font-semibold">Product</h2>
          <ul className="mt-3 grid gap-2 text-meta text-text-muted">
            <li>
              <Link className="quiet-link" href="/explore">
                Explore places
              </Link>
            </li>
            <li>
              <Link className="quiet-link" href="/events">
                Events calendar
              </Link>
            </li>
            <li>
              <Link className="quiet-link" href="/planner">
                Day Planner
              </Link>
            </li>
            <li>
              <Link className="quiet-link" href="/pricing">
                CityRoots Pro
              </Link>
            </li>
            <li>
              <Link className="quiet-link" href="/submit">
                Suggest a place
              </Link>
            </li>
            <li>
              <Link className="quiet-link" href="/about">
                How CityRoots works
              </Link>
            </li>
            <li>
              <Link className="quiet-link" href="/account">
                Your account
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <h2 className="text-meta font-semibold">Open data</h2>
          <p className="mt-3 text-meta text-text-muted">
            Listings are published under{" "}
            <a
              className="text-text quiet-link"
              href="https://creativecommons.org/licenses/by/4.0/"
              rel="license noopener"
              target="_blank"
            >
              CC BY 4.0
            </a>
            . Use them, cite CityRoots, and tell us what you build.{" "}
            <Link className="text-text quiet-link" href="/about#data">
              Read the data license
            </Link>
            .
          </p>
        </div>
      </Container>
      <Container className="mt-10 text-meta text-text-muted">
        <p>&copy; {year} CityRoots. Made in Ontario.</p>
      </Container>
    </footer>
  );
}
