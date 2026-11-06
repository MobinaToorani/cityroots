import type { Metadata } from "next";
import Link from "next/link";
import { ContactLink, LegalPage, LegalSection } from "@/components/features/legal-page";

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "The rules for using CityRoots: listings, accounts, CityRoots Pro, what you send us, and the open data license.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      updated="2026-11-04"
      intro={
        <p>
          These terms apply when you use CityRoots. By using the site you agree to them. If you do
          not agree, please do not use CityRoots. Our <Link href="/privacy">privacy policy</Link>{" "}
          explains how we handle personal information.
        </p>
      }
    >
      <LegalSection id="listings" title="Listings are a starting point">
        <p>
          We check listings carefully, but hours, prices, and dates change, and places close. Always
          confirm with the place or organizer before you go. A listing is not an endorsement, and we
          are not responsible for the places, programs, or events we list, or for what happens when
          you visit them.
        </p>
        <p>
          Nobody pays for placement. Free listings come first, and the{" "}
          <Link href="/about#ranking">ranking rules</Link> are public.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="Your account">
        <p>
          You need an account only to save places, plan days, claim a listing, or subscribe to Pro.
          Keep access to your email secure, since sign-in links go there. You are responsible for
          what happens under your account.
        </p>
      </LegalSection>

      <LegalSection id="pro" title="CityRoots Pro">
        <ul>
          <li>
            Pro is billed monthly or yearly in Canadian dollars, at the price shown on the{" "}
            <Link href="/pricing">pricing page</Link> when you subscribe. Stripe processes the
            payment.
          </li>
          <li>
            Your subscription renews automatically at the end of each period until you cancel.
          </li>
          <li>
            You can cancel at any time from your <Link href="/account">account</Link>. You keep Pro
            until the end of the period you paid for and are not charged again.
          </li>
          <li>We will email you before a price change applies to your subscription.</li>
          <li>If you think you were charged in error, email us and we will look into it.</li>
        </ul>
      </LegalSection>

      <LegalSection id="contributions" title="What you send us">
        <p>
          When you send a suggestion, correction, tip, or claim, you confirm that it is accurate as
          far as you know and that you have the right to share it. You let us edit it and publish it
          as part of our listings under the same open license as the rest of our data. Curators may
          change or decline anything we receive.
        </p>
        <p>
          Claiming a listing lets you keep its details accurate. It does not change where the place
          appears. Only claim a place you are authorized to represent.
        </p>
      </LegalSection>

      <LegalSection id="use" title="Fair use">
        <p>Please do not:</p>
        <ul>
          <li>send false, misleading, or spam suggestions, tips, or claims;</li>
          <li>try to get around rate limits, or overload or interfere with the site;</li>
          <li>use another person&rsquo;s account or share partner API keys.</li>
        </ul>
        <p>We may remove content or suspend access to stop abuse.</p>
      </LegalSection>

      <LegalSection id="data" title="Open data">
        <p>
          Listing data is published under the{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            rel="license noopener"
            target="_blank"
          >
            Creative Commons Attribution 4.0 license
          </a>
          . You may reuse it if you credit CityRoots. Photos are credited on the page where they
          appear and keep their own licenses. The CityRoots name, logo, and site design are not
          covered by the open license.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="Liability">
        <p>
          CityRoots is provided as it is. To the extent the law allows, we make no promises that the
          site will always be available or error free, and we are not liable for indirect losses
          from using it. Nothing in these terms limits rights you have under consumer protection
          law.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes, law, and contact">
        <p>
          We may update these terms. We will change the date at the top, and email account holders
          about changes that affect them. These terms are governed by the laws of Ontario and of
          Canada. Questions go to <ContactLink />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
