import type { Metadata } from "next";
import { GOALS, goal } from "@/lib/analytics";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Container } from "@/components/ui/section";
import { features } from "@/lib/env";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "CityRoots for partners",
  description:
    "Libraries, municipalities, BIAs, campus unions, and tourism offices can embed CityRoots city guides and use our listings data through an API.",
  alternates: { canonical: "/partners" },
};

const CONTACT = "mailto:hello@cityroots.ca?subject=CityRoots%20partner%20program";

export default function PartnersPage() {
  if (!features.partners()) notFound();
  const embedSrc = absoluteUrl("/embed/newmarket?cost=free&limit=5");
  const snippet = `<iframe src="${embedSrc}" title="Free things to do in Newmarket, from CityRoots" width="100%" height="560" style="border:0" loading="lazy"></iframe>`;
  const curl = `curl -H "Authorization: Bearer cr_live_..." "${absoluteUrl("/api/v1/places?city=newmarket&cost=free&per_page=20")}"`;

  return (
    <div className="pt-10 pb-8">
      <Container className="max-w-3xl">
        <p className="text-meta font-semibold text-primary-text">Partner program</p>
        <h1 className="mt-2 font-display text-display font-medium tracking-tight">
          Put free things to do on your own site.
        </h1>
        <p className="mt-6 text-lg text-text-muted">
          Libraries, municipalities, business improvement areas, campus student unions, and tourism
          offices can show CityRoots listings to the people they serve. The listings stay current
          because a community keeps them that way, and they are ordered the same way as on
          CityRoots: free first, and nobody pays for placement, partners included.
        </p>
        <a
          href={CONTACT}
          className={buttonClasses("primary", "lg", `mt-8 ${goal(GOALS.partnerContact)}`)}
        >
          Talk to us about partnering
        </a>

        <Block id="widget" title="An embeddable city guide">
          <p>
            One line of HTML adds a city&rsquo;s listings to your page. Choose the city, filter by
            category or cost, and set how many to show. Every listing links back to its full page on
            CityRoots.
          </p>
          <div className="mt-5 overflow-hidden rounded-[var(--radius-card)] border border-divider bg-surface-solid">
            <iframe
              src="/embed/newmarket?cost=free&limit=5"
              title="Example widget: free things to do in Newmarket"
              className="h-[560px] w-full border-0"
              loading="lazy"
            />
          </div>
          <label htmlFor="embed-snippet" className="mt-5 block text-meta font-semibold text-text">
            Copy this into your page
          </label>
          <textarea
            id="embed-snippet"
            readOnly
            rows={4}
            value={snippet}
            className="mt-1 w-full rounded-2xl border border-divider bg-surface-solid p-3 text-meta text-text"
          />
          <p className="mt-2 text-meta">
            Options: <code>cat</code> (for example <code>arts,food</code>), <code>cost</code> (
            <code>free</code>, <code>low</code>, <code>moderate</code>, <code>varies</code>), and{" "}
            <code>limit</code> (1 to 20).
          </p>
        </Block>

        <Block id="api" title="A data API">
          <p>
            Read places, cities, and upcoming events as JSON, in the same order as the site. Each
            organization gets its own key, issued by our team, with up to 1,000 requests an hour.
            Keep the key on your server; it is not meant for browsers.
          </p>
          <dl className="mt-5 grid gap-3">
            <Endpoint path="GET /api/v1/places">
              Filters: <code>city</code>, <code>category</code>, <code>cost</code>,{" "}
              <code>type</code>, <code>q</code>, <code>page</code>, <code>per_page</code> (up to
              100).
            </Endpoint>
            <Endpoint path="GET /api/v1/cities">Live cities with listing counts.</Endpoint>
            <Endpoint path="GET /api/v1/events">
              Filters: <code>city</code>, <code>free=true</code>, <code>limit</code>. Events known
              only by month say so with <code>precision: &quot;month&quot;</code>.
            </Endpoint>
          </dl>
          <label htmlFor="api-example" className="mt-5 block text-meta font-semibold text-text">
            Example request
          </label>
          <textarea
            id="api-example"
            readOnly
            rows={3}
            value={curl}
            className="mt-1 w-full rounded-2xl border border-divider bg-surface-solid p-3 text-meta text-text"
          />
          <p className="mt-2 text-meta">
            Listings are licensed CC BY 4.0. Every response includes the attribution to show.
          </p>
        </Block>

        <Block id="guides" title="Co-branded seasonal guides">
          <p>
            We write a guide with you, like &ldquo;Free Summer in Newmarket&rdquo;, published on
            your site and ours with both names on it. The places in it come from the same listings,
            with the same rules.
          </p>
        </Block>

        <Block id="terms" title="How it works">
          <ul className="grid list-disc gap-2 pl-5">
            <li>Partnerships are invoiced yearly, priced by the size of the community served.</li>
            <li>
              Partners get no say in ranking, Picks, or which places appear. That is what keeps the
              listings worth embedding.
            </li>
            <li>Widgets and the API include only published listings, never ads.</li>
          </ul>
          <a
            href={CONTACT}
            className={buttonClasses("secondary", "md", `mt-6 ${goal(GOALS.partnerContact)}`)}
          >
            Email us about your city
          </a>
        </Block>
      </Container>
    </div>
  );
}

function Block({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-16 text-body text-text-muted">
      <h2 id={id} className="mb-3 text-section font-semibold tracking-tight text-text">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Endpoint({ path, children }: { path: string; children: ReactNode }) {
  return (
    <div className="border-t border-divider pt-3">
      <dt className="font-semibold text-text">{path}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
