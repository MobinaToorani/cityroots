import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <div className="pt-8">
      <Container className="reading">
        <h1 className="page-title">Your city has more to offer than you think.</h1>
        <p className="mt-6 text-lg text-text-muted">
          CityRoots lists {stats.places} places, programs, and events across {stats.cities} Ontario
          cities. {stats.freeShare}% of them cost nothing. Every listing says what it costs, and the
          free ones always come first.
        </p>

        <Block id="model" title="How we make money">
          <p>
            You can pay for tools, but <strong>never for placement.</strong> There are no ads, and
            no business, partner, or subscriber can buy a better spot.
          </p>
          <ul className="mt-4 grid gap-3">
            <Item title="CityRoots Pro, for people">
              Browsing, the map, and planning a day stay free. Pro keeps your plans and adds
              unlimited collections, for $4.99 a month.{" "}
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

        <Block id="data" title="Where the data comes from">
          <p>
            Listings are written by hand or built from public sources and checked. Toronto draws on
            the City&apos;s open data and contains information licensed under the{" "}
            <a
              className="text-primary-text quiet-link"
              href="https://open.toronto.ca/open-data-license/"
              rel="license noopener"
              target="_blank"
            >
              Open Government Licence &ndash; Toronto
            </a>
            . In the other cities, event dates come from public library, municipal, and tourism
            calendars, and each one links back to its source. Some facility details come from
            Statistics Canada&apos;s open databases under the{" "}
            <a
              className="text-primary-text quiet-link"
              href="https://www.statcan.gc.ca/en/reference/licence"
              rel="license noopener"
              target="_blank"
            >
              Statistics Canada Open Licence
            </a>
            .
          </p>
          <p className="mt-3">
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

        <Block id="privacy" title="Privacy">
          <p>
            CityRoots sets no advertising or tracking cookies. Visits are counted with Plausible,
            which keeps no personal data and does not follow you across sites. If you sign in, your
            email is used only to send sign-in links and replies about things you sent us. We never
            sell or share it. Payments go through Stripe; we never see your card. The{" "}
            <Link href="/privacy" className="text-primary-text quiet-link">
              privacy policy
            </Link>{" "}
            has the details.
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
      <h2 id={id} className="mb-3 font-display text-section font-medium tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Item({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li>
      <Card className="p-4">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-text-muted">{children}</p>
      </Card>
    </li>
  );
}
