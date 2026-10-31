import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Container } from "@/components/ui/section";
import { getSiteStats } from "@/lib/data/cities";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "How CityRoots works",
  description:
    "Our mission, how CityRoots is funded without selling placement, how listings are ranked, and the open data license.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const stats = await getSiteStats();
  return (
    <div className="pt-32 pb-8 color-field">
      <Container className="max-w-3xl">
        <p className="text-meta font-semibold text-primary-text">About CityRoots</p>
        <h1 className="mt-2 font-display text-display font-medium tracking-tight">
          Your city has more to offer than you think, and a lot of it is free.
        </h1>
        <p className="mt-6 text-lg text-text-muted">
          CityRoots lists {stats.places} places, programs, and events across {stats.cities} Ontario
          cities. {stats.freeShare}% of them cost nothing. Every listing says what it costs, and the
          free ones always come first.
        </p>

        <Block id="model" title="How we make money">
          <p>
            The rule is simple: <strong>pay for tools, never for placement.</strong> There are no
            ads, and no business, partner, or subscriber can buy a better spot.
          </p>
          <ul className="mt-4 grid gap-3">
            <Item title="CityRoots Pro, for people">
              Browsing, search, filters, and the map stay free. Pro adds planning tools like the Day
              Planner and unlimited collections, for $4.99 a month.{" "}
              <Link href="/pricing" className="text-primary-text quiet-link">
                See what Pro includes
              </Link>
              .
            </Item>
            <Item title="Partners, for organizations">
              Libraries, municipalities, and student unions can license our data and embed city
              guides on their own sites.
            </Item>
            <Item title="Business tools, for listed places">
              Any listed place can claim its listing for free to keep hours and prices accurate.
              Optional analytics come later. None of it changes where a place shows up.
            </Item>
          </ul>
        </Block>

        <Block id="ranking" title="How listings are ordered">
          <p>
            The default order puts free listings first. Within that, the order uses only community
            signals:
          </p>
          <ul className="mt-3 list-disc pl-5">
            <li>whether a curator picked it as a good first visit</li>
            <li>tips left by people who have been</li>
            <li>how often it gets saved</li>
            <li>how recently the details were checked</li>
            <li>how well it matches your search</li>
          </ul>
          <p className="mt-3">
            Payment, subscription, and claimed-listing status are not inputs. That rule is enforced
            in our code and checked by an automated test on every change.
          </p>
        </Block>

        <Block id="data" title="Open data license">
          <p>
            Listings are published under the{" "}
            <a
              className="text-primary-text quiet-link"
              href="https://creativecommons.org/licenses/by/4.0/"
              rel="license noopener"
              target="_blank"
            >
              Creative Commons Attribution 4.0 license
            </a>
            . You can reuse them for anything, including commercial projects, as long as you credit
            CityRoots and link back. City photographs belong to their photographers and carry their
            own licenses, credited on each image.
          </p>
        </Block>

        <Block id="community" title="Who curates it">
          <p>
            Listings come from people who live in each city. Every addition and correction is
            reviewed before it goes live, and details are checked again over time. Prices and hours
            change, so a quick look at the official website before you go is always a good idea.
          </p>
        </Block>

        <div className="mt-12 flex flex-wrap gap-3">
          <ButtonLink href="/explore">Start exploring</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Pick a city
          </ButtonLink>
        </div>
      </Container>
    </div>
  );
}

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-14 scroll-mt-28 text-body">
      <h2 id={id} className="mb-3 text-section font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Item({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li>
      <GlassCard className="p-4">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-text-muted">{children}</p>
      </GlassCard>
    </li>
  );
}
