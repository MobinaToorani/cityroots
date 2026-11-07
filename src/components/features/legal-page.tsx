import type { ReactNode } from "react";
import { Container } from "@/components/ui/section";

export const CONTACT_EMAIL = "hello@cityroots.ca";

const updatedFormat = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "long",
  timeZone: "UTC",
});

/** Plain, readable layout for the privacy policy and terms. */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  /** ISO date the text last changed. */
  updated: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="page-top">
      <Container className="reading">
        <h1 className="page-title">{title}</h1>
        <p className="mt-3 text-meta text-text-muted">
          Last updated <time dateTime={updated}>{updatedFormat.format(new Date(updated))}</time>
        </p>
        <div className="mt-6 text-lg text-text-muted">{intro}</div>
        <div className="mt-4 grid gap-12 text-body [&_a]:font-semibold [&_a]:text-primary-text [&_li]:mt-2 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6">
          {children}
        </div>
      </Container>
    </div>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="scroll-mt-28 [&>p+p]:mt-3">
      <h2 id={id} className="mb-3 font-display text-section font-medium tracking-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ContactLink() {
  return <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
}
