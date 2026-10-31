import { Search } from "lucide-react";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CostBadge } from "@/components/ui/badges";
import { Icon } from "@/components/ui/icon";
import { Container } from "@/components/ui/section";
import { queryPlaces } from "@/lib/data/places";
import { features } from "@/lib/env";
import { defaultExploreState } from "@/lib/domain/explore-params";

export const metadata: Metadata = {
  title: "Claim your listing",
  description:
    "Run a place listed on CityRoots? Claim it for free to keep your hours, prices, accessibility details, and website accurate.",
  alternates: { canonical: "/business" },
};

export default async function BusinessPage(props: PageProps<"/business">) {
  if (!features.business()) notFound();
  const { q } = await props.searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 80) : "";
  const results = query
    ? (await queryPlaces(defaultExploreState({ q: query }))).items.slice(0, 12)
    : [];

  return (
    <div className="pt-32 pb-8 color-field">
      <Container className="max-w-3xl">
        <p className="text-meta font-semibold text-primary-text">For places on CityRoots</p>
        <h1 className="mt-2 font-display text-display font-medium tracking-tight">
          Claim your listing. It is free.
        </h1>
        <p className="mt-6 text-lg text-text-muted">
          If you run a place, program, or event listed here, claim it to keep the details right:
          your hours, what things cost, accessibility, and your website. A curator checks every
          change before it goes live.
        </p>

        <section aria-labelledby="find" className="mt-10">
          <h2 id="find" className="text-card font-semibold">
            Find your listing
          </h2>
          <form
            method="get"
            action="/business"
            role="search"
            className="mt-3 flex max-w-xl items-center gap-2 rounded-full p-1.5 pl-5 glass-strong"
          >
            <Icon icon={Search} className="shrink-0 text-text-muted" />
            <label htmlFor="business-search" className="sr-only">
              Name of your place
            </label>
            <input
              id="business-search"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Name of your place"
              className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-text-muted"
            />
            <button
              type="submit"
              className="h-11 shrink-0 rounded-full bg-primary px-5 font-semibold text-white hover:bg-primary-hover"
            >
              Search
            </button>
          </form>
          {query && (
            <div className="mt-5">
              {results.length > 0 ? (
                <ul className="divide-y divide-divider border-y border-divider">
                  {results.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-meta text-text-muted">
                          {[p.neighborhood, p.cityName].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <CostBadge band={p.costBand} />
                        <Link
                          href={`/business/claim/${p.id}` as Route}
                          className="text-meta font-semibold text-primary-text quiet-link"
                        >
                          Claim {p.name}
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p role="status" className="text-body text-text-muted">
                  No listing matches &ldquo;{query}&rdquo;. Try a shorter name, or{" "}
                  <Link href="/submit" className="font-semibold text-primary-text quiet-link">
                    suggest your place
                  </Link>{" "}
                  so it can be listed first.
                </p>
              )}
            </div>
          )}
        </section>

        <Block id="what" title="What claiming does">
          <ul className="grid list-disc gap-2 pl-5">
            <li>
              You can confirm or correct hours, the cost band, prices, accessibility, and your
              website.
            </li>
            <li>Your listing says its details were confirmed by the people who run it.</li>
            <li>We contact you about corrections the community suggests.</li>
          </ul>
        </Block>

        <Block id="rule" title="What it never does">
          <p>
            Claiming, now or with any paid plan later, never changes where a listing appears. The
            order on CityRoots uses only community signals: tips, saves, curator Picks, and how
            recently details were checked. Free listings always come first.
          </p>
        </Block>

        <Block id="presence" title="Coming later: Presence">
          <p>
            An optional plan for $29 a month with views of your listing, publishing your own events,
            and replies to community tips. It is not available yet, and it will follow the same
            rule: no effect on ranking.
          </p>
        </Block>

        <Block id="verify" title="How we verify you">
          <p>
            Sign in with an email address at your website&rsquo;s domain and we can usually confirm
            you the same week. Otherwise a curator calls the number on your listing.
          </p>
        </Block>
      </Container>
    </div>
  );
}

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-14 text-body text-text-muted">
      <h2 id={id} className="mb-3 text-section font-semibold tracking-tight text-text">
        {title}
      </h2>
      {children}
    </section>
  );
}
