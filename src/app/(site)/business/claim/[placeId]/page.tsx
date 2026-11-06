import { CircleCheck } from "lucide-react";
import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/section";
import { requireUser } from "@/lib/auth/session";
import { getClaimTarget, hasPendingClaim } from "@/lib/data/claims";
import { features } from "@/lib/env";
import { emailMatchesWebsite } from "@/lib/domain/claim";
import { ClaimForm } from "./claim-form";

export const metadata: Metadata = { title: "Claim a listing", robots: { index: false } };

export default async function ClaimPage(props: PageProps<"/business/claim/[placeId]">) {
  if (!features.business()) notFound();
  const [{ placeId }, query] = await Promise.all([props.params, props.searchParams]);
  const user = await requireUser(`/business/claim/${placeId}`);
  const place = await getClaimTarget(placeId);
  if (!place) notFound();
  const pending = await hasPendingClaim(user.id, place.id);
  const match = emailMatchesWebsite(user.email, place.sourceUrl);

  return (
    <div className="pt-10 pb-8">
      <Container className="max-w-2xl">
        {query.sent || pending ? (
          <EmptyState
            icon={CircleCheck}
            headingLevel="h1"
            title="Your claim is in"
            action={
              <ButtonLink href={`/places/${place.id}` as Route} size="sm">
                Back to {place.name}
              </ButtonLink>
            }
          >
            A curator reviews claims for {place.name}, usually within a week, and emails{" "}
            {user.email} with the result.
          </EmptyState>
        ) : place.claimed ? (
          <EmptyState
            icon={CircleCheck}
            headingLevel="h1"
            title="This listing is already claimed"
            action={
              <ButtonLink href={`/submit?type=correction&place=${place.id}` as Route} size="sm">
                Suggest a correction instead
              </ButtonLink>
            }
          >
            If you also run {place.name}, send a correction and mention it. A curator will get in
            touch.
          </EmptyState>
        ) : (
          <>
            <p className="text-meta font-semibold text-primary-text">Claim a listing</p>
            <h1 className="mt-2 font-display text-section font-medium tracking-tight">
              {place.name}, {place.cityName}
            </h1>
            <Card className="mt-5 p-4 text-body">
              {match
                ? `You are signed in as ${user.email}, which matches the listing's website. That usually means we can confirm you quickly.`
                : `You are signed in as ${user.email}. A curator will confirm you by calling the number on the listing, or sign in with an address at your website's domain to speed that up.`}
            </Card>
            <div className="mt-8">
              <ClaimForm placeId={place.id} />
            </div>
          </>
        )}
      </Container>
    </div>
  );
}
