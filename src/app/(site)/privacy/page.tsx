import type { Metadata } from "next";
import Link from "next/link";
import { ContactLink, LegalPage, LegalSection } from "@/components/features/legal-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What CityRoots collects, why, who processes it for us, and how to see, fix, or delete your information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="2026-11-04"
      intro={
        <p>
          You can browse, search, and use the map without an account, and we do not use advertising
          or tracking cookies. This page explains the little we do collect, why, and how to get it
          changed or deleted.
        </p>
      }
    >
      <LegalSection id="collect" title="What we collect">
        <ul>
          <li>
            <strong>Your account.</strong> Your email address, so we can send sign-in links. If you
            sign in with Google, we also receive your name and profile photo.
          </li>
          <li>
            <strong>What you save.</strong> Collections and day plans.
          </li>
          <li>
            <strong>What you send us.</strong> Suggestions, corrections, tips, and business claims,
            with the details you type in. An email address on a suggestion is optional and is used
            only to tell you it was reviewed.
          </li>
          <li>
            <strong>CityRoots Pro.</strong> Your plan, its status, and the Stripe customer and
            subscription IDs. Stripe handles your card; we never see or store it.
          </li>
          <li>
            <strong>Abuse protection.</strong> To limit spam, we count requests per network address.
            We store a one-way hash of the address, never the address itself, and delete old counts
            on a rolling basis.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="analytics" title="Analytics and cookies">
        <p>
          Visits are counted with Plausible, which sets no cookies, keeps no personal data, and does
          not follow you across sites. We see totals, such as how many people opened a guide.
        </p>
        <p>
          The only cookies CityRoots sets are the ones that keep you signed in and protect sign-in
          from forgery. Sessions last up to 30 days. Stripe sets its own cookies on its checkout and
          billing pages.
        </p>
      </LegalSection>

      <LegalSection id="use" title="How we use it">
        <p>
          We use your information to run the features you use: signing in, saving places, planning
          days, reviewing what you send, and managing Pro. We email you only about your account,
          your subscription, and things you sent us. We do not sell or rent personal information,
          and we do not use it for advertising.
        </p>
      </LegalSection>

      <LegalSection id="processors" title="Who processes it for us">
        <p>
          These services handle information on our behalf, only to provide CityRoots. Some store it
          outside Canada, including in the United States, where it is subject to local law.
        </p>
        <ul>
          <li>Vercel, which hosts the site.</li>
          <li>Neon, which hosts our database.</li>
          <li>Resend, which sends our email.</li>
          <li>Stripe, which processes payments for Pro.</li>
          <li>Plausible, which counts visits without personal data.</li>
          <li>Google, only if you choose to sign in with Google.</li>
          <li>Slack, where our curators are told about new suggestions and claims.</li>
        </ul>
      </LegalSection>

      <LegalSection id="public" title="What becomes public">
        <p>
          Listings are open data. If we publish a suggestion, correction, or tip, its content
          becomes part of a listing, without your name or email. Each day plan has its own
          hard-to-guess link. Anyone you give the link to can see the plan until you delete it.
        </p>
      </LegalSection>

      <LegalSection id="keep" title="How long we keep it">
        <p>
          We keep your account and what you saved while your account is open. If you ask us to
          delete your account, we delete it along with your sessions, collections, plans, claims,
          and subscription record. Suggestions and tips we already published stay, with nothing
          linking them to you. Stripe keeps payment records as financial law requires.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="Your choices and rights">
        <p>
          You can ask to see the personal information we hold about you, have it corrected, or have
          your account deleted. Email <ContactLink /> from the address on your account and we will
          reply within 30 days. You can cancel Pro at any time from your{" "}
          <Link href="/account">account</Link>.
        </p>
        <p>
          If you are not satisfied with our answer, you can contact the{" "}
          <a href="https://www.priv.gc.ca/" rel="noopener" target="_blank">
            Office of the Privacy Commissioner of Canada
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection id="children" title="Children">
        <p>
          Accounts are not meant for children under 13, and we do not knowingly collect their
          personal information. If you think a child has given us theirs, email us and we will
          delete it.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes and contact">
        <p>
          If we change this policy, we will update the date at the top, and we will email account
          holders before any change to how we use information they already gave us. Questions go to{" "}
          <ContactLink />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
